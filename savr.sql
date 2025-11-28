-- --------------------------------------------
-- Database setup
-- --------------------------------------------
CREATE DATABASE IF NOT EXISTS `savr` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `savr`;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------
-- Table structure for table `budgets`
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `budgets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `month` date NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `category_id` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------
-- Table structure for table `categories`
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `color` varchar(7) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------
-- Table structure for table `logs`
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `meta` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`meta`)),
  `ip` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------
-- Table structure for table `savings_goals`
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `savings_goals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `target_amount` decimal(12,2) NOT NULL,
  `current_amount` decimal(12,2) DEFAULT 0.00,
  `deadline` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------
-- Table structure for table `transactions`
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `type` enum('expense','income') NOT NULL,
  `date` date NOT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `idx_user_date` (`user_id`,`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------
-- Table data inserts
-- --------------------------------------------
INSERT INTO `users` (`id`, `email`, `password_hash`, `name`, `created_at`, `updated_at`) VALUES
(1, 'k-edel@gmail.com', '$2b$10$.yqC7nx36kZZ/8PoJmgSUeMkMLYUKRXjPj/HEqZtFcpUffjyvCFcO', 'Kimberly Edel', '2025-11-25 21:08:03', '2025-11-25 21:08:03');

INSERT INTO `categories` (`id`, `user_id`, `name`, `color`, `created_at`) VALUES
(1, NULL, 'Food', '#FF6B6B', '2025-11-25 20:34:11'),
(2, NULL, 'Transport', '#4ECDC4', '2025-11-25 20:34:11'),
(3, NULL, 'Entertainment', '#45B7D1', '2025-11-25 20:34:11'),
(4, NULL, 'Shopping', '#FFA07A', '2025-11-25 20:34:11'),
(5, NULL, 'Bills', '#98D8C8', '2025-11-25 20:34:11'),
(6, NULL, 'Healthcare', '#FF7675', '2025-11-25 20:34:11'),
(7, NULL, 'Education', '#A29BFE', '2025-11-25 20:34:11'),
(8, NULL, 'Other', '#DFE6E9', '2025-11-25 20:34:11');

INSERT INTO `budgets` (`id`, `user_id`, `category_id`, `month`, `amount`, `created_at`) VALUES
(1, 1, 1, '2025-11-25', 1212.00, '2025-11-25 21:29:41');

INSERT INTO `logs` (`id`, `user_id`, `action`, `meta`, `ip`, `created_at`) VALUES
(1, 1, 'login', NULL, NULL, '2025-11-25 21:08:07'),
(2, 1, 'login', NULL, NULL, '2025-11-25 21:13:05'),
(3, 1, 'login', NULL, NULL, '2025-11-25 21:13:10');

INSERT INTO `savings_goals` (`id`, `user_id`, `title`, `target_amount`, `current_amount`, `deadline`, `created_at`) VALUES
(1, 1, 'New Basketball Gear', 1800.00, 0.00, '2025-02-12', '2025-11-25 21:21:51');

INSERT INTO `transactions` (`id`, `user_id`, `category_id`, `amount`, `type`, `date`, `note`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, 27000.00, 'expense', '2025-11-25', 'Tuition Fee', '2025-11-25 21:16:19', '2025-11-25 21:16:19'),
(2, 1, 7, 300000.00, 'income', '2025-11-25', 'SAHOD', '2025-11-25 21:31:56', '2025-11-25 21:31:56'),
(3, 1, 1, 500.00, 'expense', '2025-11-25', 'hygge', '2025-11-25 21:38:51', '2025-11-25 21:38:51');

-- --------------------------------------------
-- Table constraints / foreign keys
-- --------------------------------------------
ALTER TABLE `budgets`
  ADD CONSTRAINT `budgets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `budgets_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `logs`
  ADD CONSTRAINT `logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

ALTER TABLE `savings_goals`
  ADD CONSTRAINT `savings_goals_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

COMMIT;
