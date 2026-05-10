# BillBro Backend

Quick notes to run the backend locally for development:

Prerequisites
- Node.js (v18+), npm
- MongoDB running locally or remote Mongo URI

Setup
1. Copy `.env.example` to `.env` and fill values (MONGO_URI, JWT_SECRET, SMTP/AWS if used).
2. Install dependencies:

```powershell
Set-Location backend
npm install
```

Run

```powershell
Set-Location backend
npm run dev
```

Seed demo data

```powershell
Set-Location backend
node scripts/seedDemoData.js
```

Notes
- API routes are in `backend/routes` and controllers in `backend/controllers`.
- Invoice PDFs are generated to `backend/uploads/invoices` by default and uploaded to S3 if configured.
