-- seed.sql
USE oltimemuscle;

INSERT IGNORE INTO categories (name, description, sort_order) VALUES
('60s Legends', 'Peak-era icons: raw, loud, timeless.', 1),
('70s Street Kings', 'Big blocks and bad intentions.', 2),
('Modern Muscle', 'Retro soul with modern power.', 3),
('JDM Classics', 'Not “muscle” technically, but legendary.', 4);

-- Vehicles (sample set; add more to reach ~50)
INSERT INTO vehicles (category_id, year, make, model, trim, horsepower, image_url) VALUES
(1, 1969, 'Chevrolet', 'Camaro', 'Z/28', 290, NULL),
(1, 1967, 'Ford', 'Mustang', 'GT Fastback', 271, NULL),
(1, 1969, 'Dodge', 'Charger', 'R/T', 375, NULL),
(1, 1968, 'Plymouth', 'Barracuda', 'Formula S', 275, NULL),

(2, 1970, 'Chevrolet', 'Chevelle', 'SS 454', 450, NULL),
(2, 1971, 'Plymouth', 'Cuda', '426 HEMI', 425, NULL),
(2, 1970, 'Dodge', 'Challenger', 'R/T', 375, NULL),
(2, 1977, 'Pontiac', 'Firebird', 'Trans Am', 200, NULL),

(3, 2020, 'Dodge', 'Challenger', 'SRT Hellcat', 717, NULL),
(3, 2021, 'Ford', 'Mustang', 'Mach 1', 480, NULL),
(3, 2022, 'Chevrolet', 'Camaro', 'ZL1', 650, NULL),

(4, 1994, 'Toyota', 'Supra', 'Turbo', 320, NULL),
(4, 1999, 'Nissan', 'Skyline', 'GT-R R34', 280, NULL);
