CREATE TABLE `music_tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`netease_id` text NOT NULL,
	`title` text NOT NULL,
	`artist` text,
	`album` text,
	`cover` text,
	`lyric` text,
	`cached_url` text,
	`cached_at` integer,
	`cache_expires_at` integer,
	`level` text DEFAULT 'exhigh' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'enabled' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `music_tracks_netease_id_unique` ON `music_tracks` (`netease_id`);
--> statement-breakpoint
CREATE INDEX `music_tracks_netease_id_idx` ON `music_tracks` (`netease_id`);
--> statement-breakpoint
CREATE INDEX `music_tracks_status_sort_idx` ON `music_tracks` (`status`,`sort_order`);
