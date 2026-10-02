# SecureDocs: Cryptographic Evidence & Case Management System
### Full-Stack Product Hackathon

---

## 🏆 Evaluation Rubric Alignment (100 Marks)

| Evaluation Criteria | Marks | Implementation in SecureDocs |
|---------------------|-------|-----------------------------|
| **Functional Completeness & Technical Implementation** | **35** | Full-Stack: Pure React.js frontend, Node.js + Express backend, MongoDB database (Mongoose), Full CRUD operations on Cases & Documents, JWT Authentication with role-based access (Admin, Officer, Legal Reviewer, Auditor), SHA-256 cryptographic hash computation on upload & tamper detection. |
| **Product Quality, Innovation & User Experience** | **15** | Modern, responsive Tailwind UI, real-time client-side & server-side SHA-256 calculation via Web Crypto API, blockchain-inspired hash chaining (`eventHash` linked to `previousHash`), instant search & filtering, pre-loaded demo credentials. |
| **Product Demonstration & Presentation** | **10** | Built-in database seeder (`npm run seed`) with realistic government case files, FIRs, and forensic reports; 1-click test credentials on login page for effortless jury walkthrough. |
| **Response to Jury Questions** | **20** | Clean, modular codebase in pure JavaScript (`.js` & `.jsx`). Zero obscure build tools or TypeScript errors, clear Mongoose schemas, and well-documented REST APIs. |
| **Improvements after Jury Suggestions** | **20** | Flexible component and route architecture designed for rapid on-the-spot modifications and additions during jury feedback rounds. |
| **Total** | **100** | **Complete Full-Stack Production Prototype** |

---

## 🚀 Tech Stack

- **Frontend**: Pure **React.js** (Vite + Tailwind CSS + Lucide Icons + Wouter).
  - *Zero TypeScript (`.ts`/`.tsx`) — 100% clean `.js` and `.jsx`*.
- **Backend**: Pure **Node.js** + **Express.js** REST API.
  - *Zero TypeScript — 100% clean `.js` with native ESM*.
- **Database**: **MongoDB** with **Mongoose** ODM.
  - *Resilient multi-tier connection: connects to MongoDB Atlas or local MongoDB, with an automated embedded engine fallback so the app NEVER fails during evaluation*.
- **Security & Cryptography**: Native Node.js & Web Crypto SHA-256 hashing, JWT authentication, Bcrypt password encryption, blockchain-style audit event chaining.

---

## 📁 Clean Project Directory Structure

```
securedocs-app/
├── backend/                  # Pure Node.js & Express REST Backend
│   ├── src/
│   │   ├── lib/              # Database connection & audit helper
│   │   │   ├── db.js         # Multi-tier MongoDB connection
│   │   │   └── audit.js      # Cryptographic SHA-256 hash chaining
│   │   ├── middleware/
│   │   │   └── auth.js       # JWT validation & role authorization
│   │   ├── models/           # Mongoose Data Models
│   │   │   ├── User.js       # User accounts & RBAC
│   │   │   ├── Case.js       # Case files & status
│   │   │   ├── Document.js   # Evidentiary records & hashes
│   │   │   └── AuditLog.js   # Immutable tamper-evident audit ledger
│   │   ├── routes/           # REST Endpoints
│   │   │   ├── auth.js       # Login, Register, Profile
│   │   │   ├── cases.js      # Full CRUD on Cases
│   │   │   ├── documents.js  # Upload (Multer), Hash, Download, Verify
│   │   │   ├── audit.js      # Audit log list & Chain verification
│   │   │   └── dashboard.js  # Live KPI aggregation
│   │   ├── seed.js           # Automated demo data seeder
│   │   └── server.js         # Express server entry point (Port 5001)
│   ├── .env                  # Configuration (MongoDB URI, JWT Secret)
│   └── package.json
│
├── frontend/                 # Pure React.js UI (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/       # Reusable React Components
│   │   │   ├── Layout.jsx    # Application shell
│   │   │   ├── Navbar.jsx    # Top header with search & user status
│   │   │   ├── Sidebar.jsx   # Dark navy navigation drawer
│   │   │   ├── StatusBadge.jsx # Status & priority pills
│   │   │   └── Modal.jsx     # Reusable dialog modal
│   │   ├── context/
│   │   │   └── AuthContext.jsx # React session & JWT state
│   │   ├── pages/            # Core Functional Pages
│   │   │   ├── Login.jsx     # Login with 1-click test credentials
│   │   │   ├── Register.jsx  # New officer registration
│   │   │   ├── Dashboard.jsx # KPI statistics & recent activity
│   │   │   ├── Cases.jsx     # Case repository (Search, Filter, Delete)
│   │   │   ├── CaseDetail.jsx# Case dossier & document attachments
│   │   │   ├── NewCase.jsx   # Register new case
│   │   │   ├── Documents.jsx # Master evidence depository
│   │   │   ├── DocumentUpload.jsx # File upload with auto-SHA256
│   │   │   ├── DocumentDetail.jsx # Inspect evidence & hash
│   │   │   ├── IntegrityVerify.jsx# Tamper detection suite
│   │   │   └── AuditLogs.jsx # Blockchain ledger & chain verification
│   │   ├── services/         # Pure JS API service layer
│   │   │   ├── api.js        # Authenticated fetch wrapper
│   │   │   ├── authService.js
│   │   │   ├── caseService.js
│   │   │   ├── documentService.js
│   │   │   └── auditService.js
│   │   ├── App.jsx           # Clean route declarations
│   │   ├── main.jsx          # React DOM root
│   │   └── index.css         # Tailwind directives
│   ├── index.html
│   ├── vite.config.js        # Vite config with backend proxy
│   └── package.json
│
├── package.json              # Top-level scripts (npm run dev)
├── start-all.mjs             # Cross-platform concurrent runner
└── README.md
```

