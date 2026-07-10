# 部署记录

本文档记录美食交流与菜品分享平台的公开演示部署事实。这里只保存公开地址、资源名称和占位符，不保存平台密钥、数据库密码或私有 token。

## 部署资源

| 项 | 值 |
|---|---|
| GitHub 仓库 | https://github.com/Nemo-netone/ot-springbooth10zf |
| 仓库名称 | `ot-springbooth10zf` |
| 生产分支 | `main` |
| 首次生产分支 | `main` |
| Cloudflare Pages 项目 | `ot-springbooth10zf` |
| 稳定演示地址 | https://ot-springbooth10zf.pages.dev |
| Cloudflare Worker | `ot-springbooth10zf-api` |
| Worker API base | https://ot-springbooth10zf-api.15038734526.workers.dev |
| Supabase schema | `ot_springbooth10zf` |
| CloudBase | 本项目未使用 CloudBase |
| 部署日期 | 2026-07-10 |

## 运行架构

```text
Cloudflare Pages
  site/index.html
  site/styles.css
  site/app.js
  site/_worker.js
        |
        v
Supabase REST RPC: public.ot_springbooth10zf_rest
        |
        v
Schema: ot_springbooth10zf
```

线上页面优先使用 Pages 同源 API：

```text
https://ot-springbooth10zf.pages.dev/api/*
```

独立 Worker 用于调试和后续扩展：

```text
https://ot-springbooth10zf-api.15038734526.workers.dev
```

## 环境变量

Cloudflare Pages 和 Worker 需要配置：

```text
SUPABASE_URL=<supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
SUPABASE_SCHEMA=ot_springbooth10zf
CORS_ALLOWED_ORIGINS=https://ot-springbooth10zf.pages.dev
```

安全约束：

- `SUPABASE_SERVICE_ROLE_KEY` 只能放在 Cloudflare secrets 或受控环境变量中。
- 仓库、README、文档和截图不得保存真实平台密钥。
- Supabase 数据只写入 `ot_springbooth10zf` schema。

## 数据库初始化

数据库脚本：

```text
supabase/schema.sql
```

脚本职责：

- 创建独立 schema `ot_springbooth10zf`。
- 创建用户、美食、热门菜品、资讯、论坛、留言、收藏等演示表。
- 写入公开演示种子数据。
- 创建 `public.ot_springbooth10zf_rest` RPC，供 Worker 统一访问项目 schema。

执行方式：

```powershell
supabase link --project-ref <supabase-project-ref> --yes
supabase db query --linked --file supabase\schema.sql -o table
```

## 发布命令

部署 Worker：

```powershell
npx wrangler@3 deploy
```

部署 Pages：

```powershell
npx wrangler@3 pages deploy site --project-name ot-springbooth10zf --branch main
```

## 验证记录

最近一次验证日期：2026-07-10

| 检查项 | 结果 |
|---|---|
| Pages 稳定地址 | `200 OK` |
| 管理员登录 | `abo/abo` 登录成功 |
| 登录 API 脱敏 | 返回用户资料，不回传密码字段 |
| 仪表盘 API | 返回用户、美食、菜品、论坛、留言、收藏、资讯统计 |
| 中式美食列表 API | 返回 3 条数据 |
| Supabase RPC | `public.ot_springbooth10zf_rest` 可返回数据 |
| 截图 | `home.png`、`admin.png`、`mobile.png` 已生成 |

核心验证命令：

```powershell
curl.exe -I --max-time 30 "https://ot-springbooth10zf.pages.dev"

$body = @{ role='admin'; username='abo'; password='abo' } | ConvertTo-Json -Compress
Invoke-RestMethod -Uri 'https://ot-springbooth10zf.pages.dev/api/login' -Method Post -ContentType 'application/json' -Body $body

Invoke-RestMethod -Uri 'https://ot-springbooth10zf.pages.dev/api/summary' -Method Post -ContentType 'application/json' -Body '{}'
Invoke-RestMethod -Uri 'https://ot-springbooth10zf.pages.dev/api/zhongshimeishi/list' -Method Post -ContentType 'application/json' -Body '{}'
```

## 已知限制

- 线上版本是作品集演示实现，使用 Worker API 兼容层，不直接部署原 Spring Boot 运行时。
- 文件上传、人脸比对、完整 Shiro 鉴权等原后端能力没有在 Worker 演示层完整复刻。
- 当前演示账号和种子数据适合展示业务链路，不作为真实生产系统使用。
