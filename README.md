# PoliteAI — AI Politeness Evaluation Experimental Platform

**PoliteAI** is a web-based AI politeness evaluation experimental platform that allows users to score outputs of various AI models across multiple dimensions, helping researchers collect data related to AI politeness.
<img width="2862" height="1730" alt="image" src="https://github.com/user-attachments/assets/0605d087-ce52-4e61-8577-7e58cb38f7f0" />
<img width="2862" height="1730" alt="" src="https://github.com/user-attachments/assets/d6f43d37-ef2c-40b5-af4d-02e037e02ce0" />
<img width="2875" height="1721" alt="" src="https://github.com/user-attachments/assets/135cd2b6-107f-43e9-b976-6a4853116037" />

---

## 🏗️ Technology Stack

| Module | Technology |
|---|---|
| **Frontend Framework** | Next.js 16 (App Router) + React 19 |
| **Styling System** | Tailwind CSS v4 + shadcn/ui (base-nova) |
| **Internationalization (i18n)** | next-intl (route-level `/[locale]/`) |
| **Database** | SQLite + Drizzle ORM (sql.js) |
| **Cache** | Redis (Upstash) |
| **Rich Text Editor** | TipTap (StarterKit) |
| **Charts** | Recharts |
| **Drag-and-drop** | @dnd-kit |
| **Animation** | framer-motion |
| **Authentication** | bcryptjs + HttpOnly Cookie |
| **Export** | @react-pdf/renderer (PDF), archiver (ZIP) |
| **Deployment** | Nginx + PM2 |

---

## 📁 Project Structure

```
src/
├── app/
│├── [locale]/# Internationalized routes (zh/en)
││└── (routes)/# Client-side pages
│├── admin/# Admin pages
│└── api/# API routes
├── components/
│├── ui/# shadcn/ui components
│├── user/# Client-side components
│├── admin/# Admin components
│└── shared/# Shared components
├── lib/
│├── db/# Database configuration & schema
│├── redis/# Redis client
│├── auth/# Authentication utilities
│├── engine/# Random distribution engine
│└── export/# Data anonymization tools
├── dictionaries/# i18n dictionaries (zh.json, en.json)
└── data/# SQLite database file
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 22+
- npm 11+

### Installation & Running

```bash
# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your configurations

# Initialize database
npm run db:migrate
npm run db:seed

# Start development server
npm run dev

# Build for production
npm run build
npm run start
```

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | SQLite database path | `./data/politeai.db` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL | - |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis Token | - |
| `AUTH_SECRET` | Authentication key (64-character hex) | auto-generated |
| `NEXT_PUBLIC_APP_URL` | Public URL of the application | `http://localhost:3000` |

---

## 📋 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run test` | Run tests |
| `npm run lint` | Code linting |
| `npm run db:migrate` | Database migration |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed data |
| `npm run db:studio` | Start Drizzle Studio |

---

## 🧭 Feature Overview

### Client Side

| Route | Feature |
|---|---|
| `/[locale]` | Welcome page, language switch, start experiment |
| `/[locale]/rules` | Scoring rules explanation, 5 dimensions introduction |
| `/[locale]/rate` | Scoring dashboard: 15 items per round, 5 dimensions 1-5 star rating |
| `/[locale]/submit` | Submit feedback, note editor (TipTap) |

### Admin Side

| Route | Feature |
|---|---|
| `/admin` | Authentication gateway (first-time registration, subsequent login) |
| `/admin/ai` | AI model CRUD |
| `/admin/topics` | Topic management (TipTap editor, JSON import/export) |
| `/admin/dimensions` | Dimension management (drag-and-drop sorting, Chinese-English, up to 10 items) |
| `/admin/stats` | Data statistics (summary cards + 4-level expandable tree + bar chart + export) |

---

## 🧠 Core Business Logic

### Random Distribution Engine
- Fisher-Yates shuffle algorithm + constrained sampling
- 15 items per round, 1 item per AI model
- Politeness levels L1/L2/L3 each at least 3 items
- Returns HTTP 503 if insufficient items (less than 15)
- Repeated item prevention: Redis `seen:{fingerprint}` tracks seen items

