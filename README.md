# GeM AI Bid Compliance Verification Platform

> **Hackathon Project** — AI-powered bid compliance verification for Government e-Marketplace (GeM) procurement.

## 🚀 Quick Start

### 1. Set up API Key

```bash
cp backend/.env.example backend/.env
# Edit backend/.env and add your GEMINI_API_KEY
```

### 2. Start Both Servers

```bash
# Start backend
cd backend && npm start

# In another terminal, start frontend
cd frontend && npm run dev
```

### 3. Open App

Navigate to **http://localhost:5173**

## 📋 Demo Flow

1. Upload a Tender/RFP PDF → AI extracts eligibility criteria
2. Upload a Vendor Bid PDF → Click "Verify Compliance"
3. View clause-by-clause compliance report with evidence snippets
4. Export as PDF for audit trail

## 🏗️ Architecture

```
frontend (React + Vite + Tailwind v4)
    ↕ REST API (/api/*)
backend (Node.js + Express)
    ├── POST /api/upload-tender  → Extract criteria via Gemini AI
    ├── POST /api/verify-compliance → Match each criterion via Gemini AI
    └── POST /api/export-report → Generate PDF audit report
```

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `PORT` | No | Backend port (default: 3001) |

## 📦 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS v4
- **Backend**: Node.js, Express, Multer, pdf-parse, PDFKit
- **AI**: Google Gemini 2.0 Flash (structured JSON output)
- **PDF**: pdf-parse (extraction) + PDFKit (report generation)
