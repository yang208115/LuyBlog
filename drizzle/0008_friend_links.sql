CREATE TABLE `friend_links` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `description` text,
  `url` text NOT NULL,
  `avatar_url` text,
  `sort_order` integer DEFAULT 0 NOT NULL,
  `status` text DEFAULT 'published' NOT NULL,
  `created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
  `updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `friend_links_status_sort_idx` ON `friend_links` (`status`,`sort_order`);
