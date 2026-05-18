# 部署指南

本文档描述 LuyBlog 当前代码的 Cloudflare Workers + D1 部署流程。

## 前置条件

- 已安装依赖：`pnpm install`
- 已登录 Wrangler：`pnpm wrangler login` 或使用 Cloudflare API token
- 已创建 GitHub OAuth App
- 生产回调地址配置为：`https://your-domain/auth/callback`

## 生产 D1 数据库

创建数据库：

```bash
pnpm wrangler d1 create luyblog-prod
```

把输出中的 `database_name` 和 `database_id` 写入 `wrangler.jsonc` 的 `env.production.d1_databases`。

应用迁移：

```bash
pnpm db:migrate:prod
```

## 生产变量和密钥

`wrangler.jsonc` 中应配置：

```jsonc
{
  "env": {
    "production": {
      "vars": {
        "NODE_ENV": "production",
        "VITE_PORT": "5173",
        "APP_BASE_URL": "https://your-domain"
      }
    }
  }
}
```

敏感值不要写入仓库，使用 Wrangler secret 或 Cloudflare Dashboard 配置：

```bash
pnpm wrangler secret put GITHUB_CLIENT_ID --env production
pnpm wrangler secret put GITHUB_CLIENT_SECRET --env production
pnpm wrangler secret put QWEATHER_KEY --env production
```

`QWEATHER_KEY` 是可选项，只影响天气接口。

## 构建和发布

本地验证：

```bash
pnpm typecheck
pnpm test --run
pnpm build
```

发布：

```bash
pnpm deploy
```

`pnpm deploy` 会先构建前端和 SSR bundle，再执行 `wrangler deploy --env production`。

## 上线检查

- `/` 能返回生产 SSR 页面
- `/assets/*` 静态资源正常
- `/rss.xml`、`/feed.xml`、`/sitemap.xml` 正常
- GitHub 登录完整走通
- 管理员后台可以访问 `/admin`
- 未登录访问 `/api/admin/*`、`/api/chat`、`POST /api/music/tracks/:id/refresh` 会被拒绝
