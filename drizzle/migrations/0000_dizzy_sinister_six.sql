CREATE TABLE `plans` (
	`id` varchar(36) NOT NULL,
	`name` varchar(50) NOT NULL,
	`max_athletes` tinyint NOT NULL DEFAULT 50,
	`max_sessions_day` tinyint NOT NULL DEFAULT 10,
	`max_sensors` tinyint NOT NULL DEFAULT 30,
	`has_acwr` tinyint NOT NULL DEFAULT 0,
	`has_gamification` tinyint NOT NULL DEFAULT 0,
	`has_financial` tinyint NOT NULL DEFAULT 0,
	`has_tv_mode` tinyint NOT NULL DEFAULT 0,
	`price_monthly` varchar(10) NOT NULL DEFAULT '0',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`type` enum('franchise','academy','trainer') NOT NULL DEFAULT 'academy',
	`document` varchar(20),
	`plan_id` varchar(36),
	`status` enum('active','suspended','cancelled') NOT NULL DEFAULT 'active',
	`logo_url` varchar(255),
	`phone` varchar(20),
	`email` varchar(100),
	`address` text,
	`parent_id` varchar(36),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `units` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`city` varchar(80),
	`state` varchar(2),
	`address` text,
	`phone` varchar(20),
	`manager_id` varchar(36),
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `units_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `athlete_profiles` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`hr_max` int,
	`hr_rest` int,
	`hr_threshold` int,
	`vo2max` varchar(10),
	`weight_kg` varchar(8),
	`height_cm` varchar(8),
	`body_fat_pct` varchar(8),
	`goal` text,
	`medical_notes` text,
	`emergency_contact` varchar(100),
	`emergency_phone` varchar(20),
	`zone1_max` int,
	`zone2_max` int,
	`zone3_max` int,
	`zone4_max` int,
	`plan_id` varchar(36),
	`enrollment_date` date,
	`status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `athlete_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `athlete_profiles_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `coach_profiles` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`cref` varchar(30),
	`specialties` text,
	`bio` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coach_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `coach_profiles_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36),
	`unit_id` varchar(36),
	`name` varchar(100) NOT NULL,
	`email` varchar(100) NOT NULL,
	`password_hash` varchar(255),
	`role` enum('super_admin','tenant_admin','coach','receptionist','athlete') NOT NULL DEFAULT 'athlete',
	`avatar_url` varchar(255),
	`phone` varchar(20),
	`birthdate` date,
	`document` varchar(20),
	`gender` enum('M','F','other'),
	`is_active` tinyint NOT NULL DEFAULT 1,
	`email_verified` tinyint NOT NULL DEFAULT 0,
	`last_login` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `session_athletes` (
	`id` varchar(36) NOT NULL,
	`session_id` varchar(36) NOT NULL,
	`athlete_id` varchar(36) NOT NULL,
	`sensor_id` varchar(36),
	`checked_in` tinyint NOT NULL DEFAULT 0,
	`avg_hr` int,
	`max_hr` int,
	`min_hr` int,
	`calories` int,
	`trimp` float,
	`training_effect` float,
	`time_z1_sec` int,
	`time_z2_sec` int,
	`time_z3_sec` int,
	`time_z4_sec` int,
	`time_z5_sec` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `session_athletes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session_hr_series` (
	`id` varchar(36) NOT NULL,
	`session_id` varchar(36) NOT NULL,
	`athlete_id` varchar(36) NOT NULL,
	`timestamp` datetime NOT NULL,
	`hr_bpm` int NOT NULL,
	`hr_zone` int,
	`block_type` varchar(30),
	CONSTRAINT `session_hr_series_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session_types` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`name` varchar(80) NOT NULL,
	`color` varchar(7) DEFAULT '#6366f1',
	`icon` varchar(50),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `session_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_sessions` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`unit_id` varchar(36),
	`session_type_id` varchar(36),
	`coach_id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`start_datetime` datetime NOT NULL,
	`end_datetime` datetime,
	`duration_min` int DEFAULT 60,
	`capacity` int DEFAULT 30,
	`status` enum('scheduled','active','finished','cancelled') NOT NULL DEFAULT 'scheduled',
	`target_zone_min` int DEFAULT 2,
	`target_zone_max` int DEFAULT 4,
	`notes` text,
	`avg_hr` int,
	`avg_calories` int,
	`participants_count` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `training_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hr_zones_config` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`z1_max_pct` int NOT NULL DEFAULT 60,
	`z2_max_pct` int NOT NULL DEFAULT 70,
	`z3_max_pct` int NOT NULL DEFAULT 80,
	`z4_max_pct` int NOT NULL DEFAULT 90,
	`z1_color` varchar(7) DEFAULT '#a8d8ea',
	`z2_color` varchar(7) DEFAULT '#4caf50',
	`z3_color` varchar(7) DEFAULT '#ff9800',
	`z4_color` varchar(7) DEFAULT '#f44336',
	`z5_color` varchar(7) DEFAULT '#9c27b0',
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hr_zones_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `hr_zones_config_tenant_id_unique` UNIQUE(`tenant_id`)
);
--> statement-breakpoint
CREATE TABLE `sensors` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`unit_id` varchar(36),
	`serial` varchar(50) NOT NULL,
	`protocol` enum('ANT+','BLE','dual') NOT NULL DEFAULT 'ANT+',
	`athlete_id` varchar(36),
	`battery_pct` int,
	`last_seen` timestamp,
	`is_active` tinyint NOT NULL DEFAULT 1,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `sensors_id` PRIMARY KEY(`id`),
	CONSTRAINT `sensors_serial_unique` UNIQUE(`serial`)
);
--> statement-breakpoint
CREATE TABLE `daily_logs` (
	`id` varchar(36) NOT NULL,
	`athlete_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`log_date` date NOT NULL,
	`wellness_score` int,
	`sleep_quality` int,
	`fatigue` int,
	`pain_level` int,
	`stress_level` int,
	`hrv` int,
	`rhr` int,
	`sleep_hours` float,
	`weight_kg` float,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `daily_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `physical_assessments` (
	`id` varchar(36) NOT NULL,
	`athlete_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`assessed_by` varchar(36),
	`assessment_date` date NOT NULL,
	`weight_kg` float,
	`height_cm` float,
	`body_fat_pct` float,
	`muscle_mass_kg` float,
	`bmi` float,
	`vo2max` float,
	`hr_max_measured` int,
	`resting_hr` int,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `physical_assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weekly_indices` (
	`id` varchar(36) NOT NULL,
	`athlete_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`week_start` date NOT NULL,
	`trimp_weekly` float,
	`trimp_chronic` float,
	`acwr` float,
	`atl` float,
	`ctl` float,
	`tsb` float,
	`sessions_count` int,
	`total_calories` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `weekly_indices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `athlete_badges` (
	`id` varchar(36) NOT NULL,
	`athlete_id` varchar(36) NOT NULL,
	`badge_id` varchar(36) NOT NULL,
	`awarded_by` varchar(36),
	`awarded_at` timestamp DEFAULT (now()),
	CONSTRAINT `athlete_badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `badges` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36),
	`name` varchar(80) NOT NULL,
	`description` text,
	`icon` varchar(50),
	`color` varchar(7) DEFAULT '#f59e0b',
	`criteria` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `challenge_participants` (
	`id` varchar(36) NOT NULL,
	`challenge_id` varchar(36) NOT NULL,
	`athlete_id` varchar(36) NOT NULL,
	`progress` int NOT NULL DEFAULT 0,
	`completed` tinyint NOT NULL DEFAULT 0,
	`completed_at` timestamp,
	`joined_at` timestamp DEFAULT (now()),
	CONSTRAINT `challenge_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `challenges` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`created_by` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`criteria` enum('calories','sessions','zone_time','streak') NOT NULL,
	`target` int NOT NULL,
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`badge_id` varchar(36),
	`status` enum('active','finished','cancelled') NOT NULL DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `challenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `athlete_plans` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`name` varchar(80) NOT NULL,
	`duration_days` int NOT NULL,
	`price` int NOT NULL,
	`description` text,
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `athlete_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`athlete_id` varchar(36) NOT NULL,
	`plan_id` varchar(36),
	`amount` int NOT NULL,
	`due_date` date NOT NULL,
	`paid_date` date,
	`status` enum('pending','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
	`method` enum('cash','pix','credit_card','debit_card','transfer'),
	`notes` text,
	`registered_by` varchar(36),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
