# 🃏 Poker Verify Tool — Deployment Info

## 📘 General Information
| Key | Value |
|-----|--------|
| **Project Name** | tc-page-pk |
| **Branch** | `main` |
| **Framework** | Next.js 14 |
| **Node Version** | v24.7.0 |
| **Package Manager** | npm |
| **Port** | 3000 |
| **Output Folder** | `.next/` |
| **Static Assets** | `.next/static/` and `/public/` |
| **Start Command** | `npm run start` |
| **Build Type** | SSR (Server-Side Rendering) |
| **Dockerfile** | Not used |

---

## ⚙️ Build & Run Instructions

### 🧱 Build
```bash
npm install
npm run build
```

### 🚀 Run    
```bash
npm run start
```

## 🌍 Environment Variables
These variables must be configured by DevOps (in GitHub Secrets or on the server).

| Variable | Example | Description | Required |
|-----------|----------|-------------|-----------|
| NEXT_PUBLIC_API_URL | https://api-staging.company.com | Base API endpoint | ✅ |
| NODE_ENV | production | Environment mode | ✅ |

## 🎉 Happy coding!