---

## ⚡ How to Run the Application

### 1. Start Both Backend & Frontend Concurrently (Recommended)
From the `securedocs-app` folder:
```bash
npm run dev
```
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **API Health Check**: http://localhost:5001/api/health

### 2. Or Start Separately:
**Start Backend:**
```bash
cd backend
npm run dev
```

**Start Frontend:**
```bash
cd frontend
npm run dev
```

### 3. Re-seed Database with Demo Data (Optional):
```bash
npm run seed
```

---

## 👥 Demo Credentials for Jury Evaluation

Use these 1-click buttons on the Login page (`/login`):

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Officer** | `raj.patel@securedocs.gov` | `password123` | Investigation, Case creation, Document upload |
| **Admin** | `admin@securedocs.gov` | `password123` | Full access, user management, audit review |
| **Legal Reviewer** | `mehta@securedocs.gov` | `password123` | Legal verification, case review |
| **Auditor** | `auditor@securedocs.gov` | `password123` | Cryptographic ledger inspection & chain verification |

---

## 🎯 Step-by-Step Jury Demonstration Script

1. **Authentication & Roles**:
   - Go to `http://localhost:3000/login`.
   - Click "Officer Patel" for instant login.
   - Show the personalized officer dashboard and role badge.

2. **Cases CRUD Operations**:
   - Navigate to **Cases Repository** (`/cases`). Show live search and filtering.
   - Click **Register New Case** (`/cases/new`). Fill in a title and submit.
   - Observe automatic navigation to the newly created case dossier with attached documents.
   - Update the case status from "Active" to "Under Review".

3. **Document Upload & Cryptographic Hashing**:
   - Click **Upload Evidence** (`/upload`) or attach directly within a case.
   - Select any document/PDF. Note how the client instantly computes the SHA-256 hash using the Web Crypto API.
   - Submit the upload. The backend verifies the file, computes the server-side SHA-256 hash, stores metadata in MongoDB, and records a tamper-evident audit event.

4. **Integrity & Tamper Detection**:
   - Navigate to **Integrity Suite** (`/integrity`).
   - Test preset: Click "FIR_1024_Certified.pdf" -> Result: **GENUINE & UNTAMPERED**.
   - Test preset: Click "Tampered_Forgery_Simulated.pdf" -> Result: **TAMPERED OR UNREGISTERED**.

5. **Cryptographic Audit Chain Verification**:
   - Navigate to **Cryptographic Audit** (`/audit`).
   - Show the chronological event trail where each event's `eventHash` is chained to the `previousHash`.
   - Click **Verify Cryptographic Chain**.
   - The backend recalculates the mathematical link across all blocks in MongoDB and returns:
     `BLOCKCHAIN CHAIN INTEGRITY: 100% VERIFIED`.
