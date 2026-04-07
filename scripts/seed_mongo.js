// scripts/seed_mongo.js
// Mock source: MongoDB — user_logs
// Unique type test: Arrays & Nested Objects (design p.23)
// Exercises flatten_mongo_doc()

db = db.getSiblingDB("mock_mongo_db");

db.user_logs.drop();

db.user_logs.insertMany([
  {
    user: { id: "usr_001", username: "alice.mwangi", email: "alice@acme.co" },
    session_id: "sess_a1b2c3",
    actions: ["login", "view_dashboard", "export_report", "logout"],
    metadata: { ip_address: "192.168.1.10", user_agent: "Mozilla/5.0", country: "KE" },
    timestamps: { started_at: new Date("2024-01-15T08:00:00Z"), ended_at: new Date("2024-01-15T08:45:00Z") },
    page_views: 12,
    errors_encountered: []
  },
  {
    user: { id: "usr_002", username: "brian.odhiambo", email: "brian@techco.io" },
    session_id: "sess_d4e5f6",
    actions: ["login", "create_connection", "run_extraction", "edit_grid", "submit_batch"],
    metadata: { ip_address: "10.0.0.5", user_agent: "Chrome/124", country: "KE" },
    timestamps: { started_at: new Date("2024-01-15T09:10:00Z"), ended_at: new Date("2024-01-15T10:30:00Z") },
    page_views: 28,
    errors_encountered: [{ code: "ExtractionError", message: "Query timeout", at: new Date("2024-01-15T09:55:00Z") }]
  },
  {
    user: { id: "usr_003", username: "carol.njeri", email: "carol@startup.dev" },
    session_id: "sess_g7h8i9",
    actions: ["login", "view_files", "download_file"],
    metadata: { ip_address: "172.16.0.3", user_agent: "Safari/17", country: "UG" },
    timestamps: { started_at: new Date("2024-01-15T11:00:00Z"), ended_at: new Date("2024-01-15T11:20:00Z") },
    page_views: 5,
    errors_encountered: []
  },
  {
    user: { id: "usr_004", username: "david.kamau", email: "dkamau@enterprise.com" },
    session_id: "sess_j1k2l3",
    actions: ["login", "view_dashboard", "create_connection", "test_connection", "run_extraction", "edit_grid", "submit_batch", "download_file", "logout"],
    metadata: { ip_address: "192.168.0.22", user_agent: "Firefox/126", country: "KE" },
    timestamps: { started_at: new Date("2024-01-15T13:00:00Z"), ended_at: new Date("2024-01-15T15:10:00Z") },
    page_views: 41,
    errors_encountered: []
  },
  {
    user: { id: "usr_005", username: "eva.akinyi", email: "eva@consulting.net" },
    session_id: "sess_m4n5o6",
    actions: ["login", "view_dashboard"],
    metadata: { ip_address: "10.10.1.99", user_agent: "Edge/124", country: "TZ" },
    timestamps: { started_at: new Date("2024-01-15T14:00:00Z"), ended_at: new Date("2024-01-15T14:05:00Z") },
    page_views: 2,
    errors_encountered: [{ code: "ConnectionError", message: "Source unreachable", at: new Date("2024-01-15T14:03:00Z") }]
  },
  {
    user: { id: "usr_001", username: "alice.mwangi", email: "alice@acme.co" },
    session_id: "sess_p7q8r9",
    actions: ["login", "run_extraction", "edit_grid", "submit_batch", "logout"],
    metadata: { ip_address: "192.168.1.10", user_agent: "Mozilla/5.0", country: "KE" },
    timestamps: { started_at: new Date("2024-01-16T08:30:00Z"), ended_at: new Date("2024-01-16T09:15:00Z") },
    page_views: 18,
    errors_encountered: []
  }
]);

// Index for efficient session lookups
db.user_logs.createIndex({ "user.id": 1 });
db.user_logs.createIndex({ session_id: 1 }, { unique: true });
db.user_logs.createIndex({ "timestamps.started_at": -1 });

print("MongoDB seed complete: " + db.user_logs.countDocuments() + " user_log documents inserted.");