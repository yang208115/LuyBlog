ALTER TABLE `posts` ADD `cover` text;
--> statement-breakpoint
ALTER TABLE `posts` ADD `tags` text;
--> statement-breakpoint
ALTER TABLE `posts` ADD `category` text;
--> statement-breakpoint
ALTER TABLE `posts` ADD `reading_time` integer;
--> statement-breakpoint
ALTER TABLE `posts` ADD `frontmatter` text;
--> statement-breakpoint
CREATE INDEX `posts_category_idx` ON `posts` (`category`);
--> statement-breakpoint
CREATE TABLE `chatters` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`summary` text,
	`content_md` text NOT NULL,
	`mood` text,
	`cover` text,
	`tags` text,
	`frontmatter` text,
	`status` text DEFAULT 'published' NOT NULL,
	`published_at` integer,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `chatters_slug_unique` ON `chatters` (`slug`);
--> statement-breakpoint
CREATE INDEX `chatters_status_published_at_idx` ON `chatters` (`status`,`published_at`);
--> statement-breakpoint
CREATE INDEX `chatters_slug_idx` ON `chatters` (`slug`);
--> statement-breakpoint
CREATE TABLE `moments` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`content_md` text NOT NULL,
	`location` text,
	`images` text,
	`frontmatter` text,
	`status` text DEFAULT 'published' NOT NULL,
	`published_at` integer,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `moments_slug_unique` ON `moments` (`slug`);
--> statement-breakpoint
CREATE INDEX `moments_status_published_at_idx` ON `moments` (`status`,`published_at`);
--> statement-breakpoint
CREATE INDEX `moments_slug_idx` ON `moments` (`slug`);
--> statement-breakpoint
CREATE TABLE `pages` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`content_md` text NOT NULL,
	`frontmatter` text,
	`status` text DEFAULT 'published' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pages_slug_unique` ON `pages` (`slug`);
--> statement-breakpoint
CREATE INDEX `pages_slug_idx` ON `pages` (`slug`);
--> statement-breakpoint
CREATE INDEX `pages_status_idx` ON `pages` (`status`);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`icon` text,
	`github_url` text,
	`tags` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `projects_status_sort_idx` ON `projects` (`status`,`sort_order`);
--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`title` text,
	`description` text,
	`taken_at` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `photos_status_sort_idx` ON `photos` (`status`,`sort_order`);
--> statement-breakpoint
CREATE TABLE `comments_new` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text,
	`target_type` text DEFAULT 'post' NOT NULL,
	`target_slug` text,
	`parent_id` text,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	`status` text DEFAULT 'visible' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `comments_new` (`id`, `post_id`, `target_type`, `target_slug`, `user_id`, `content`, `status`, `created_at`, `updated_at`)
SELECT `comments`.`id`, `comments`.`post_id`, 'post', `posts`.`slug`, `comments`.`user_id`, `comments`.`content`, `comments`.`status`, `comments`.`created_at`, `comments`.`updated_at`
FROM `comments`
LEFT JOIN `posts` ON `comments`.`post_id` = `posts`.`id`;
--> statement-breakpoint
DROP TABLE `comments`;
--> statement-breakpoint
ALTER TABLE `comments_new` RENAME TO `comments`;
--> statement-breakpoint
CREATE INDEX `comments_post_id_created_at_idx` ON `comments` (`post_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `comments_target_created_at_idx` ON `comments` (`target_type`,`target_slug`,`created_at`);
--> statement-breakpoint
CREATE INDEX `comments_parent_id_idx` ON `comments` (`parent_id`);
--> statement-breakpoint
CREATE INDEX `comments_user_id_idx` ON `comments` (`user_id`);
--> statement-breakpoint
CREATE INDEX `comments_status_idx` ON `comments` (`status`);
