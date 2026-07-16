-- ============================================================
-- HRM System — Seed Data Script
-- Run this inside Neon SQL Editor
-- ============================================================

-- Clean existing data (in dependency order)
TRUNCATE payrolls, employee_documents, employees, positions, departments, users RESTART IDENTITY CASCADE;

-- ─── USERS ───────────────────────────────────────────────────
-- admin123 / password123
INSERT INTO users (email, username, hashed_password, full_name, role, is_active) VALUES
  ('admin@hrm.com',      'admin',     '$2b$12$7tvaj0aiE4E5EYIYwO6/1.PHZBOQDdM67vfM1Y9sCG5KV1By9npo6', 'System Admin',    'admin', true),
  ('hr@hrm.com',         'hrmanager', '$2b$12$TF2s6niVDwUlUB3SWzfXIuCt1L5TGFJKL4rWuXOGfi9UMqSGeMGIa', 'Sarah Johnson',   'hr',    true),
  ('manager@hrm.com',    'manager1',  '$2b$12$TF2s6niVDwUlUB3SWzfXIuCt1L5TGFJKL4rWuXOGfi9UMqSGeMGIa', 'Mike Williams',   'user',  true);

-- ─── DEPARTMENTS ─────────────────────────────────────────────
INSERT INTO departments (name, description, is_active) VALUES
  ('Engineering',       'Software development and technical operations',        true),
  ('Human Resources',   'People management, recruitment, and employee welfare', true),
  ('Finance',           'Financial planning, accounting, and payroll',          true),
  ('Marketing',         'Brand management, campaigns, and growth',             true),
  ('Sales',             'Revenue generation and client relationships',          true),
  ('Operations',        'Day-to-day business operations and logistics',        true),
  ('Product',           'Product strategy, design, and roadmap',               true),
  ('Customer Support',  'Client assistance and issue resolution',              true);

-- ─── POSITIONS ───────────────────────────────────────────────
INSERT INTO positions (department_id, title, description, is_active) VALUES
  -- Engineering (1)
  (1, 'Senior Software Engineer',  'Full-stack development, system design, code reviews',     true),
  (1, 'Junior Software Engineer',  'Feature development under mentorship',                    true),
  (1, 'DevOps Engineer',           'CI/CD pipelines, cloud infrastructure, monitoring',       true),
  (1, 'QA Engineer',               'Test automation, quality assurance, bug tracking',        true),
  -- HR (2)
  (2, 'HR Manager',                'Oversee recruitment, policies, and employee relations',   true),
  (2, 'HR Executive',              'Day-to-day HR operations, onboarding, records',           true),
  -- Finance (3)
  (3, 'Finance Manager',           'Financial reporting, budgeting, compliance',               true),
  (3, 'Accountant',                'Bookkeeping, tax, and audit support',                     true),
  -- Marketing (4)
  (4, 'Marketing Manager',         'Campaign strategy, brand management, analytics',          true),
  (4, 'Content Specialist',        'Content creation, SEO, and social media',                 true),
  -- Sales (5)
  (5, 'Sales Manager',             'Team leadership, pipeline management, targets',           true),
  (5, 'Sales Executive',           'Client acquisition, demos, and closing deals',            true),
  -- Operations (6)
  (6, 'Operations Manager',        'Process optimization, vendor management',                 true),
  -- Product (7)
  (7, 'Product Manager',           'Roadmap planning, feature prioritization, stakeholders',  true),
  (7, 'UI/UX Designer',            'User research, wireframes, design systems',               true),
  -- Support (8)
  (8, 'Support Lead',              'Escalation management, SLA tracking, team coaching',      true),
  (8, 'Support Agent',             'Ticket resolution, live chat, customer satisfaction',     true);

