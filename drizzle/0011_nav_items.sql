CREATE TABLE `nav_items` (
  `id` text PRIMARY KEY NOT NULL,
  `label` text NOT NULL,
  `path` text NOT NULL,
  `sort_order` integer DEFAULT 0 NOT NULL,
  `status` text DEFAULT 'enabled' NOT NULL,
  `created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
  `updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);

CREATE INDEX `nav_items_status_sort_idx` ON `nav_items` (`status`, `sort_order`);

INSERT INTO `nav_items` (`id`, `label`, `path`, `sort_order`, `status`) VALUES
  ('nav_home', '首页', '/', 0, 'enabled'),
  ('nav_blog', '归档', '/blog', 10, 'enabled'),
  ('nav_search', '搜索', '/search', 20, 'enabled'),
  ('nav_moments', '瞬间', '/moments', 30, 'enabled'),
  ('nav_projects', '项目', '/projects', 40, 'enabled'),
  ('nav_music', '音乐', '/music', 50, 'enabled'),
  ('nav_friends', '友链', '/friends', 60, 'enabled'),
  ('nav_about', '关于', '/about', 70, 'enabled');
