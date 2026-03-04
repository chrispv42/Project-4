USE ol_time_muscle;

-- 1) Seed eras
INSERT IGNORE INTO eras (name, slug) VALUES
('1960s', '1960s'),
('1970s', '1970s'),
('1980s', '1980s');

-- 2) Seed a demo user so user_id exists
-- NOTE: password_hash below is a bcrypt hash for "password123"
-- If you don't want a login user seeded, tell me and we’ll switch to NULL user_id instead.
INSERT INTO users (id, username, email, password_hash)
VALUES (1, 'admin', 'admin@otm.com', '$2b$10$2rLjq8O9UB0a4c0j63lmxuZkqPsNG2iVY8H0neqNYkRMapyWUsUc2')
ON DUPLICATE KEY UPDATE
  username = VALUES(username),
  email = VALUES(email);

-- 3) Now vehicles can safely reference user_id=1
INSERT INTO vehicles (user_id, era_id, year, make, model, trim, engine, horsepower, transmission, color, notes)
VALUES
(1, 1, 1962, 'Ford', 'Mustang', NULL, NULL, NULL, NULL, NULL, NULL),
(1, 2, 1971, 'Dodge', 'Challenger', 'R/T', NULL, NULL, NULL, NULL, NULL),
(1, 3, 1989, 'Volkswagen', 'Bug', 'SS', NULL, 300, NULL, NULL, NULL);

-- 4) Re-derive era_id based on year (optional)
UPDATE vehicles
SET era_id = CASE
  WHEN year BETWEEN 1960 AND 1969 THEN 1
  WHEN year BETWEEN 1970 AND 1979 THEN 2
  WHEN year BETWEEN 1980 AND 1989 THEN 3
  ELSE era_id
END
WHERE id > 0;