-- ─── EMPLOYEES ───────────────────────────────────────────────
INSERT INTO employees (employee_code, first_name, last_name, email, phone, address, department_id, position_id, joining_date, employment_type, basic_salary, status) VALUES
  ('EMP-001', 'James',    'Anderson',   'james.anderson@company.com',   '+1-555-0101', '123 Oak Street, New York, NY 10001',        1, 1,  '2023-03-15', 'FULL_TIME', 95000.00,  'ACTIVE'),
  ('EMP-002', 'Emily',    'Chen',       'emily.chen@company.com',       '+1-555-0102', '456 Maple Ave, San Francisco, CA 94102',    1, 2,  '2024-01-10', 'FULL_TIME', 72000.00,  'ACTIVE'),
  ('EMP-003', 'Michael',  'Rodriguez',  'michael.rodriguez@company.com','+1-555-0103', '789 Pine Blvd, Austin, TX 78701',           1, 3,  '2023-08-22', 'FULL_TIME', 88000.00,  'ACTIVE'),
  ('EMP-004', 'Sophia',   'Patel',      'sophia.patel@company.com',     '+1-555-0104', '321 Cedar Lane, Seattle, WA 98101',         1, 4,  '2024-06-01', 'FULL_TIME', 68000.00,  'ACTIVE'),
  ('EMP-005', 'Sarah',    'Johnson',    'sarah.johnson@company.com',    '+1-555-0105', '654 Birch Road, Chicago, IL 60601',         2, 5,  '2022-11-01', 'FULL_TIME', 82000.00,  'ACTIVE'),
  ('EMP-006', 'David',    'Kim',        'david.kim@company.com',        '+1-555-0106', '987 Elm Court, Boston, MA 02101',           2, 6,  '2024-03-18', 'FULL_TIME', 55000.00,  'ACTIVE'),
  ('EMP-007', 'Rachel',   'Thompson',   'rachel.thompson@company.com',  '+1-555-0107', '147 Willow Way, Denver, CO 80201',          3, 7,  '2023-01-09', 'FULL_TIME', 90000.00,  'ACTIVE'),
  ('EMP-008', 'Daniel',   'Martinez',   'daniel.martinez@company.com',  '+1-555-0108', '258 Spruce Ave, Miami, FL 33101',           3, 8,  '2023-07-15', 'FULL_TIME', 62000.00,  'ACTIVE'),
  ('EMP-009', 'Olivia',   'Brown',      'olivia.brown@company.com',     '+1-555-0109', '369 Aspen Drive, Portland, OR 97201',       4, 9,  '2023-05-20', 'FULL_TIME', 78000.00,  'ACTIVE'),
  ('EMP-010', 'Ethan',    'Wilson',     'ethan.wilson@company.com',     '+1-555-0110', '741 Redwood Pl, Nashville, TN 37201',       4, 10, '2024-09-01', 'PART_TIME', 40000.00,  'ACTIVE'),
  ('EMP-011', 'Ava',      'Taylor',     'ava.taylor@company.com',       '+1-555-0111', '852 Cypress Ln, Atlanta, GA 30301',         5, 11, '2022-06-12', 'FULL_TIME', 85000.00,  'ACTIVE'),
  ('EMP-012', 'Lucas',    'Garcia',     'lucas.garcia@company.com',     '+1-555-0112', '963 Magnolia St, Dallas, TX 75201',         5, 12, '2024-02-05', 'FULL_TIME', 58000.00,  'ACTIVE'),
  ('EMP-013', 'Mia',      'Lee',        'mia.lee@company.com',          '+1-555-0113', '159 Hickory Rd, Phoenix, AZ 85001',         6, 13, '2023-10-30', 'FULL_TIME', 80000.00,  'ACTIVE'),
  ('EMP-014', 'Noah',     'Clark',      'noah.clark@company.com',       '+1-555-0114', '357 Walnut Blvd, Minneapolis, MN 55401',    7, 14, '2023-04-17', 'FULL_TIME', 105000.00, 'ACTIVE'),
  ('EMP-015', 'Isabella', 'Wright',     'isabella.wright@company.com',  '+1-555-0115', '468 Chestnut Ave, San Diego, CA 92101',     7, 15, '2024-07-22', 'CONTRACT',  70000.00,  'ACTIVE'),
  ('EMP-016', 'Liam',     'Hall',       'liam.hall@company.com',        '+1-555-0116', '579 Poplar Dr, Charlotte, NC 28201',        8, 16, '2023-09-03', 'FULL_TIME', 65000.00,  'ACTIVE'),
  ('EMP-017', 'Charlotte','Adams',      'charlotte.adams@company.com',  '+1-555-0117', '681 Dogwood Ct, Orlando, FL 32801',         8, 17, '2024-04-15', 'FULL_TIME', 45000.00,  'ACTIVE'),
  ('EMP-018', 'Aiden',    'Baker',      'aiden.baker@company.com',      '+1-555-0118', '792 Sycamore St, Raleigh, NC 27601',        1, 2,  '2025-01-06', 'INTERN',    30000.00,  'ONBOARDING'),
  ('EMP-019', 'Harper',   'Nelson',     'harper.nelson@company.com',    '+1-555-0119', '813 Juniper Way, Salt Lake City, UT 84101', 5, 12, '2024-11-11', 'FULL_TIME', 55000.00,  'ACTIVE'),
  ('EMP-020', 'Benjamin', 'Scott',      'benjamin.scott@company.com',   '+1-555-0120', '924 Hawthorn Pl, Columbus, OH 43201',       3, 8,  '2022-02-14', 'FULL_TIME', 60000.00,  'TERMINATED');

