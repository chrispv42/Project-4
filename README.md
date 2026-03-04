# Ol’ Time Muscle 🚗💨

A full-stack classic muscle car forum built using a true **3-Tier Architecture**:

- **Presentation Layer** → React SPA
- **Application Layer** → Node.js + Express API
- **Data Layer** → MySQL Database

**Live Frontend (GitHub Pages):**  
https://chrispv42.github.io/Project-4

---

# 🧱 3-Tier Architecture

## 1️⃣ Data Layer (MySQL)

- Relational schema
- Foreign keys + indexed relationships
- Seed data included
- Comment threading support
- Vehicle + Era categorization

---

## 2️⃣ Application Layer (Express API)

- RESTful JSON API
- Authentication (JWT + cookies)
- Protected routes
- MySQL connection pooling
- CORS configured for client
- Health check endpoints:
  - `/api/health`
  - `/api/health/db`

Server runs locally at:

http://localhost:4000

---

## 3️⃣ Presentation Layer (React SPA)

- React (Create React App)
- React Router
- Axios (JSON requests)
- Auth-aware UI
- Era-based vehicle navigation
- Vehicle detail discussion threads

Client runs locally at:

http://localhost:3000

---

# Reverse Engineering

[Open reverseEngineer.pdf](client/public/reverseEngineer.pdf)

# 📖 User Stories

## Authentication

- As a user, I want to register so I can participate in discussions.
- As a user, I want to log in securely.
- As a user, I want invalid login attempts to show an error.
- As a user, I want to log out and return to the login page.

---

## Dashboard

- As a user, I want to see my username displayed.
- As a user, I want to view eras in a sidebar.
- As a user, I want to scroll eras if there are many.
- As a user, I want vehicles shown in chronological order.

---

## Discussion

- As a user, I want to view vehicle-specific comment threads.
- As a user, I want to post a comment.
- As a user, I want comments to refresh after posting.
- As a user, I want thread structure to remain consistent.

---

# 🔌 API Routes

## Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET  /api/auth/me`

## Eras

- `GET /api/eras`

## Vehicles

- `GET /api/vehicles/by-era/:eraId`
- `GET /api/vehicles/:id`
- `POST /api/vehicles` _(auth required)_

## Comments

- `GET /api/comments/by-vehicle/:vehicleId`
- `POST /api/comments` _(auth required)_

---

# 🗂 Project Structure

express-project/
├── client/ # React SPA
└── server/ # Express API

---

# ⚙️ Local Setup

## 1️⃣ Install

### Client

```bash
cd client
npm install
Server
cd ../server
npm install

2️⃣ Environment Variables

Create server/.env

PORT=4000
CLIENT_ORIGIN=http://localhost:3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Abc123
DB_NAME=ol_time_muscle

JWT_SECRET=dev_only_change_me
3️⃣ Database Setup
CREATE DATABASE IF NOT EXISTS ol_time_muscle;
USE ol_time_muscle;

Then run:

Database Schema SQL (below)

Seed Data SQL (below)

4️⃣ Run the App

Start Server
cd server
npm run dev
Start Client
cd client
npm start

🌐 GitHub Pages Deployment Notes

This React app is hosted under:

/Project-4/

Assets must use:

${process.env.PUBLIC_URL}/assetName.png

Ensure client/package.json includes:

"homepage": "https://chrispv42.github.io/Project-4"

Deploy:

npm run build
npm run deploy

🧩 Wireframe Overview
🔐 Login Page
----------------------------------------
|            Ol' Time Muscle           |
----------------------------------------
|   Username: [______________]         |
|   Password: [______________]         |
|                                      |
|              [ Login ]               |
|                                      |
|   Not registered yet?  Sign Up       |
----------------------------------------

📝 Registration Page
----------------------------------------
|            Register User             |
----------------------------------------
| Username: [______________]           |
| Email:    [______________]           |
| Password: [______________]           |
|                                      |
|        [ Create Account ]            |
----------------------------------------

📊 Dashboard
--------------------------------------------------
| Ol' Time Muscle | Welcome, User | Logout |     |
--------------------------------------------------
| 1960s | 1970s | 1980s | 1990s | 2000s |        |
--------------------------------------------------
|              Vehicle Cards                     |
--------------------------------------------------

🚗 Vehicle Detail Page
--------------------------------------------------
| 1969 Ford Mustang Boss 429                     |
--------------------------------------------------
| Year | Make | Model | Trim | HP                |
--------------------------------------------------
| Comments                                       |
| [ Leave a comment... ]  [ Post ]               |
--------------------------------------------------
| Username | Date                                |
| Comment body                                   |
--------------------------------------------------


-- ===============================
-- Database Schema SQL
-- ===============================
-- Past this into MySQL Workbench after creating db.
--
-- Ol' Time Muscle - Schema (MySQL)
--
-- CREATE DATABASE ol_time_muscle;
-- USE ol_time_muscle;

SET FOREIGN_KEY_CHECKS = 0;

-- USERS
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(32) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ERAS
CREATE TABLE IF NOT EXISTS `eras` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(40) NOT NULL,
  `slug` varchar(40) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- MAKES
CREATE TABLE IF NOT EXISTS `makes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(40) NOT NULL,
  `slug` varchar(40) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- VEHICLES
