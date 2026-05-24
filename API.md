# PoliteAI API 文档 / API Documentation

> 所有 API 路由默认返回 JSON。管理端 API 需要 `auth_token` Cookie（登录后自动设置）。
> All API routes return JSON by default. Admin API routes require `auth_token` cookie (set automatically after login).

---

## 📋 路由总览 / Route Overview

### 用户端 API / User API

| 方法 | 路由 | 说明 |
|---|---|---|
| POST | `/api/rate/start` | 开始新一轮评分 |
| POST | `/api/rate/submit` | 提交评分 |
| PATCH | `/api/rate/notes` | 更新评分笔记 |
| GET | `/api/rate/round/[roundId]` | 获取轮次题目 |

### 认证 API / Auth API

| 方法 | 路由 | 说明 |
|---|---|---|
| POST | `/api/auth/register` | 管理员注册（首次） |
| POST | `/api/auth/login` | 管理员登录 |
| POST | `/api/auth/logout` | 管理员退出 |
| GET | `/api/auth/check-init` | 检查是否已初始化 |

### 管理 API / Admin API

| 方法 | 路由 | 说明 |
|---|---|---|
| GET/POST | `/api/admin/ai` | AI 模型列表/创建 |
| PATCH | `/api/admin/ai/[id]` | 更新/归档 AI 模型 |
| GET/POST | `/api/admin/topics` | 题目列表/创建 |
| PATCH | `/api/admin/topics/[id]` | 更新/归档题目 |
| GET | `/api/admin/topics/export` | 导出题目 JSON |
| POST | `/api/admin/topics/import` | 导入题目 JSON |
| GET/POST | `/api/admin/dimensions` | 维度列表/创建 |
| PATCH | `/api/admin/dimensions/[id]` | 更新/删除维度 |
| PATCH | `/api/admin/dimensions/reorder` | 批量排序维度 |
| GET | `/api/admin/stats/summary` | 统计数据概览 |
| GET | `/api/admin/stats/tree` | 统计数据树 |
| GET | `/api/admin/stats/distribution/[dimId]` | 星级分布 |
| GET/POST | `/api/admin/config/rate-limit` | 限流配置 |

### 导出 API / Export API

| 方法 | 路由 | 说明 |
|---|---|---|
| GET | `/api/export/json` | 导出 JSON 报告 |
| GET | `/api/export/pdf` | 导出 PDF 报告 |
| GET | `/api/export/web` | 导出网页报告 (ZIP) |

---

## 一、用户端 API

### 1.1 开始评分

```
POST /api/rate/start
```

**请求体:**

```json
{
  "fingerprint": "设备指纹字符串"
}
```

**响应 (200):**

```json
{
  "roundId": "uuid",
  "topics": [
    {
      "id": "topic-uuid",
      "content_md": "# Markdown 内容",
      "ai_model_id": "model-uuid",
      "politeness_level": 1
    }
  ]
}
```

**错误:**

| 状态码 | 说明 |
|---|---|
| 429 | 每日评分上限已达 |
| 503 | 题库不足 |

---

### 1.2 提交评分

```
POST /api/rate/submit
```

**请求体:**

```json
{
  "roundId": "round-uuid",
  "sessionId": "session-uuid",
  "submissions": [
    {
      "topicId": "topic-uuid",
      "dimensionId": "dim-uuid",
      "score": 4
    }
  ]
}
```

**响应 (200):** `{ "success": true, "sessionId": "session-uuid" }`

---

### 1.3 更新评分笔记

```
PATCH /api/rate/notes
```

**请求体:**

```json
{
  "sessionId": "session-uuid",
  "topicId": "topic-uuid",
  "dimensionId": "dim-uuid",
  "note_md": "笔记内容（最多500字）"
}
```

**响应 (200):** `{ "success": true }`

---

### 1.4 获取轮次题目

```
GET /api/rate/round/:roundId
```

**响应 (200):**

```json
{
  "topics": [
    {
      "id": "topic-uuid",
      "content_md": "# Markdown 内容",
      "ai_model_id": "model-uuid",
      "politeness_level": 1
    }
  ]
}
```

---

## 二、认证 API

### 2.1 管理员注册

```
POST /api/auth/register
```

**请求体:** `{ "username": "admin", "password": "password123" }`

**响应 (200):** 设置 `auth_token` Cookie。`{ "success": true }`

**说明:** 仅首次访问可用（admin 表 `is_initialized = false`）。

---

### 2.2 管理员登录

```
POST /api/auth/login
```

**请求体:** `{ "username": "admin", "password": "password123" }`