-- ─── PAYROLLS (last 3 months for active employees) ───────────
-- June 2026
INSERT INTO payrolls (employee_id, month, year, basic_salary, allowances, deductions, net_salary, payment_status) VALUES
  (1,  6, 2026, 95000.00,  5000.00, 12000.00, 88000.00,  'PAID'),
  (2,  6, 2026, 72000.00,  3000.00,  9500.00, 65500.00,  'PAID'),
  (3,  6, 2026, 88000.00,  4500.00, 11000.00, 81500.00,  'PAID'),
  (4,  6, 2026, 68000.00,  2500.00,  8500.00, 62000.00,  'PAID'),
  (5,  6, 2026, 82000.00,  4000.00, 10500.00, 75500.00,  'PAID'),
  (6,  6, 2026, 55000.00,  2000.00,  7000.00, 50000.00,  'PAID'),
  (7,  6, 2026, 90000.00,  5000.00, 11500.00, 83500.00,  'PAID'),
  (8,  6, 2026, 62000.00,  2500.00,  8000.00, 56500.00,  'PAID'),
  (9,  6, 2026, 78000.00,  3500.00, 10000.00, 71500.00,  'PAID'),
  (10, 6, 2026, 40000.00,  1500.00,  5000.00, 36500.00,  'PAID'),
  (11, 6, 2026, 85000.00,  6000.00, 11000.00, 80000.00,  'PAID'),
  (12, 6, 2026, 58000.00,  2000.00,  7500.00, 52500.00,  'PAID'),
  (13, 6, 2026, 80000.00,  4000.00, 10000.00, 74000.00,  'PAID'),
  (14, 6, 2026, 105000.00, 7000.00, 14000.00, 98000.00,  'PAID'),
  (15, 6, 2026, 70000.00,  3000.00,  9000.00, 64000.00,  'PAID'),
  (16, 6, 2026, 65000.00,  2500.00,  8500.00, 59000.00,  'PAID'),
  (17, 6, 2026, 45000.00,  1500.00,  5500.00, 41000.00,  'PAID'),
  (19, 6, 2026, 55000.00,  2000.00,  7000.00, 50000.00,  'PAID');

-- July 2026 (current month — PENDING for most, some PAID)
INSERT INTO payrolls (employee_id, month, year, basic_salary, allowances, deductions, net_salary, payment_status) VALUES
  (1,  7, 2026, 95000.00,  5000.00, 12000.00, 88000.00,  'PENDING'),
  (2,  7, 2026, 72000.00,  3000.00,  9500.00, 65500.00,  'PENDING'),
  (3,  7, 2026, 88000.00,  4500.00, 11000.00, 81500.00,  'PENDING'),
  (4,  7, 2026, 68000.00,  2500.00,  8500.00, 62000.00,  'PENDING'),
  (5,  7, 2026, 82000.00,  4000.00, 10500.00, 75500.00,  'PENDING'),
  (6,  7, 2026, 55000.00,  2000.00,  7000.00, 50000.00,  'PENDING'),
  (7,  7, 2026, 90000.00,  5000.00, 11500.00, 83500.00,  'PAID'),
  (8,  7, 2026, 62000.00,  2500.00,  8000.00, 56500.00,  'PENDING'),
  (9,  7, 2026, 78000.00,  3500.00, 10000.00, 71500.00,  'PENDING'),
  (10, 7, 2026, 40000.00,  1500.00,  5000.00, 36500.00,  'PENDING'),
  (11, 7, 2026, 85000.00,  6000.00, 11000.00, 80000.00,  'PAID'),
  (12, 7, 2026, 58000.00,  2000.00,  7500.00, 52500.00,  'PENDING'),
  (13, 7, 2026, 80000.00,  4000.00, 10000.00, 74000.00,  'PENDING'),
  (14, 7, 2026, 105000.00, 7000.00, 14000.00, 98000.00,  'PENDING'),
  (15, 7, 2026, 70000.00,  3000.00,  9000.00, 64000.00,  'FAILED'),
  (16, 7, 2026, 65000.00,  2500.00,  8500.00, 59000.00,  'PENDING'),
  (17, 7, 2026, 45000.00,  1500.00,  5500.00, 41000.00,  'PENDING'),
  (19, 7, 2026, 55000.00,  2000.00,  7000.00, 50000.00,  'PENDING');

-- ============================================================
-- LOGIN CREDENTIALS
-- ============================================================
--  admin@hrm.com    / admin123      (role: admin — can process payments)
--  hr@hrm.com       / password123   (role: hr)
--  manager@hrm.com  / password123   (role: user)
-- ============================================================
