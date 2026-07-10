# 功能说明

美食交流与菜品分享平台围绕菜品展示、内容互动和后台管理展开。线上演示版本把原 Spring Boot 项目中的核心业务整理为可访问、可验证的 Cloudflare Pages + Worker + Supabase 演示链路。

## 功能树

| 模块 | 主要能力 | 数据表 |
|---|---|---|
| 管理员登录 | 管理员演示登录和后台入口 | `users` |
| 用户管理 | 普通用户资料、联系方式、头像字段 | `yonghu` |
| 中式美食 | 菜品、菜系、材料、做法、评分、审核 | `zhongshimeishi` |
| 外国美食 | 外国菜品、类型、来源、材料、做法、审核 | `waiguomeishi` |
| 热门菜品 | 热门菜品内容、发布日期、点赞点踩 | `remencaipin` |
| 资讯管理 | 平台资讯标题、简介、正文 | `news` |
| 论坛管理 | 帖子标题、内容、发帖人、开放状态 | `forum` |
| 留言管理 | 用户留言和管理员回复 | `messages` |
| 收藏管理 | 用户收藏内容、来源表和类型 | `storeup` |

## 使用场景

### 管理员

- 查看仪表盘统计和互动热度。
- 管理中式美食、外国美食、热门菜品。
- 维护资讯、论坛、留言、收藏数据。
- 审核菜品状态并维护审核回复。

### 普通用户

- 浏览平台已有菜品和资讯数据。
- 参与论坛与留言互动。
- 查看收藏和个人资料演示数据。

## 前后端调用链

```text
site/app.js
  -> fetch(`${API_BASE}/api/${path}`)
  -> Cloudflare Pages Functions / Worker
  -> public.ot_springbooth10zf_rest(...)
  -> ot_springbooth10zf.<table>
```

主要接口：

```text
/api/login
/api/summary
/api/zhongshimeishi/list
/api/waiguomeishi/list
/api/remencaipin/list
/api/forum/add
/api/messages/update
```

## 数据流

1. 用户在浏览器选择管理员或普通用户身份登录。
2. 前端向 `/api/login` 提交账号、密码和角色。
3. Worker 通过 Supabase RPC 查询 `ot_springbooth10zf.users` 或 `ot_springbooth10zf.yonghu`。
4. 登录成功后返回脱敏用户信息，不回传密码字段。
5. 前端按模块请求列表或提交新增、编辑、删除动作。
6. Worker 根据模块映射访问对应 Supabase 表。
7. 页面重新渲染仪表盘、列表、表单和提示信息。

## 已实现状态

| 能力 | 状态 | 说明 |
|---|---|---|
| 公开登录页 | 已实现 | 支持管理员和普通用户快捷填充 |
| 仪表盘 | 已实现 | 用户、美食、热门菜品、论坛、留言、收藏、资讯统计 |
| 数据列表 | 已实现 | 核心业务模块可列表展示 |
| 搜索过滤 | 已实现 | 前端按当前列表数据快速过滤 |
| 新增/编辑/删除 | 已实现 | 通过 Worker 写入 Supabase 演示数据 |
| 移动端布局 | 已实现 | 小屏菜单横向滚动，核心内容进入首屏 |
| 原 Spring Boot 全量后端 | 未启用 | 线上演示使用 Worker API 兼容层 |
| 文件上传/人脸比对 | 未复刻 | 作为原项目保留能力，不纳入当前公开演示闭环 |

## 文件职责

| 文件/目录 | 职责 |
|---|---|
| `site/index.html` | 登录页和后台页面骨架 |
| `site/styles.css` | 响应式布局、后台表格、面板和移动端样式 |
| `site/app.js` | 前端模块配置、登录、仪表盘、列表、表单和 API 调用 |
| `site/_worker.js` | Cloudflare Pages 同源 API |
| `worker/src/index.js` | 独立 Cloudflare Worker API |
| `supabase/schema.sql` | 独立 schema、表结构、种子数据和 RPC |
| `src/`、`db/`、`pom.xml` | 原 Spring Boot 项目资料 |
