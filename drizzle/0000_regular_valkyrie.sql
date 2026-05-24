CREATE TABLE `admin` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`is_initialized` integer DEFAULT false,
	`created_at` text DEFAULT 'current_timestamp'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_username_unique` ON `admin` (`username`);--> statement-breakpoint
CREATE TABLE `ai_model` (
	`id` text PRIMARY KEY NOT NULL,
	`custom_name` text NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT 'current_timestamp'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ai_model_custom_name_unique` ON `ai_model` (`custom_name`);--> statement-breakpoint
CREATE TABLE `dimension` (
	`id` text PRIMARY KEY NOT NULL,
	`title_cn` text NOT NULL,
	`title_en` text NOT NULL,
	`desc_cn` text DEFAULT '' NOT NULL,
	`desc_en` text DEFAULT '' NOT NULL,
	`max_score` integer DEFAULT 5,
	`sort_order` integer DEFAULT 0,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT 'current_timestamp'
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`device_fingerprint` text NOT NULL,
	`ip_hash` text NOT NULL,
	`round_id` text NOT NULL,
	`status` text DEFAULT 'active',
	`last_updated` text DEFAULT 'current_timestamp'
);
--> statement-breakpoint
CREATE TABLE `submission` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`dimension_id` text NOT NULL,
	`score` integer NOT NULL,
	`note_md` text DEFAULT '',
	`submitted_at` text DEFAULT 'current_timestamp',
	FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`topic_id`) REFERENCES `topic`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`dimension_id`) REFERENCES `dimension`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_submission` ON `submission` (`session_id`,`topic_id`,`dimension_id`);--> statement-breakpoint
CREATE TABLE `topic` (
	`id` text PRIMARY KEY NOT NULL,
	`ai_model_id` text NOT NULL,
	`politeness_level` integer NOT NULL,
	`content_md` text DEFAULT '' NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT 'current_timestamp',
	FOREIGN KEY (`ai_model_id`) REFERENCES `ai_model`(`id`) ON UPDATE no action ON DELETE no action
);