**响应 (200):** 设置 `auth_token` Cookie。`{ "success": true }`

**错误:**

| 状态码 | 说明 |
|---|---|
| 401 | 用户名或密码错误 |
| 429 | 尝试次数过多，含 `retryAfter`（秒） |

---

### 2.3 管理员退出

```
POST /api/auth/logout
```

**响应 (200):** 清除 `auth_token` Cookie。`{ "success": true }`

---

### 2.4 检查初始化状态

```
GET /api/auth/check-init
```

**响应 (200):** `{ "initialized": true }`

`initialized: false` 表示尚无管理员，应跳转到注册页。

---

## 三、管理 API

> 所有管理 API 需要 `auth_token` Cookie，否则返回 401。

### 3.1 AI 模型管理

```
GET   /api/admin/ai                  # 获取所有 AI 模型
POST  /api/admin/ai                  # 创建 AI 模型
PATCH /api/admin/ai/:id              # 更新或归档 AI 模型
```

**POST 请求体:** `{ "custom_name": "模型名称" }`

**PATCH 请求体:** `{ "custom_name": "新名称" }` 或 `{ "is_active": false }`（归档）

**POST 响应 (201):** `{ "success": true }`

---

### 3.2 题目管理

```
GET   /api/admin/topics                     # 获取题目列表
POST  /api/admin/topics                     # 创建题目
PATCH /api/admin/topics/:id                 # 更新或归档题目
GET   /api/admin/topics/export              # 导出题目 JSON
POST  /api/admin/topics/import              # 导入题目 JSON
```

**GET 筛选参数:** `ai_model_id`, `politeness_level`, `is_active`

**POST 请求体:**

```json
{
  "ai_model_id": "model-uuid",
  "politeness_level": 1,
  "content_md": "# 题目内容"
}
```

**导入请求体 (POST /import):**

```json
[
  { "ai_model_id": "model-uuid", "politeness_level": 1, "content_md": "# 内容" }
]
```

**导入响应:** `{ "created": 10, "failed": 0, "errors": [] }`

---

### 3.3 维度管理

```
GET   /api/admin/dimensions                 # 获取维度列表
POST  /api/admin/dimensions                 # 创建维度（最多10个）
PATCH /api/admin/dimensions/:id             # 更新或删除维度
PATCH /api/admin/dimensions/reorder         # 批量排序
```

**POST 请求体:**

```json
{
  "title_cn": "可读性",
  "title_en": "Readability",
  "desc_cn": "文本是否流畅易懂",
  "desc_en": "How fluent and easy to understand"
}
```

**Reorder 请求体:** `[{ "id": "uuid", "sort_order": 0 }]`

---

### 3.4 数据统计

```
GET /api/admin/stats/summary
GET /api/admin/stats/tree
GET /api/admin/stats/distribution/:dimId?ai_model_id=xxx&politeness_level=1
```

**Summary 响应:**

```json
{
  "totalSessions": 142,
  "totalSubmissions": 2130,
  "totalRounds": 142,
  "latestActivity": "2026-05-17T12:00:00.000Z"
}
```

**Distribution 响应:** `{ "1": 12, "2": 45, "3": 88, "4": 320, "5": 665 }`

---

### 3.5 限流配置

```
GET  /api/admin/config/rate-limit
POST /api/admin/config/rate-limit
```

**GET 响应:** `{ "maxRounds": 5 }`

**POST 请求体:** `{ "maxRounds": 10 }`（限制: 1-100）

---

## 四、导出 API

> 需要管理员认证。

### 4.1 JSON 导出

```
GET /api/export/json
```

返回 JSON 文件。含 meta、summary、tree、dimension_distribution。

**脱敏:** `session_id` → `ANON_{sha256_hash}`，`ip_hash`/`device_fingerprint` 被移除。

---

### 4.2 PDF 导出

```
GET /api/export/pdf
```

返回 PDF 文件（A4 纵向）。

---

### 4.3 网页导出

```
GET /api/export/web
```

返回 ZIP 文件，内含独立 HTML 报告（浏览器可直接打开）。

---

## 五、错误格式

```json
{ "error": "error_code", "message": "错误描述" }
```

| 错误码 | 说明 |
|---|---|
| `unauthorized` | 未认证 (401) |
| `validation_error` | 输入验证失败 (400) |
| `database_error` | 数据库错误 (500) |
| `service_unavailable` | 服务不可用 (503) |
| `internal_error` | 内部错误 (500) |
| `rate_limit` | 达到限流上限 (429) |
| `insufficient_topics` | 题库不足 (503) |
