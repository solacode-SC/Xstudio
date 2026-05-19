# 🗂️ Xstudio | Premium PDF Toolkit SaaS

**Xstudio** is a highly polished, brutalist-inspired full-stack web application designed for seamless, local-first PDF manipulation. Engineered with a Next.js frontend and an asynchronous FastAPI Python backend, it offers a zero-friction, no-auth suite of powerful PDF utilities operating entirely within a containerized environment.

---

## ✨ Features

- ✂️ **Split & Extract Pages**: Instantly slice PDFs using precise page-range configurations.
- 📚 **Merge Documents**: Effortlessly combine multiple PDFs sequentially.
- 🗜️ **Smart Compression**: Compress large PDFs into minimal sizes without destroying typography.
- 🔄 **Rotate & Delete**: Re-orient individual pages or delete them from large decks.
- 🖼️ **PDF ⇄ Images (A4 Ready)**: Convert PDFs into `.zip` archives of crisp JPGs, or seamlessly combine JPGs/PNGs onto perfectly formatted A4 PDFs with lossless Lanczos resampling.
- 📝 **PDF to Word**: Extract plaintext and layouts natively into `.docx` documents.

## 🛠️ Architecture & Tech Stack

Xstudio utilizes a fully containerized monorepo setup:

- **Frontend (`/frontend`)**: Next.js 14, Tailwind CSS, Lucide-React, React Dropzone. Monochromatic, highly-responsive "Waiv Dashboard" aesthetic. 
- **Backend (`/backend`)**: FastAPI, PyMuPDF (`fitz`), Pillow (PIL), `python-docx`. Native memory-efficient asynchronous processing via UUID-namespaced temporary directories.
- **Infrastructure**: Docker & Docker-Compose orchestrating internal `xstudio-network`.

---

## 🚀 Quick Start (Development)

The entire environment is orchestrated via the provided `Makefile` for a friction-less developer experience. Ensure you have Docker installed.

```bash
# 1. Start the dev stack (Backend & Frontend)
make dev

# 2. View live logs across both containers
make logs

# 3. Stop the dev stack
make dev-down
```

### Accessing the App:
- **Client Application**: [http://localhost:3001](http://localhost:3001)
- **FastAPI OpenAPI Swagger**: [http://localhost:8001/docs](http://localhost:8001/docs)

### API Routing
The frontend calls relative `/api` and `/files` paths.

- **Docker dev/prod**: `BACKEND_ORIGIN` enables a Next.js rewrite proxy. Note that Next.js rewrites are generated at **build time**, so `BACKEND_ORIGIN` must be available during `next build` (the provided docker-compose files pass it as a build arg).
- **Behind a reverse proxy (Nginx/Traefik/etc.)**: alternatively proxy `/api` and `/files` to the backend service.

## 📂 Project Structure

```text
xstudio/
├── frontend/
│   ├── app/           # Next.js 14 App Router
│   ├── components/    # Reusable React components (Sidebar, UploadZone, PreviewPanel)
│   └── lib/           # Centralized API logic (api.ts)
├── backend/
│   ├── routers/       # FastAPI routing logic (process.py)
│   ├── tools/         # 9 discrete PDF utility modules
│   └── utils/         # Async garbage collection daemon
├── docker-compose.dev.yml  # Dev mode stack
├── docker-compose.prod.yml # Prod mode stack
├── docker-compose.yml      # Legacy single-mode compose
└── Makefile                # Dev-ops automation
```

## 🔒 Security & Data Privacy
Xstudio is engineered as a privacy-first utility. Uploads are written to an ephemeral `/tmp` namespace mapped strictly within the backend container. An asynchronous background daemon (`cleanup.py`) automatically wipes files and generated assets older than 10 minutes to prevent system bloat and ensure zero data retention.

---
*Crafted for speed, aesthetics, and pure utility.*
