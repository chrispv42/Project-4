# Ol' Time Muscle

A full-stack classic muscle car forum built using a 3-Tier Architecture (Presentation, Application, and Data layers).

Ol' Time Muscle is a themed discussion platform where registered users can log in, explore classic American muscle cars by category, and participate in vehicle-specific discussions.

---

# 🚗 Application Theme

Instead of a generic forum, Ol' Time Muscle organizes discussions around **classic muscle vehicles**.

Categories include:

- Early Muscle (1960–1969)
- Peak Era (1970–1975)
- Modern Revival (2005–Present)
- Concept & Prototype Builds
- Custom / Restomod Builds

Each category contains vehicles that function as discussion threads.

---

# 🏗 3-Tier Architecture

This application follows the required 3-Tier structure:

## 1️⃣ Data Layer (Database)

- MySQL relational database
- Enforced foreign keys
- Structured schema
- Seed data included
- Proper cascading relationships

### Core Tables

- `users`
- `vehicles`
- `comments`
- `categories`
- `user_vehicles`

Relationships:

- comments → users (FK)
- comments → vehicles (FK)
- vehicles → categories (FK)

The `post_id` column in `comments` is nullable to support flexible thread structure.

---

## 2️⃣ Application Layer (Node.js + Express)

- Express JSON API
- JWT-based authentication
- bcrypt password hashing
- Middleware-based identity resolution
- MySQL connection pooling

Routes include:

/api/auth
/api/vehicles
/api/comments
/api/users

The application layer:

- Validates login credentials
- Signs JWT tokens
- Attaches `req.user` via centralized middleware
- Prevents cross-thread comment corruption
- Returns consistent JSON error responses

---

## 3️⃣ Presentation Layer (Single Page Application)

Built using:

- React
- React Router
- Custom Chrome-themed UI
- JSON-based communication with backend

The SPA:

- Sends login/register requests
- Receives JSON responses
- Renders dashboard dynamically
- Updates comment threads without page reload

---

# 🔐 Authentication Flow

## Login Screen

- Two fields: username and password
- Invalid combinations return error message
- Successful login redirects to Dashboard

## Registration Screen

- Username validation
- Password minimum length
- Email validation
- Terms checkbox required
- Field-specific error messages

Passwords are hashed using bcrypt before being stored.

JWT tokens:

- Signed with `sub` (user id)
- Expire after 7 days
- Sent via HttpOnly cookie and Bearer header support

After authentication:

```js
req.user = {
  id: <integer>,
  username: <string>
}
🖥 Dashboard

After login:

Displays app title

Shows username

Logout link available

Sidebar with categories

Scrollable category list

Main panel displays vehicles (chronological order)

Selecting a vehicle:

Displays vehicle details

Shows comment thread

Allows authenticated comment posting

Logout:

Clears token

Redirects to Login page

💬 Forum Functionality

Users can:

Register

Log in

Log out

View vehicles by category

View vehicle details

Post comments

View comments in chronological order

Comments:

Require authentication

Are validated against parent context

Cannot belong to mismatched threads

Cascade delete if vehicle is removed

📖 User Stories
Authentication

As a user, I want to register so I can participate in discussions.

As a user, I want to log in securely.

As a user, I want invalid login attempts to show an error.

As a user, I want to log out and return to the login page.

Dashboard

As a user, I want to see my username displayed.

As a user, I want to view categories in a sidebar.

As a user, I want to scroll categories if there are many.

As a user, I want vehicles shown in chronological order.

Discussion

As a user, I want to view vehicle-specific comment threads.

As a user, I want to post a comment.

As a user, I want comments to refresh after posting.

As a user, I want threads to remain structurally consistent.

🧩 WireFrame
Login Page
--------------------------------
|        Ol' Time Muscle       |
--------------------------------
| Username:  [___________]     |
| Password:  [___________]     |
|
| [ Login ]                    |
| Register                      |
--------------------------------
Registration Page
----------------------------------------
|            Register User              |
----------------------------------------
| Username:        [___________]        |
| Email:           [___________]        |
| Password:        [___________]        |
| Confirm Password:[___________]        |
| [ ] Accept Terms                     |
|                                      |
| [ Register ]                         |
----------------------------------------
Dashboard
--------------------------------------------------
| Ol' Time Muscle | Welcome, Username | Logout |
--------------------------------------------------
| Category1 |                              |
| Category2 |     Select a Vehicle         |
| Category3 |                              |
| Category4 |                              |
| Category5 |                              |
--------------------------------------------------
Vehicle Detail Page
--------------------------------------------------
| 1969 Ford Mustang Boss 429                   |
--------------------------------------------------
| Year: 1969                                    |
| Make: Ford                                    |
| Model: Mustang                                |
| Trim: Boss 429                                |
| Horsepower: 375                               |
--------------------------------------------------
| Comments (3)                                  |
| [ Leave a comment...              ]           |
|                [ Post Comment ]               |
--------------------------------------------------
| Username | Date                               |
| Comment body text                             |
--------------------------------------------------
🗄 Database Setup
CREATE DATABASE ol_time_muscle;

Run schema and seed:

mysql -u root -p ol_time_muscle < schema.sql
mysql -u root -p ol_time_muscle < seed.sql
▶ Running the Project
Backend
cd server
npm install
npm run dev

Runs on:

http://localhost:4000
Frontend
cd client
npm install
npm start

Runs on:

http://localhost:3000
📦 Deliverables

GitHub repository

Working 3-tier architecture

JSON API

SPA frontend

Database schema

-- schema.sql
CREATE DATABASE IF NOT EXISTS ol_time_muscle;
USE ol_time_muscle;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(32) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories (left menu)
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(64) NOT NULL UNIQUE,
  description VARCHAR(255) DEFAULT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- Vehicles (catalog)
CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  year INT NOT NULL,
  make VARCHAR(64) NOT NULL,
  model VARCHAR(64) NOT NULL,
  trim VARCHAR(64) DEFAULT NULL,
  horsepower INT DEFAULT NULL,
  image_url VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_vehicles_category_created (category_id, created_at),
  INDEX idx_vehicles_make_model_year (make, model, year)
);

-- Threads / “questions” about a vehicle (optional / legacy if you keep it)
CREATE TABLE IF NOT EXISTS questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  user_id INT NOT NULL,
  title VARCHAR(120) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_questions_vehicle_created (vehicle_id, created_at)
);

-- Answers (optional / legacy if you keep it)
CREATE TABLE IF NOT EXISTS answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  user_id INT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_answers_question_created (question_id, created_at)
);

-- ✅ Comments (Vehicle threads) + ✅ Replies (parent_comment_id)
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  user_id INT NOT NULL,
  parent_comment_id INT DEFAULT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  INDEX idx_comments_vehicle_created (vehicle_id, created_at),
  INDEX idx_comments_parent_created (parent_comment_id, created_at),
  INDEX idx_comments_user_created (user_id, created_at)
);

-- User Garage (profile “my rides”)
CREATE TABLE IF NOT EXISTS user_vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  year INT NOT NULL,
  make VARCHAR(64) NOT NULL,
  model VARCHAR(64) NOT NULL,
  trim VARCHAR(64) DEFAULT NULL,
  notes VARCHAR(255) DEFAULT NULL,
  image_url VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_vehicles_user_created (user_id, created_at)
);


Seed data

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


Documentation



