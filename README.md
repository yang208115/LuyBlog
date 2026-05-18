# LuyBlog

一个运行在 Cloudflare Workers + D1 上的个人博客应用，包含公开博客、评论、音乐、友链、搜索、SSR/SEO 和管理后台。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

技术栈：Hono、React、Vite、Material UI、Cloudflare D1、Drizzle ORM。

## 功能

- 博客、页面、瞬间、项目、友链和音乐模块
- GitHub OAuth 登录与管理员后台
- 评论发布、审核和管理
- RSS、sitemap、robots 和 SSR 页面模板
- 后台站点配置和 AI 辅助写作/审核

## 快速开始

```bash
pnpm install
cp env.example .dev.vars
pnpm db:migrate
pnpm dev
```

访问：

- 前端开发：http://localhost:5173
- Worker 完整应用：http://localhost:8787
- Swagger UI：http://localhost:8787/doc

GitHub OAuth 需要在 `.dev.vars` 中配置 `GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET` 和 `APP_BASE_URL`。回调地址使用 `http://localhost:8787/auth/callback`。

## 常用命令

```bash
pnpm typecheck
pnpm test --run
pnpm build
pnpm db:migrate
pnpm db:migrate:prod
pnpm deploy
```

## 文档

- [安装配置指南](./docs/INSTALLATION.md)
- [认证配置指南](./docs/AUTHENTICATION.md)
- [开发指南](./docs/DEVELOPMENT.md)
- [主题定制指南](./docs/THEMING.md)
- [API 开发指南](./docs/API_GUIDE.md)
- [部署指南](./docs/DEPLOYMENT.md)
- [SEO 配置指南](./docs/SEO_GUIDE.md)

## 生产部署

1. 在 Cloudflare 创建 D1 数据库，并更新 `wrangler.jsonc` 的 production `database_id` 和 `APP_BASE_URL`。
2. 在 Cloudflare secrets/variables 中配置 `GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET` 和可选的 `QWEATHER_KEY`。
3. 执行 `pnpm db:migrate:prod`。
4. 执行 `pnpm deploy`。

## 许可证

MIT License，详见 [LICENSE](./LICENSE)。