### Device Fingerprinting
- Canvas fingerprint + WebGL + timezone + random salt
- SHA-256 hash generates unique identifier

### Rate Limiting
- Redis `rate:{ip}:{date}` key, daily limit configurable
- Admin can dynamically adjust via API `/api/admin/config/rate-limit`

### Data Anonymization
- Export: `session_id` → `ANON_{sha256_hash}`
- Remove `ip_hash` and `device_fingerprint` fields

---

## 🐳 Deployment

Docker is explicitly forbidden for this project. Use Nginx + PM2 for deployment.

```bash
# Build
npm run build

# Start with PM2
pm2 start ecosystem.config.js
```

Refer to `nginx/site.conf` to configure Nginx reverse proxy.

---

## 📄 License

MIT

---

## 📊 Database Schema

| Table | Description |
|---|---|
| `admin` | Administrator accounts |
| `ai_model` | AI model labels |
| `topic` | Topics (AI output content) |
| `dimension` | Scoring dimensions |
| `session` | Anonymous user sessions |
| `submission` | Scoring details |

# PoliteAI — AI礼貌性评估实验平台

**PoliteAI** 是一个基于 Web 的 AI 礼貌性评估实验平台，允许用户对多种 AI 模型的输出内容进行多维度评分，帮助研究者收集 AI 礼貌性相关数据。

**PoliteAI** is a web-based AI politeness evaluation experiment platform that allows users to rate AI model outputs across multiple dimensions, helping researchers collect data on AI politeness.
<img width="2862" height="1730" alt="image" src="https://github.com/user-attachments/assets/2c3e5f3b-df0a-481d-b85f-8a69012acccb" />
<img width="2862" height="1730" alt="image" src="https://github.com/user-attachments/assets/6db728ed-355d-4f62-9d0e-09baa4b607a3" />
<img width="2862" height="1730" alt="image" src="https://github.com/user-attachments/assets/f6ee3b43-993e-4974-a9c0-0c5385359ef4" />

---

## 🏗️ 技术栈 / Tech Stack

| 模块 / Module | 技术选型 / Technology |
|---|---|
| **前端框架 / Frontend** | Next.js 16 (App Router) + React 19 |
| **样式系统 / Styling** | Tailwind CSS v4 + shadcn/ui (base-nova) |
| **国际化 / i18n** | next-intl (路由级 `/[locale]/`) |
| **数据库 / Database** | SQLite + Drizzle ORM (sql.js) |
| **缓存 / Cache** | Redis (Upstash) |
| **富文本 / Rich Text** | TipTap (StarterKit) |
| **图表 / Charts** | Recharts |
| **拖拽 / Drag** | @dnd-kit |
| **动画 / Animation** | framer-motion |
| **认证 / Auth** | bcryptjs + HttpOnly Cookie |
| **导出 / Export** | @react-pdf/renderer (PDF), archiver (ZIP) |
| **部署 / Deploy** | Nginx + PM2 |

---

## 📁 项目结构 / Project Structure

```
src/
├── app/
│   ├── [locale]/          # 国际化路由 (zh/en)
│   │   └── (routes)/      # 用户端页面
│   ├── admin/             # 管理端页面
│   └── api/               # API 路由
├── components/
│   ├── ui/                # shadcn/ui 组件
│   ├── user/              # 用户端组件
│   ├── admin/             # 管理端组件
│   └── shared/            # 共享组件
├── lib/
│   ├── db/                # 数据库配置与 schema
│   ├── redis/             # Redis 客户端
│   ├── auth/              # 认证工具
│   ├── engine/            # 随机分发引擎
│   └── export/            # 数据脱敏工具
├── dictionaries/          # i18n 字典 (zh.json, en.json)
└── data/                  # SQLite 数据库文件
```

---

## 🚀 快速开始 / Quick Start

### 环境要求 / Prerequisites
- Node.js 22+
- npm 11+

### 安装与运行 / Install & Run

