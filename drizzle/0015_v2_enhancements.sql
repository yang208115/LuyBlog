ALTER TABLE `moments` ADD `like_count` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `moment_likes` (
  `id` text PRIMARY KEY NOT NULL,
  `moment_id` text NOT NULL,
  `visitor_hash` text NOT NULL,
  `created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
  FOREIGN KEY (`moment_id`) REFERENCES `moments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `moment_likes_moment_visitor_idx` ON `moment_likes` (`moment_id`, `visitor_hash`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `media_assets` (
  `id` text PRIMARY KEY NOT NULL,
  `object_key` text NOT NULL,
  `filename` text NOT NULL,
  `mime_type` text NOT NULL,
  `size_bytes` integer NOT NULL,
  `uploaded_by` text,
  `created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `media_assets_object_key_unique` ON `media_assets` (`object_key`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `media_assets_created_at_idx` ON `media_assets` (`created_at`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `rate_limits` (
  `key` text PRIMARY KEY NOT NULL,
  `count` integer DEFAULT 0 NOT NULL,
  `reset_at` integer NOT NULL
);
--> statement-breakpoint
CREATE VIRTUAL TABLE IF NOT EXISTS `search_fts` USING fts5(
  entity_type UNINDEXED,
  entity_id UNINDEXED,
  url UNINDEXED,
  published_at UNINDEXED,
  title,
  body,
  tags,
  tokenize='trigram'
);
