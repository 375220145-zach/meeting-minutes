# AI Execution Pocket — 部署指南

## 整体架构

```
手机浏览器 ──→ Vercel (前端静态文件) ──→ Railway (后端 Node.js) ──→ DeepSeek API
```

## 第一步：推送到 GitHub

```bash
cd /Users/mac/ai-execution-pocket
git init
git add -A
git commit -m "AI Execution Pocket v1.1.0"
# 在 GitHub 创建仓库后：
git remote add origin https://github.com/<你的用户名>/ai-execution-pocket.git
git push -u origin main
```

## 第二步：部署后端到 Railway

1. 打开 [railway.app](https://railway.app) 登录（用 GitHub 账号）
2. 点击 **New Project** → **Deploy from GitHub repo**
3. 选择 `ai-execution-pocket` 仓库
4. Railway 自动检测 Dockerfile，如有提示选 **Docker** 作为 builder
5. **重要**：设置 Root Directory 为 `packages/backend`
6. 在 **Variables** 页添加环境变量：

| 变量名 | 值 |
|--------|-----|
| `DEEPSEEK_API_KEY` | `sk-你的key` |
| `CORS_ORIGIN` | `https://你的vercel域名.vercel.app`（先留 `*`，部署完前端再改） |

7. 点 **Deploy**，等待完成，记下后端域名（类似 `xxx.railway.app`）

## 第三步：部署前端到 Vercel

1. 打开 [vercel.com](https://vercel.com) 登录（用 GitHub 账号）
2. 点击 **New Project** → 导入 `ai-execution-pocket` 仓库
3. **配置构建**：
   - Framework Preset: **Vite**
   - Root Directory: `packages/frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **添加环境变量**：

| 变量名 | 值 |
|--------|-----|
| `VITE_API_URL` | `https://xxx.railway.app`（第二步的 Railway 域名）|

5. 点 **Deploy**，完成！

## 第四步：收紧 CORS

回到 Railway → Variables，把 `CORS_ORIGIN` 从 `*` 改为你的 Vercel 域名：
```
https://xxx.vercel.app
```

## 验证

- 手机打开 Vercel 域名
- Settings → 设置 API Key → Save（注意：云端存内存中，Railway 重启需重新设置。建议直接在 Railway Variables 设 `DEEPSEEK_API_KEY` 永久生效）
- 上传会议文本 → 分析 → 看到结果

## 更新部署

改代码后：
```bash
git add -A && git commit -m "update" && git push
```
Vercel + Railway 自动检测推送并重新部署。