```bash
# 安装依赖 / Install dependencies
npm install

# 配置环境变量 / Configure environment
cp .env.local.example .env.local
# 编辑 .env.local 填入配置 / Edit .env.local with your config

# 初始化数据库 / Initialize database
npm run db:migrate
npm run db:seed

# 启动开发服务器 / Start dev server
npm run dev

# 构建生产版本 / Build for production
npm run build
npm run start
```

### 环境变量 / Environment Variables

| 变量 / Variable | 说明 / Description | 默认值 / Default |
|---|---|---|
| `DATABASE_URL` | SQLite 数据库路径 | `./data/politeai.db` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL | - |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis Token | - |
| `AUTH_SECRET` | 认证密钥（64字符 hex） | 自动生成 |
| `NEXT_PUBLIC_APP_URL` | 应用公共 URL | `http://localhost:3000` |

---

## 📋 可用脚本 / Available Scripts

| 命令 / Command | 说明 / Description |
|---|---|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run start` | 启动生产服务器 |
| `npm run test` | 运行测试 |
| `npm run lint` | 代码检查 |
| `npm run db:migrate` | 数据库迁移 |
| `npm run db:push` | 推送 schema 到数据库 |
| `npm run db:seed` | 填充种子数据 |
| `npm run db:studio` | 启动 Drizzle Studio |

---

## 🧭 功能概览 / Feature Overview

### 用户端 / User Side

| 路由 / Route | 功能 / Feature |
|---|---|
| `/[locale]` | 欢迎页，语言切换，开始实验 |
| `/[locale]/rules` | 评分规则说明，5 维度介绍 |
| `/[locale]/rate` | 评分工作台：15 题/轮，5 维度 1-5 星评分 |
| `/[locale]/submit` | 提交反馈，笔记编辑器（TipTap） |

### 管理端 / Admin Side

| 路由 / Route | 功能 / Feature |
|---|---|
| `/admin` | 认证网关（首次注册，后续登录） |
| `/admin/ai` | AI 模型 CRUD |
| `/admin/topics` | 题目管理（TipTap 编辑器，JSON 导入/导出） |
| `/admin/dimensions` | 维度管理（拖拽排序，中英文，上限 10 个） |
| `/admin/stats` | 数据统计（汇总卡片 + 4 级可展开树 + 柱状图 + 导出） |

---

## 🧠 核心业务逻辑 / Core Business Logic

### 随机分发引擎 / Random Distribution Engine
- Fisher-Yates shuffle 算法 + 约束采样
- 每轮 15 题，每 AI 模型 1 题
- 礼貌等级 L1/L2/L3 各至少 3 题
- 不足 15 题返回 HTTP 503
- 重复题目防护：Redis `seen:{fingerprint}` 追踪已见题目

### 设备指纹 / Device Fingerprinting
- Canvas 指纹 + WebGL + 时区 + 随机盐
- SHA-256 哈希生成唯一标识

### 限流 / Rate Limiting
- Redis `rate:{ip}:{date}` 键，每日上限可配置
- 管理员可通过 API `/api/admin/config/rate-limit` 动态调整

### 数据脱敏 / Data Sanitization
- 导出时 `session_id` → `ANON_{sha256_hash}`
- 移除 `ip_hash` 和 `device_fingerprint` 字段

---

## 🐳 部署 / Deployment

本项目禁止使用 Docker。使用 Nginx + PM2 部署。

This project explicitly forbids Docker. Use Nginx + PM2 for deployment.

```bash
# 构建 / Build
npm run build

# 使用 PM2 启动 / Start with PM2
pm2 start ecosystem.config.js
```

参考 `nginx/site.conf` 配置 Nginx 反向代理。

---

## 📄 许可 / License

MIT

---

## 📊 数据库 Schema / Database Schema

| 表名 / Table | 说明 / Description |
|---|---|
| `admin` | 管理员账号 |
| `ai_model` | AI 模型标签 |
| `topic` | 题目（AI 输出内容） |
| `dimension` | 评分维度 |
| `session` | 匿名用户会话 |
| `submission` | 评分明细 |
