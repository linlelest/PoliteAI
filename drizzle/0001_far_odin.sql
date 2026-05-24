PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_admin` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`is_initialized` integer DEFAULT false,
	`created_at` text DEFAULT (current_timestamp)
);
--> statement-breakpoint
INSERT INTO `__new_admin`("id", "username", "password_hash", "is_initialized", "created_at") SELECT "id", "username", "password_hash", "is_initialized", "created_at" FROM `admin`;--> statement-breakpoint
DROP TABLE `admin`;--> statement-breakpoint
ALTER TABLE `__new_admin` RENAME TO `admin`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `admin_username_unique` ON `admin` (`username`);--> statement-breakpoint
CREATE TABLE `__new_ai_model` (
	`id` text PRIMARY KEY NOT NULL,
	`custom_name` text NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (current_timestamp)
);
--> statement-breakpoint
INSERT INTO `__new_ai_model`("id", "custom_name", "is_active", "created_at") SELECT "id", "custom_name", "is_active", "created_at" FROM `ai_model`;--> statement-breakpoint
DROP TABLE `ai_model`;--> statement-breakpoint
ALTER TABLE `__new_ai_model` RENAME TO `ai_model`;--> statement-breakpoint
CREATE UNIQUE INDEX `ai_model_custom_name_unique` ON `ai_model` (`custom_name`);--> statement-breakpoint
CREATE TABLE `__new_dimension` (
	`id` text PRIMARY KEY NOT NULL,
	`title_cn` text NOT NULL,
	`title_en` text NOT NULL,
	`desc_cn` text DEFAULT '' NOT NULL,
	`desc_en` text DEFAULT '' NOT NULL,
	`max_score` integer DEFAULT 5,
	`sort_order` integer DEFAULT 0,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (current_timestamp)
);
--> statement-breakpoint
INSERT INTO `__new_dimension`("id", "title_cn", "title_en", "desc_cn", "desc_en", "max_score", "sort_order", "is_active", "created_at") SELECT "id", "title_cn", "title_en", "desc_cn", "desc_en", "max_score", "sort_order", "is_active", "created_at" FROM `dimension`;--> statement-breakpoint
DROP TABLE `dimension`;--> statement-breakpoint
ALTER TABLE `__new_dimension` RENAME TO `dimension`;--> statement-breakpoint
CREATE TABLE `__new_session` (
	`id` text PRIMARY KEY NOT NULL,
	`device_fingerprint` text NOT NULL,
	`ip_hash` text NOT NULL,
	`round_id` text NOT NULL,
	`status` text DEFAULT 'active',
	`last_updated` text DEFAULT (current_timestamp)
);
--> statement-breakpoint
INSERT INTO `__new_session`("id", "device_fingerprint", "ip_hash", "round_id", "status", "last_updated") SELECT "id", "device_fingerprint", "ip_hash", "round_id", "status", "last_updated" FROM `session`;--> statement-breakpoint
DROP TABLE `session`;--> statement-breakpoint
ALTER TABLE `__new_session` RENAME TO `session`;--> statement-breakpoint
CREATE TABLE `__new_submission` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`dimension_id` text NOT NULL,
	`score` integer NOT NULL,
	`note_md` text DEFAULT '',
	`submitted_at` text DEFAULT (current_timestamp),
	FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`topic_id`) REFERENCES `topic`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`dimension_id`) REFERENCES `dimension`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_submission`("id", "session_id", "topic_id", "dimension_id", "score", "note_md", "submitted_at") SELECT "id", "session_id", "topic_id", "dimension_id", "score", "note_md", "submitted_at" FROM `submission`;--> statement-breakpoint
DROP TABLE `submission`;--> statement-breakpoint
ALTER TABLE `__new_submission` RENAME TO `submission`;--> statement-breakpoint
CREATE UNIQUE INDEX `uq_submission` ON `submission` (`session_id`,`topic_id`,`dimension_id`);--> statement-breakpoint
CREATE TABLE `__new_topic` (
	`id` text PRIMARY KEY NOT NULL,
	`ai_model_id` text NOT NULL,
	`politeness_level` integer NOT NULL,
	`content_md` text DEFAULT '' NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (current_timestamp),
	FOREIGN KEY (`ai_model_id`) REFERENCES `ai_model`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_topic`("id", "ai_model_id", "politeness_level", "content_md", "is_active", "created_at") SELECT "id", "ai_model_id", "politeness_level", "content_md", "is_active", "created_at" FROM `topic`;--> statement-breakpoint
DROP TABLE `topic`;--> statement-breakpoint
ALTER TABLE `__new_topic` RENAME TO `topic`;