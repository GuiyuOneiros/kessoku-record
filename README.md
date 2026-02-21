本项目全程由google aistudio协助完成

# 🎸 KESSOKU RECORD (结束记录)

> **Unofficial Bilibili Index for Kessoku Band**  
> 《孤独摇滚！》相关视频索引数据库

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-blue)
![Vite](https://img.shields.io/badge/Vite-6.0-purple)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-cyan)

## 📖 项目简介

**KESSOKU RECORD** 是一个专为《孤独摇滚！》(Bocchi the Rock!) 粉丝打造的现代化静态导航站。它旨在整理和索引 Bilibili 上的相关高质量视频，包括动画正片、广播局、演唱会 Live、声优活动以及舞台剧等。

本项目采用 **Serverless** 架构，前端部署在边缘网络（Cloudflare Pages / EdgeOne Pages），数据存储采用 KV 键值数据库，无需维护传统后端服务器。

### ✨ 核心功能

*   **现代化 UI 设计**：采用 Card Design，融入结束乐队标志性的“扎带”Logo 与角色代表色（粉/蓝/红/黄）。
*   **高性能索引**：针对数千条链接优化，支持**分页加载**（每页 60 条），确保页面秒开。
*   **多维筛选**：支持按 **主分类**、**子分类**（如：熟肉/切片）、**年份** 以及 **关键词搜索** 进行过滤。
*   **后台管理系统**：内置 `/admin` 管理面板，支持在线 **添加 / 编辑 / 删除** 视频链接。
*   **云端同步**：通过 Serverless Functions 连接 KV 存储，实现数据的云端持久化。
*   **双重备份机制**：支持将数据导出为 `constants.ts` 文件，方便回滚与 GitHub 备份。

---

## 🛠️ 技术栈

*   **构建工具**: [Vite](https://vitejs.dev/)
*   **前端框架**: [React](https://reactjs.org/) (TypeScript)
*   **路由管理**: [React Router v6](https://reactrouter.com/) (支持 HashRouter 兼容静态部署)
*   **样式库**: [Tailwind CSS](https://tailwindcss.com/)
*   **图标库**: [Lucide React](https://lucide.dev/)
*   **部署平台**: Cloudflare Pages 或 Tencent Cloud EdgeOne Pages
*   **数据存储**: Workers KV / EdgeOne KV

---

## 🚀 本地开发指南

1.  **克隆项目**
    ```bash
    git clone https://github.com/your-username/kessoku-record.git
    cd kessoku-record
    ```

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **启动开发服务器**
    ```bash
    npm run dev
    ```
    访问 `http://localhost:5173` 即可预览。

4.  **构建生产版本**
    ```bash
    npm run build
    ```
    构建产物将生成在 `dist` 目录下。

---

## ☁️ 部署指南

本项目支持部署在任何支持静态网站 + Serverless Functions 的平台。

### 选项 A: Cloudflare Pages (推荐)

1.  **创建项目**: 连接 GitHub 仓库，选择 `Create a project`。或者直接上传压缩包。
2.  **构建配置**:
    *   **Build command**: `npm run build`
    *   **Build output directory**: `dist`
3.  **绑定 KV 存储 (重要)**:
    *   在 Cloudflare 控制台，创建一个 **KV Namespace** (例如命名为 `kessoku-db`)。
    *   进入 Pages 项目设置 -> **Settings** -> **Functions** -> **KV Namespace Bindings**。
    *   **Variable name**: `KESSOKU_KV` (必须完全一致)。
    *   **KV Namespace**: 选择你刚才创建的数据库。
4.  **设置环境变量 (重要)**:
    *   进入 **Settings** -> **Environment variables**。
    *   添加变量 `ADMIN_SECRET`，值为你的管理员密码 UUID（建议与代码 `constants.ts` 中的 UUID 保持一致）。

### 选项 B: 腾讯云 EdgeOne Pages

1.  **创建项目**: 导入 GitHub 仓库或者上传压缩包。
2.  **环境配置**:
    *   在项目概览页，找到 **环境配置**。
    *   **KV 存储绑定**: 变量名称填 `KESSOKU_KV`，选择或创建你的 KV 命名空间。
    *   **环境变量**: 添加 `ADMIN_SECRET`，填入你的管理员 UUID。

---

## 🔐 后台管理手册

### 1. 进入后台
访问 `https://你的域名.com/#/admin`。

### 2. 身份验证
输入项目 `constants.ts` 文件中配置的 `ADMIN_UUID`（默认为 `815dd683-be8f-44f0-b0af-a3ed9aadd65d`，**部署前请务必修改**）。

### 3. 数据管理
*   **添加视频**: 填写标题、链接，选择分类、日期。支持手动输入子分类（如“2025新番”），前台会自动生成对应的筛选标签。
*   **编辑视频**: 点击列表右侧的 ✏️ 图标修改现有内容。
*   **日期选择**: 系统会自动将时间修正为当天的中午 12:00，避免时区偏差。

### 4. 备份策略
虽然数据存储在 KV 中，但为了数据安全：
1.  在后台点击 **"下载 constants.ts"** 按钮。
2.  将下载的文件覆盖项目源码中的 `src/constants.ts` (或根目录下的 `constants.ts`)。
3.  提交代码到 GitHub (`git commit & push`)。
    *   这样即便是 KV 数据库丢失，新用户访问时也能看到截至备份时的完整数据。

---

## ⚠️ 免责声明

本项目为 **非官方 (Unofficial)** 粉丝自制项目。
*   所有视频链接均指向 Bilibili 原站，本站不提供任何视频存储服务。
*   项目内引用的“孤独摇滚！”、“Bocchi the Rock!”及其角色形象，版权归属原作者 **Hamaji Aki (芳文社)** 及 **Aniplex** 所有。
*   图标设计灵感来源于“结束乐队”官方 Logo。

---

## 📄 License

MIT License

---

### 以上内容大部分为AI自动生成，仅作少数修改。

本项目为公开展示用。为与已搭建网站做好区分，密码部分已做脱敏修改。

自行搭建请务必 **修改密码**