CREATE TABLE IF NOT EXISTS `vehicles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `era_id` int DEFAULT NULL,
  `year` smallint NOT NULL,
  `make` varchar(40) NOT NULL,
  `model` varchar(60) NOT NULL,
  `trim` varchar(60) DEFAULT NULL,
  `engine` varchar(80) DEFAULT NULL,
  `horsepower` int DEFAULT NULL,
  `transmission` varchar(60) DEFAULT NULL,
  `color` varchar(40) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_vehicles_user` (`user_id`),
  KEY `idx_vehicles_era` (`era_id`),
  CONSTRAINT `fk_vehicles_era`
    FOREIGN KEY (`era_id`) REFERENCES `eras` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_vehicles_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- VEHICLE PHOTOS
CREATE TABLE IF NOT EXISTS `vehicle_photos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vehicle_id` int NOT NULL,
  `url` varchar(500) NOT NULL,
  `caption` varchar(140) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_vehicle_photos_vehicle` (`vehicle_id`),
  CONSTRAINT `fk_vehicle_photos_vehicle`
    FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- POSTS
CREATE TABLE IF NOT EXISTS `posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `era_id` int NOT NULL,
  `make_id` int NOT NULL,
  `user_id` int NOT NULL,
  `title` varchar(120) NOT NULL,
  `year` smallint DEFAULT NULL,
  `model` varchar(60) DEFAULT NULL,
  `trim` varchar(60) DEFAULT NULL,
  `body` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_posts_era` (`era_id`),
  KEY `fk_posts_make` (`make_id`),
  KEY `fk_posts_user` (`user_id`),
  KEY `idx_posts_created` (`created_at`),
  CONSTRAINT `fk_posts_era`
    FOREIGN KEY (`era_id`) REFERENCES `eras` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_posts_make`
    FOREIGN KEY (`make_id`) REFERENCES `makes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_posts_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- COMMENTS
CREATE TABLE IF NOT EXISTS `comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int DEFAULT NULL,
  `vehicle_id` int DEFAULT NULL,
  `parent_comment_id` int DEFAULT NULL,
  `user_id` int NOT NULL,
  `body` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_comments_post` (`post_id`),
  KEY `fk_comments_user` (`user_id`),
  KEY `idx_comments_created` (`created_at`),
  KEY `idx_comments_parent` (`parent_comment_id`),
  KEY `idx_comments_vehicle_created` (`vehicle_id`,`created_at`),
  CONSTRAINT `fk_comments_parent`
    FOREIGN KEY (`parent_comment_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comments_post`
    FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comments_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comments_vehicle`
    FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ================================
-- Seed Data SQL
-- ================================

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
```
