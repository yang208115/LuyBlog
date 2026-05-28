# LuyBlog

LuyBlog 是我给自己写的个人博客系统，运行在 Cloudflare Workers + D1 上。它不是一个纯静态博客，而是带完整后台的内容管理应用：文章、页面、瞬间、项目、友链、音乐、评论、站点配置和导航栏都可以在后台维护。

> **致谢与声明**：本项目是基于 [XinghuisamaBlogs](https://github.com/heiehiehi/XinghuisamaBlogs) 进行的二次开发。感谢原作者的开源贡献！

这个项目的目标很简单：把个人站点需要的东西尽量收在一个轻量、可部署、可维护的代码仓库里。

[![License](https://img.shields.io/badge/license-CC%20BY--NC%204.0-blue.svg)](./LICENSE)

## 主要功能

- 博客文章：Markdown 内容、分类、标签、封面、阅读时间、访问量
- 独立页面：后台新建页面后可直接通过 `/:slug` 访问，例如 `/about`、`/test`
- 瞬间动态：适合发短内容、日常记录和图片
- 项目展示：维护项目名称、描述、图标、标签和排序
- 友链系统：支持前台展示和友链申请
- 音乐模块：网易云歌曲管理、缓存播放链接、歌单导入
- 评论系统：支持文章评论、后台审核和状态管理
- 导航栏管理：独立后台模块，可新增、删除、排序和启停导航入口
- 站点配置：标题、头像、背景图、社交链接、备案信息、AI 配置等
- GitHub 登录：GitHub OAuth 登录，管理员进入后台
- SEO：RSS、sitemap、robots、SSR HTML 模板

## 技术栈

- Runtime：Cloudflare Workers
- Database：Cloudflare D1
- Backend：Hono、Drizzle ORM、Zod
- Frontend：React 18、Vite、Material UI、React Query
- Markdown：react-markdown、remark-gfm、rehype-raw
- Auth：GitHub OAuth
- Deploy：Wrangler

## 本地开发

先安装依赖：

```bash
pnpm install
```

复制本地环境变量：

```bash
cp env.example .dev.vars
```

至少需要配置：

```bash
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
APP_BASE_URL=http://localhost:8787
```

初始化本地 D1：

```bash
pnpm db:migrate
```

启动开发环境：

```bash
pnpm dev
```

常用访问地址：

- 完整 Worker 应用：http://localhost:8787
- Vite 前端开发服务：http://localhost:5173
- API 文档：http://localhost:8787/doc
- 管理后台：http://localhost:8787/admin

GitHub OAuth 的本地回调地址使用：

```text
http://localhost:8787/auth/callback
```

## 常用命令

```bash
pnpm dev                # 同时启动 Worker 和 Vite
pnpm typecheck          # TypeScript 类型检查
pnpm test               # 运行测试
pnpm build              # 构建客户端和服务端产物
pnpm db:migrate         # 应用本地 D1 迁移
pnpm db:migrate:prod    # 应用生产 D1 迁移
pnpm deploy             # 构建并部署到 Cloudflare
```

## 后台内容

后台目前按模块管理：

- 仪表盘：站点内容和运营数据概览
- 站点配置：站点文案、图片、社交链接、AI 参数
- 导航栏：前台导航入口、链接、排序和启停
- 文章：博客文章发布和编辑
- 瞬间：短内容管理
- 项目：项目展示内容
- 页面：独立 Markdown 页面
- 友链：友链站点和申请内容
- 音乐：网易云歌曲、歌单导入和缓存刷新
- 评论：评论审核
- 用户：用户角色和状态管理

## 动态页面

后台「页面」模块创建的内容会按 slug 暴露为前台页面。

例如新建页面：

```text
slug: test
title: 测试页面
```

保存发布后即可访问：

```text
http://localhost:8787/test
```

固定业务路由如 `/blog`、`/music`、`/admin` 会优先匹配，普通页面路由作为最后的兜底。

## 数据库

数据库 schema 在 [src/db/schema.ts](./src/db/schema.ts)，迁移文件在 [drizzle](./drizzle)。

本地迁移：

```bash
pnpm db:migrate
```

生产迁移：

```bash
pnpm db:migrate:prod
```

部分配置类数据会在接口访问时自动补表或回退默认值，用来减少首次部署时的空数据问题。不过正式部署仍然建议先跑完整迁移。

## 生产部署

1. 在 Cloudflare 创建 D1 数据库。
2. 修改 [wrangler.jsonc](./wrangler.jsonc) 里的生产 `database_id` 和 `APP_BASE_URL`。
3. 在 Cloudflare 控制台配置 GitHub OAuth 相关变量或 secrets。
4. 执行生产迁移：

```bash
pnpm db:migrate:prod
```

5. 部署：

```bash
pnpm deploy
```

可选变量：

- `QWEATHER_KEY`：天气接口使用

AI 的 API Key、Base URL、模型和提示词已经迁移到后台「站点配置」里维护。

## 目录结构

```text
common/             # 前后端共享校验 schema
docs/               # 详细文档
drizzle/            # D1 迁移和种子数据
frontend/           # React 前端
frontend/src/admin  # 管理后台页面
frontend/src/pages  # 前台页面
src/                # Hono Worker 后端
src/db              # Drizzle schema
src/routes          # API 路由
src/services        # 服务逻辑
```

## 文档

- [安装配置指南](./docs/INSTALLATION.md)
- [认证配置指南](./docs/AUTHENTICATION.md)
- [开发指南](./docs/DEVELOPMENT.md)
- [主题定制指南](./docs/THEMING.md)
- [API 开发指南](./docs/API_GUIDE.md)
- [部署指南](./docs/DEPLOYMENT.md)
- [SEO 配置指南](./docs/SEO_GUIDE.md)

## License

本项目基于 [XinghuisamaBlogs](https://github.com/heiehiehi/XinghuisamaBlogs) 进行二次开发，遵循原项目的开源协议。

本项目采用 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/deed.zh-hans)（署名-非商业性使用 4.0 国际）协议进行许可。

**二次开发与分发要求：**
- **署名（Attribution）**：必须提及原作者（[heiehiehi](https://github.com/heiehiehi)），提供指向原项目 [XinghuisamaBlogs](https://github.com/heiehiehi/XinghuisamaBlogs) 的链接，并标明是否对原代码进行了修改。
- **非商业性使用（NonCommercial）**：不得将本代码及其衍生作品用于商业目的。
- **相同方式共享（ShareAlike 精神延伸）**：基于本项目进行的二次开发，也必须采用相同的 CC BY-NC 4.0 协议进行开源发布。
