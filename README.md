# LuyBlog v2

LuyBlog v2 是运行在 **Cloudflare Workers** 上的全栈个人博客系统，基于 **TanStack Start + React 19 + Cloudflare D1 + R2 + Turnstile + Tailwind CSS v4** 构建。

## 核心特性

- **真 SSR 与动态 SEO**：基于 TanStack Start + `@cloudflare/vite-plugin`，所有文章/页面服务端直出独立标题、Meta、Open Graph 与 JSON-LD；`/rss.xml`、`/sitemap.xml` 与 `/robots.txt` 动态读库生成。
- **零客户端代码高亮开销**：服务端采用纯 JS 引擎 Shiki（`github-light` / `tokyo-night` 双主题）预渲染代码块，自动生成锚点与右侧粘性 TOC 目录及阅读时间。
- **路由级自动拆包**：管理后台 `/admin/*` 与 `@dnd-kit` 按路由隔离，前台首屏仅加载轻量化阅读所需 JS。
- **D1 兼容与 FTS5 搜索**：100% 兼容历史迁移 `0000`–`0014`，新增 `0015_v2_enhancements.sql` 提供 `search_fts` 全文检索、持久化瞬间点赞与窗口限流。
- **Cloudflare R2 图床**：支持后台媒体库管理，以及文章编辑器拖拽/粘贴直传图片至 R2（5 MB 上限 + 文件头魔数校验）。
- **安全与认证**：GitHub OAuth + `HttpOnly` Cookie Session（库内仅存 SHA-256 哈希）、`ADMIN_GITHUB_ID` 自动提权、Turnstile 保护评论与友链申请、全站 URL `http(s)://` 白名单校验。
- **星雾素笺设计系统**：前后台统一使用 Tailwind CSS v4 双主题（晴空素笺 / 夜樱星幕）。

## 本地开发

1. 安装依赖：

```bash
pnpm install
```

2. 配置本地环境变量（参考 [env.example](./env.example)）：

```bash
cp env.example .dev.vars
```

至少填写 `GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`，本地开发可将 `APP_BASE_URL` 设为 `http://localhost:5173`，并将 GitHub OAuth App 的回调地址配置为 `http://localhost:5173/auth/callback`。如需本地自动获得管理员权限，可设置 `ADMIN_GITHUB_ID`。

3. 应用本地 D1 数据库迁移：

```bash
pnpm db:migrate
```

4. 启动开发服务器（单端口直接运行在 Cloudflare workerd 运行时）：

```bash
pnpm dev
```

## 常用命令

```bash
pnpm dev              # 启动本地全栈开发服务器 (http://localhost:5173)
pnpm typecheck        # TypeScript 类型检查
pnpm lint             # Biome 代码静态检查
pnpm format           # Biome 自动格式化
pnpm test             # 运行 Vitest 单元测试
pnpm build            # 构建客户端与 Cloudflare Worker 服务端产物
pnpm db:migrate       # 应用本地 D1 迁移
pnpm db:migrate:prod  # 应用生产 D1 迁移
pnpm deploy           # 以 CLOUDFLARE_ENV=production 构建并部署到 Cloudflare Workers
```

## 生产部署准备

1. 确认在 Cloudflare 创建了 R2 存储桶 `luyblog-media`（与 [wrangler.jsonc](./wrangler.jsonc) 中 `env.production.r2_buckets` 一致）。
2. 为生产 Worker 注入隐私 Secrets（勿将 `TURNSTILE_SECRET` 写入 `wrangler.jsonc` 的 `vars`，以免与 Secret 冲突）：

```bash
pnpm exec wrangler secret put GITHUB_CLIENT_ID --env production
pnpm exec wrangler secret put GITHUB_CLIENT_SECRET --env production
pnpm exec wrangler secret put TURNSTILE_SECRET --env production
```

3. 在 [wrangler.jsonc](./wrangler.jsonc) 的 `env.production.vars` 中填入公开的 `TURNSTILE_SITE_KEY`（并保持 `TURNSTILE_HOSTNAMES` 仅包含线上域名 `blog.lyuy.top`）。
4. 执行生产 D1 迁移并部署（`pnpm deploy` 会在构建时通过 `CLOUDFLARE_ENV=production` 生成针对生产环境扁平化的 `dist/server/wrangler.json` 后直接执行 `wrangler deploy`）：

```bash
pnpm db:migrate:prod
pnpm deploy
```

> 首次上线后可登录 `/admin/settings` 点击「重建全站搜索索引」，将历史文章、页面、瞬间、项目与友链写入 `search_fts`。

## License

[MIT](./LICENSE)
