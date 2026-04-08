-- scripts/seed_clickhouse.sql
-- Mock source: ClickHouse — sensor_readings
-- Unique type test: Int64 & Large Batches (design p.23)

CREATE DATABASE IF NOT EXISTS mock_clickhouse_db;

USE mock_clickhouse_db;

CREATE TABLE IF NOT EXISTS sensor_readings
(
    reading_id      UInt64,
    sensor_id       String,
    location        String,
    temperature     Float32,
    humidity        Float32,
    pressure_hpa    Float32,
    battery_pct     UInt8,
    is_anomaly      UInt8,
    recorded_at     DateTime,
    ingested_at     DateTime DEFAULT now()
)
ENGINE = MergeTree()
ORDER BY (sensor_id, recorded_at);

-- 50 rows covering varied sensors, locations, and anomaly flags
-- Exercises Int64/Float32 serialization in ClickHouseConnector 
INSERT INTO sensor_readings
    (reading_id, sensor_id, location, temperature, humidity, pressure_hpa, battery_pct, is_anomaly, recorded_at)
VALUES
    (1,  'SEN-A01', 'Nairobi-CBD',      24.5, 62.1, 1013.2, 95, 0, '2024-01-15 06:00:00'),
    (2,  'SEN-A01', 'Nairobi-CBD',      25.1, 61.8, 1013.0, 95, 0, '2024-01-15 06:05:00'),
    (3,  'SEN-A01', 'Nairobi-CBD',      25.8, 60.5, 1012.8, 94, 0, '2024-01-15 06:10:00'),
    (4,  'SEN-A02', 'Nairobi-Westlands',22.3, 71.4, 1014.1, 88, 0, '2024-01-15 06:00:00'),
    (5,  'SEN-A02', 'Nairobi-Westlands',22.9, 70.2, 1013.9, 88, 0, '2024-01-15 06:05:00'),
    (6,  'SEN-B01', 'Mombasa-Port',     31.2, 85.3, 1010.5, 72, 0, '2024-01-15 06:00:00'),
    (7,  'SEN-B01', 'Mombasa-Port',     31.9, 86.1, 1010.2, 72, 1, '2024-01-15 06:05:00'),
    (8,  'SEN-B01', 'Mombasa-Port',     45.1, 90.0, 1009.8, 71, 1, '2024-01-15 06:10:00'),
    (9,  'SEN-B02', 'Mombasa-Beach',    30.5, 88.2, 1011.0, 60, 0, '2024-01-15 06:00:00'),
    (10, 'SEN-B02', 'Mombasa-Beach',    30.8, 87.9, 1010.9, 60, 0, '2024-01-15 06:05:00'),
    (11, 'SEN-C01', 'Kisumu-Lake',      28.4, 75.6, 1012.3, 99, 0, '2024-01-15 06:00:00'),
    (12, 'SEN-C01', 'Kisumu-Lake',      28.7, 74.9, 1012.1, 99, 0, '2024-01-15 06:05:00'),
    (13, 'SEN-C02', 'Kisumu-City',      29.1, 73.2, 1012.5, 85, 0, '2024-01-15 06:00:00'),
    (14, 'SEN-C02', 'Kisumu-City',      29.3, 72.8, 1012.4, 85, 0, '2024-01-15 06:05:00'),
    (15, 'SEN-D01', 'Nakuru-Town',      20.1, 55.3, 1015.7, 77, 0, '2024-01-15 06:00:00'),
    (16, 'SEN-D01', 'Nakuru-Town',      20.4, 54.8, 1015.5, 77, 0, '2024-01-15 06:05:00'),
    (17, 'SEN-D01', 'Nakuru-Town',      20.9, 54.1, 1015.3, 76, 0, '2024-01-15 06:10:00'),
    (18, 'SEN-D02', 'Nakuru-Lake',      19.8, 68.4, 1016.0, 91, 0, '2024-01-15 06:00:00'),
    (19, 'SEN-D02', 'Nakuru-Lake',      20.0, 67.9, 1015.9, 91, 0, '2024-01-15 06:05:00'),
    (20, 'SEN-E01', 'Eldoret-Airport',  18.2, 50.1, 1017.4, 55, 0, '2024-01-15 06:00:00'),
    (21, 'SEN-E01', 'Eldoret-Airport',  18.5, 49.8, 1017.2, 55, 0, '2024-01-15 06:05:00'),
    (22, 'SEN-E01', 'Eldoret-Airport',   2.1, 45.0, 1018.1, 54, 1, '2024-01-15 06:10:00'),
    (23, 'SEN-E02', 'Eldoret-City',     18.9, 51.4, 1017.0, 82, 0, '2024-01-15 06:00:00'),
    (24, 'SEN-E02', 'Eldoret-City',     19.2, 50.9, 1016.9, 82, 0, '2024-01-15 06:05:00'),
    (25, 'SEN-F01', 'Thika-Industrial', 27.3, 58.7, 1013.6, 43, 0, '2024-01-15 06:00:00'),
    (26, 'SEN-F01', 'Thika-Industrial', 27.8, 58.1, 1013.4, 43, 0, '2024-01-15 06:05:00'),
    (27, 'SEN-F01', 'Thika-Industrial', 28.2, 57.6, 1013.2, 42, 0, '2024-01-15 06:10:00'),
    (28, 'SEN-F02', 'Thika-Town',       26.9, 60.3, 1013.8, 68, 0, '2024-01-15 06:00:00'),
    (29, 'SEN-F02', 'Thika-Town',       27.1, 59.8, 1013.7, 68, 0, '2024-01-15 06:05:00'),
    (30, 'SEN-G01', 'Nyeri-Town',       16.4, 72.1, 1018.5, 90, 0, '2024-01-15 06:00:00'),
    (31, 'SEN-G01', 'Nyeri-Town',       16.7, 71.8, 1018.3, 90, 0, '2024-01-15 06:05:00'),
    (32, 'SEN-G02', 'Nyeri-Outskirts',  15.9, 74.5, 1018.8, 78, 0, '2024-01-15 06:00:00'),
    (33, 'SEN-G02', 'Nyeri-Outskirts',  16.1, 74.0, 1018.7, 78, 0, '2024-01-15 06:05:00'),
    (34, 'SEN-H01', 'Malindi-Coast',    32.8, 89.4, 1009.3, 34, 0, '2024-01-15 06:00:00'),
    (35, 'SEN-H01', 'Malindi-Coast',    33.1, 90.1, 1009.1, 34, 1, '2024-01-15 06:05:00'),
    (36, 'SEN-H02', 'Malindi-Inland',   31.5, 82.3, 1010.0, 61, 0, '2024-01-15 06:00:00'),
    (37, 'SEN-H02', 'Malindi-Inland',   31.7, 81.9, 1009.9, 61, 0, '2024-01-15 06:05:00'),
    (38, 'SEN-I01', 'Machakos-Town',    26.2, 56.8, 1014.2, 87, 0, '2024-01-15 06:00:00'),
    (39, 'SEN-I01', 'Machakos-Town',    26.5, 56.3, 1014.0, 87, 0, '2024-01-15 06:05:00'),
    (40, 'SEN-I02', 'Machakos-Rural',   25.8, 59.2, 1014.5, 52, 0, '2024-01-15 06:00:00'),
    (41, 'SEN-I02', 'Machakos-Rural',   26.0, 58.8, 1014.4, 52, 0, '2024-01-15 06:05:00'),
    (42, 'SEN-J01', 'Garissa-North',    38.4, 28.1, 1008.7, 29, 1, '2024-01-15 06:00:00'),
    (43, 'SEN-J01', 'Garissa-North',    39.1, 27.4, 1008.5, 29, 1, '2024-01-15 06:05:00'),
    (44, 'SEN-J01', 'Garissa-North',    39.8, 26.9, 1008.3, 28, 1, '2024-01-15 06:10:00'),
    (45, 'SEN-J02', 'Garissa-South',    37.9, 29.5, 1008.9, 41, 1, '2024-01-15 06:00:00'),
    (46, 'SEN-J02', 'Garissa-South',    38.5, 28.8, 1008.7, 41, 1, '2024-01-15 06:05:00'),
    (47, 'SEN-K01', 'Kisii-Town',       22.1, 78.3, 1013.0, 93, 0, '2024-01-15 06:00:00'),
    (48, 'SEN-K01', 'Kisii-Town',       22.4, 77.9, 1012.9, 93, 0, '2024-01-15 06:05:00'),
    (49, 'SEN-K02', 'Kisii-Rural',      21.6, 80.1, 1013.3, 76, 0, '2024-01-15 06:00:00'),
    (50, 'SEN-K02', 'Kisii-Rural',      21.9, 79.6, 1013.1, 75, 0, '2024-01-15 06:05:00');