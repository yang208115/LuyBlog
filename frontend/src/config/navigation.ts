export type NavItem = {
  id: string;
  label: string;
  path: string;
  sortOrder: number;
};

export const defaultNavItems: NavItem[] = [
  { id: "nav_home", label: "首页", path: "/", sortOrder: 0 },
  { id: "nav_blog", label: "归档", path: "/blog", sortOrder: 10 },
  { id: "nav_search", label: "搜索", path: "/search", sortOrder: 20 },
  { id: "nav_moments", label: "瞬间", path: "/moments", sortOrder: 30 },
  { id: "nav_projects", label: "项目", path: "/projects", sortOrder: 40 },
  { id: "nav_music", label: "音乐", path: "/music", sortOrder: 50 },
  { id: "nav_friends", label: "友链", path: "/friends", sortOrder: 60 },
  { id: "nav_about", label: "关于", path: "/about", sortOrder: 70 },
];
