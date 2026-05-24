# Payment Transfer System | نظام إدارة الحوالات المالية

Full-stack multi-branch money transfer management platform built with **Next.js 14** and **FastAPI**.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791)](https://www.postgresql.org/)

---

## Overview

A production-grade fintech-style application for managing financial transfers across multiple branches. Supports three user roles with dedicated dashboards, real-time notifications, PDF receipts, and comprehensive reporting.

### Features

- **Multi-role access** — Director, Branch Manager, Employee
- **Money transfers** — Create, track, and confirm inter-branch transfers (SYP & USD)
- **Branch management** — Fund allocation, tax rates, profit tracking
- **Reports & analytics** — Filterable reports with PDF/Excel export
- **Receipt printing** — Arabic-formatted transfer receipts
- **Real-time notifications** — Socket.io powered alerts
- **Inventory & tax tracking** — Branch-level tax and inventory views

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | FastAPI, SQLAlchemy, PostgreSQL |
| Auth | JWT (python-jose), bcrypt |
| Real-time | Socket.io |
| Charts | Recharts |
| PDF | jsPDF, html2canvas |

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL 15+

### 1. Clone & install

```bash
git clone https://github.com/ahmad-alhalwany/payment-transfer-system.git
cd payment-transfer-system

npm install
```

### 2. Backend setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
python seed.py
uvicorn server_improved:app --reload --port 8000
```

### 3. Frontend setup

```bash
# From project root
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Accounts

After running `python seed.py`:

| Role | Username | Password |
|------|----------|----------|
| Director | `director` | `demo123` |
| Branch Manager | `manager` | `demo123` |
| Employee | `employee` | `demo123` |

---

## Project Structure

```
├── app/                  # Next.js App Router pages
│   ├── dashboard/        # Director dashboard
│   ├── branch-dashboard/ # Branch manager dashboard
│   └── money-transfer/   # Employee transfer interface
├── backend/              # FastAPI server
│   ├── server_improved.py
│   ├── models.py
│   ├── seed.py           # Demo data seeder
│   └── security.py
├── components/           # React components
└── lib/                  # Utilities & API helpers
```

---

## Deployment

### Frontend (Vercel)

1. Connect the repo to Vercel
2. Set `NEXT_PUBLIC_API_URL` to your backend URL
3. Deploy

### Backend (Railway / Render)

1. Set environment variables from `backend/.env.example`
2. Set `ENVIRONMENT=production` and a strong `SECRET_KEY`
3. Start command: `uvicorn server_improved:app --host 0.0.0.0 --port $PORT`
4. Run `python seed.py` once after first deploy (demo only)

---

## Environment Variables

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
JWT_SECRET=your-secret
```

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql+psycopg2://user:pass@host:5432/dbname
SECRET_KEY=your-64-char-hex-secret
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ENVIRONMENT=production
```

---

## License

MIT — free to use for learning and portfolio purposes.

---

## Author

**Ahmad Al-Halwany**

Built as a portfolio showcase of full-stack fintech development.
