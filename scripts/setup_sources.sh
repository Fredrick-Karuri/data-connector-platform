#!/usr/bin/env bash
# scripts/setup_sources.sh
# Waits for all mock source containers to be healthy, then verifies seed data.
# Called manually via: make seed
# Design ref: p.23 — "setup_sources.sh runs during docker-compose up phase"

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[SEED]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }

# ── Wait helper ────────────────────────────────────────────────────────────────
wait_for() {
  local name=$1
  local cmd=$2
  local retries=30
  local wait=3

  log "Waiting for $name..."
  for i in $(seq 1 $retries); do
    if eval "$cmd" &>/dev/null; then
      log "$name is ready."
      return 0
    fi
    echo "  attempt $i/$retries — retrying in ${wait}s..."
    sleep $wait
  done
  fail "$name did not become ready in time."
}

# ── PostgreSQL ─────────────────────────────────────────────────────────────────
wait_for "mock_postgres" \
  "docker exec dcp_mock_postgres pg_isready -U mock_user -d mock_postgres_db"

PG_COUNT=$(docker exec dcp_mock_postgres \
  psql -U mock_user -d mock_postgres_db -tAc "SELECT COUNT(*) FROM inventory_items;" 2>/dev/null || echo "0")

if [ "$PG_COUNT" -ge 15 ]; then
  log "PostgreSQL: $PG_COUNT inventory_items rows found — already seeded."
else
  log "PostgreSQL: seeding inventory_items..."
  docker exec -i dcp_mock_postgres \
    psql -U mock_user -d mock_postgres_db < "$(dirname "$0")/seed_postgres.sql"

  PG_COUNT=$(docker exec dcp_mock_postgres \
    psql -U mock_user -d mock_postgres_db -tAc "SELECT COUNT(*) FROM inventory_items;" 2>/dev/null || echo "0")
  log "PostgreSQL: seed complete. Total rows: $PG_COUNT"
fi

# ── MySQL ──────────────────────────────────────────────────────────────────────
wait_for "mock_mysql" \
  "docker exec dcp_mock_mysql mysqladmin ping -h localhost -umock_user -pmock_pass --silent"

MY_COUNT=$(docker exec dcp_mock_mysql \
  mysql -umock_user -pmock_pass -D mock_mysql_db -sNe "SELECT COUNT(*) FROM customer_leads;" 2>/dev/null || echo "0")

if [ "$MY_COUNT" -ge 15 ]; then
  log "MySQL: $MY_COUNT customer_leads rows found — already seeded."
else
  log "MySQL: seeding customer_leads..."
  docker exec -i dcp_mock_mysql \
    mysql -umock_user -pmock_pass mock_mysql_db < "$(dirname "$0")/seed_mysql.sql"
  
  MY_COUNT=$(docker exec dcp_mock_mysql \
    mysql -umock_user -pmock_pass -D mock_mysql_db -sNe "SELECT COUNT(*) FROM customer_leads;" 2>/dev/null || echo "0")

  log "MySQL: seed complete. Total rows: $MY_COUNT"

fi

# ── MongoDB ────────────────────────────────────────────────────────────────────
wait_for "mock_mongo" \
  "docker exec dcp_mock_mongo mongosh --quiet --eval \"db.adminCommand('ping')\""

MONGO_COUNT=$(docker exec dcp_mock_mongo \
  mongosh --quiet -u mock_user -p mock_pass --authenticationDatabase admin \
  mock_mongo_db --eval "db.user_logs.countDocuments()" 2>/dev/null || echo "0")

if [ "$MONGO_COUNT" -ge 6 ]; then
  log "MongoDB: $MONGO_COUNT user_log documents found — already seeded."
else
  log "MongoDB: seeding user_logs..."
  docker exec -i dcp_mock_mongo \
    mongosh -u mock_user -p mock_pass --authenticationDatabase admin \
    mock_mongo_db < "$(dirname "$0")/seed_mongo.js"
  
  MONGO_COUNT=$(docker exec dcp_mock_mongo \
    mongosh --quiet -u mock_user -p mock_pass --authenticationDatabase admin \
      mock_mongo_db --eval "db.user_logs.countDocuments()" 2>/dev/null || echo "0")

  log "MongoDB: seed complete. Total docs: $MONGO_COUNT"
fi

# ── ClickHouse ─────────────────────────────────────────────────────────────────
wait_for "mock_clickhouse" \
  "docker exec dcp_mock_clickhouse clickhouse-client --user mock_user --password mock_pass --query 'SELECT 1'"

CH_COUNT=$(docker exec dcp_mock_clickhouse \
  clickhouse-client --user mock_user --password mock_pass \
  --query "SELECT COUNT(*) FROM mock_clickhouse_db.sensor_readings" 2>/dev/null || echo "0")

if [ "$CH_COUNT" -ge 50 ]; then
  log "ClickHouse: $CH_COUNT sensor_readings rows found — already seeded."
else
  log "ClickHouse: seeding sensor_readings..."
  docker exec -i dcp_mock_clickhouse \
    clickhouse-client --user mock_user --password mock_pass \
    --multiquery < "$(dirname "$0")/seed_clickhouse.sql"
  
  CH_COUNT=$(docker exec dcp_mock_clickhouse \
    clickhouse-client --user mock_user --password mock_pass \
      --query "SELECT COUNT(*) FROM mock_clickhouse_db.sensor_readings" 2>/dev/null || echo "0")

  log "ClickHouse: seed complete. Total rows: $CH_COUNT"
fi

# ── Django Users ───────────────────────────────────────────────────────────────
setup_django_users() {
  log "Creating Django users..."
  docker exec dcp_api python manage.py shell -c "
from api.models import User

if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', password='admin1234')
    print('admin created')
else:
    u = User.objects.get(username='admin')
    u.set_password('admin1234')
    u.save()
    print('admin password reset')

if not User.objects.filter(username='testuser').exists():
    User.objects.create_user('testuser', password='user1234', role='user')
    print('testuser created')
else:
    print('testuser already exists')
"
  log "Users ready — admin:admin1234 / testuser:user1234"
}

setup_django_users

# ── Summary ────────────────────────────────────────────────────────────────────
echo ""
log "All mock sources ready. Environment is set to extract immediately."
echo ""
echo "  PostgreSQL  → inventory_items     (${PG_COUNT} rows)"
echo "  MySQL       → customer_leads      (${MY_COUNT} rows)"
echo "  MongoDB     → user_logs           (${MONGO_COUNT} docs)"
echo "  ClickHouse  → sensor_readings     (${CH_COUNT} rows)"
echo ""