# ⚖️ GeM BidVerify — AI-Powered Bid Compliance Verification

> **Hackathon Project** — Automating clause-by-clause compliance verification for Government e-Marketplace (GeM) procurement, powered by multi-provider AI with built-in hallucination detection.

---

## 🧩 Problem Statement

Government procurement on GeM involves evaluating vendor bids against complex tender requirements — financial thresholds, technical certifications (ISO 9001:2015, BIS), legal registrations (GST, MSME), and past experience clauses. Today this is **entirely manual**: procurement officers read through 30–100 page PDFs and cross-check each criterion by hand.

**GeM BidVerify** automates this end-to-end:
1. Upload a Tender/RFP → AI extracts every eligibility criterion automatically
2. Upload a Vendor Bid → AI evaluates compliance clause-by-clause with evidence
3. View a real-time interactive compliance dashboard with confidence scores
4. Export a professional PDF audit report for official records

---

## ✨ Key Innovations

### 🔄 Multi-Provider LLM Architecture
Switch between **3 AI backends** with a single env variable — no code changes:

| Provider | Model | Use Case |
|---|---|---|
| **Gemini** | `gemini-3.6-flash` | Native PDF input, highest accuracy |
| **Groq** | `openai/gpt-oss-120b` | Ultra-fast cloud inference |
| **Ollama** | `qwen2.5:14b-instruct` | Fully offline, zero API costs |

```bash
# Switch provider in backend/.env — restart server, done
MATCHING_PROVIDER=groq    # or 'gemini' or 'ollama'
```

### 🛡️ Hallucination Guard
Every AI-generated evidence snippet is **verified against the source PDF text** using fuzzy string matching. If the AI fabricates a quote, it gets automatically flagged, the verdict is downgraded to "Not Found", and the confidence is capped at 40%. This runs on **all providers**, not just Gemini.

### 📄 Crash-Proof PDF Processing
Replaced the industry-standard `pdf-parse` (which crashes on malformed XRef tables common in government PDFs) with a direct **`pdfjs-dist` v4** implementation — the same engine Firefox uses. Zero unhandled promise rejections, even on edge-case documents.

### 🎯 Structured JSON Output
All AI responses are forced into validated JSON schemas with `response_mime_type: 'application/json'`. No regex parsing, no brittle string splitting — the model returns typed objects or the request fails cleanly.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A Google Gemini API key (required for tender extraction)
- *(Optional)* Groq API key or local Ollama installation

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_REPO/Hackathon-Gem-1.git
cd Hackathon-Gem-1

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
MATCHING_PROVIDER=gemini          # or 'groq' or 'ollama'
GROQ_API_KEY=your_groq_key_here   # only needed if using groq
```

### 3. Start

```bash
# Terminal 1 — Backend (port 3001)
cd backend && node server.js

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Open **http://localhost:5173**

---

## 📋 Demo Flow

### Step 1: Upload Tender
Upload a government tender PDF (e.g., `Tender_IT_Equipment_Supply_GEM2026B123456.pdf` from `sample-docs/`). The AI extracts structured criteria:

- EMD ₹1,00,000 bank guarantee
- Annual turnover ≥ ₹5 crore (3 years)
- ISO 9001:2015 certification
- BIS certification for hardware
- ...and more

### Step 2: Upload Bid & Verify
Upload the vendor's bid PDF. The system evaluates each criterion individually:
- ✅ **Compliant** — requirement met, with evidence quoted from the bid
- ❌ **Non-Compliant** — requirement not satisfied, with AI reasoning
- ⚠️ **Not Found** — no relevant information found in the bid

### Step 3: Review Results
Interactive dashboard with:
- **Score Ring** — animated SVG gauge showing overall compliance %
- **Filter Bar** — toggle between All / Compliant / Non-Compliant / Not Found
- **Evidence Panels** — expand any row to see the exact bid quote and AI analysis
- **Export** — one-click PDF report generation

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React 18 + Vite + Tailwind v4)              │
│  ┌───────────┐ ┌──────────────┐ ┌───────────────────┐  │
│  │UploadCard │ │ComplianceTable│ │  ScoreBadge       │  │
│  └───────────┘ └──────────────┘ └───────────────────┘  │
│              ↕  REST API (/api/*)                       │
├─────────────────────────────────────────────────────────┤
│  Backend (Node.js + Express)                            │
│                                                         │
│  POST /api/upload-tender ───→ geminiService.js          │
│     Native PDF → Gemini → Structured criteria JSON      │
│                                                         │
│  POST /api/verify-compliance ─┬─→ geminiService.js      │
│     Provider router           ├─→ openaiMatchingService │
│     (config/models.js)        │   (Groq / Ollama)       │
│                               └─→ Hallucination Guard   │
│                                                         │
│  POST /api/export-report ───→ reportService.js          │
│     Criteria + Results → PDFKit → downloadable PDF      │
│                                                         │
│  Services:                                              │
│  ├── pdfService.js         (pdfjs-dist v4 extraction)   │
│  ├── geminiService.js      (Gemini AI + guard logic)    │
│  ├── openaiMatchingService (Groq & Ollama via OpenAI)   │
│  └── reportService.js     (PDFKit report generation)    │
└─────────────────────────────────────────────────────────┘
```

---

## 🔑 Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | **Yes** | — | Google Gemini API key (always needed for extraction) |
| `MATCHING_PROVIDER` | No | `gemini` | `gemini`, `groq`, or `ollama` |
| `GROQ_API_KEY` | If using Groq | — | Groq cloud API key |
| `GROQ_MODEL` | No | `openai/gpt-oss-120b` | Groq model name |
| `OLLAMA_BASE_URL` | No | `http://localhost:11434/v1` | Ollama API endpoint |
| `OLLAMA_MODEL` | No | `qwen2.5:14b-instruct` | Ollama model name |
| `PORT` | No | `3001` | Backend server port |

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS v4, Custom glassmorphism UI |
| **Backend** | Node.js, Express, Multer |
| **PDF Extraction** | `pdfjs-dist` v4 (Mozilla's PDF.js) |
| **PDF Generation** | PDFKit |
| **AI — Extraction** | Google Gemini 3.5 Flash Lite (native PDF input) |
| **AI — Matching** | Gemini 3.6 Flash / Groq / Ollama (provider-switchable) |
| **AI SDK** | `@google/generative-ai`, `openai` (OpenAI-compatible client) |

---

## 📁 Sample Documents

Pre-loaded in `sample-docs/`:
- `Tender_IT_Equipment_Supply_GEM2026B123456.pdf` — Example GeM tender with 9 criteria
- `Bid_TechNova_Solutions_GEM2026B123456.pdf` — Matching vendor bid (7/9 compliant)

---

## 👥 Team

Built for the **GeM AI Hackathon 2026**.

---

## 📜 License

MIT
