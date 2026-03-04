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