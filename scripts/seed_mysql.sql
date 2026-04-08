-- scripts/seed_mysql.sql
-- Mock source: MySQL — customer_leads
-- Unique type test: Varchar & Booleans (design p.23)

CREATE TABLE IF NOT EXISTS customer_leads (
    id            INT           AUTO_INCREMENT PRIMARY KEY,
    first_name    VARCHAR(100)  NOT NULL,
    last_name     VARCHAR(100)  NOT NULL,
    email         VARCHAR(255)  NOT NULL UNIQUE,
    phone         VARCHAR(20),
    company       VARCHAR(255),
    lead_source   VARCHAR(50),
    is_qualified  TINYINT(1)    NOT NULL DEFAULT 0,
    is_converted  TINYINT(1)    NOT NULL DEFAULT 0,
    score         INT           DEFAULT 0,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO customer_leads
    (first_name, last_name, email, phone, company, lead_source, is_qualified, is_converted, score)
VALUES
    ('Alice',   'Mwangi',    'alice.mwangi@acme.co',    '+254700000001', 'Acme Corp',        'Referral',    1, 0, 85),
    ('Brian',   'Odhiambo',  'brian.o@techco.io',        '+254700000002', 'TechCo',           'Website',     1, 1, 92),
    ('Carol',   'Njeri',     'carol.n@startup.dev',      '+254700000003', 'Startup Dev',      'LinkedIn',    0, 0, 40),
    ('David',   'Kamau',     'dkamau@enterprise.com',    '+254700000004', 'Enterprise Ltd',   'Cold Email',  1, 0, 76),
    ('Eva',     'Akinyi',    'eva.a@consulting.net',     '+254700000005', 'Consulting Net',   'Referral',    0, 0, 30),
    ('Frank',   'Otieno',    'frank.otieno@media.co',    '+254700000006', 'Media Co',         'Event',       1, 1, 88),
    ('Grace',   'Wambui',    'gwambui@fintech.io',       '+254700000007', 'Fintech IO',       'Website',     1, 0, 65),
    ('Henry',   'Mutua',     'h.mutua@logistics.com',    '+254700000008', 'Logistics Ltd',    'Cold Email',  0, 0, 22),
    ('Irene',   'Chebet',    'irene.c@healthtech.co',    '+254700000009', 'HealthTech Co',    'LinkedIn',    1, 0, 71),
    ('James',   'Kariuki',   'j.kariuki@edtech.org',     '+254700000010', 'EdTech Org',       'Referral',    0, 0, 55),
    ('Karen',   'Ndung\'u',  'karen.n@proptech.co',      '+254700000011', 'PropTech Co',      'Event',       1, 1, 95),
    ('Leo',     'Barasa',    'leo.b@agritech.io',        '+254700000012', 'AgriTech IO',      'Website',     0, 0, 18),
    ('Mary',    'Wairimu',   'mary.w@insurtech.com',     '+254700000013', 'InsurTech',        'LinkedIn',    1, 0, 80),
    ('Nathan',  'Juma',      'n.juma@cleantech.net',     '+254700000014', 'CleanTech',        'Cold Email',  0, 0, 42),
    ('Olivia',  'Zawadi',    'o.zawadi@govtech.go.ke',   '+254700000015', 'GovTech Kenya',    'Referral',    1, 0, 73);