CREATE TABLE `music_tracks_direct` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`artist` text,
	`album` text,
	`cover` text,
	`lyric` text,
	`url` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'enabled' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
INSERT INTO `music_tracks_direct` (`id`, `title`, `artist`, `album`, `cover`, `lyric`, `url`, `sort_order`, `status`, `created_at`, `updated_at`)
SELECT `id`, `title`, `artist`, `album`, `cover`, `lyric`, COALESCE(`cached_url`, ''), `sort_order`, CASE WHEN `cached_url` IS NULL OR `cached_url` = '' THEN 'disabled' ELSE `status` END, `created_at`, `updated_at`
FROM `music_tracks`;
--> statement-breakpoint
DROP TABLE `music_tracks`;
--> statement-breakpoint
ALTER TABLE `music_tracks_direct` RENAME TO `music_tracks`;
--> statement-breakpoint
CREATE INDEX `music_tracks_status_sort_idx` ON `music_tracks` (`status`,`sort_order`);
