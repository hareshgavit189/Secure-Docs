# 🔐 SecureDocs — Cryptographic Evidence & Case Management System

> **A secure full-stack platform for managing legal, investigative, and evidentiary documents with cryptographic integrity verification, role-based access control, and tamper-evident audit logging.**

SecureDocs is a full-stack case and document management system designed for environments where **document authenticity, controlled access, traceability, and evidence integrity** are critical.

The system combines a modern React interface with a Node.js/Express REST API and MongoDB persistence. Uploaded documents can be verified using **SHA-256 cryptographic hashing**, while system activities are recorded through a **hash-linked audit chain** to provide tamper-evident event tracking.

---

## 📑 Table of Contents

* [Project Overview](#-project-overview)
* [Problem Statement](#-problem-statement)
* [Objectives](#-objectives)
* [Architecture Overview](#-architecture-overview)
* [System Workflow](#-system-workflow)
* [Tech Stack](#-tech-stack)
* [Project Structure](#-project-structure)
* [Core Modules](#-core-modules)
* [Authentication & Role-Based Access](#-authentication--role-based-access)
* [Case Management](#-case-management)
* [Document Management](#-document-management)
* [SHA-256 Integrity Verification](#-sha-256-integrity-verification)
* [Cryptographic Audit Chain](#-cryptographic-audit-chain)
* [Dashboard & Search](#-dashboard--search)
* [API Architecture](#-api-architecture)
* [Prerequisites](#-prerequisites)
* [Environment Configuration](#-environment-configuration)
* [Installation](#-installation)
* [Quick Start](#-quick-start)
* [Database Seeding](#-database-seeding)
* [Demo Accounts](#-demo-accounts)
* [Application Demonstration](#-application-demonstration)
* [Docker Support](#-docker-support)
* [Security Features](#-security-features)
* [Key Features](#-key-features)
* [Technical Concepts](#-technical-concepts)
* [Learning Outcomes](#-learning-outcomes)
* [Practical Checklist](#-practical-checklist)
* [Future Enhancements](#-future-enhancements)
* [Project Status](#-project-status)
* [Author](#-author)

---

## 📌 Project Overview

SecureDocs provides a centralized platform for managing **cases, evidentiary documents, users, and audit events**.

The application is designed around four major requirements:

1. **Secure authentication**
2. **Controlled case and document management**
3. **Cryptographic document integrity**
4. **Tamper-evident activity tracking**

The repository implements these requirements through a React frontend, Node.js/Express backend, MongoDB/Mongoose data layer, JWT authentication, role-based authorization, SHA-256 hashing, and cryptographic audit chaining.

---

## 🎯 Problem Statement

Legal and investigative organizations may handle sensitive materials such as:

* FIR documents
* Investigation reports
* Evidence files
* Forensic reports
* Case documents
* Legal records
* Review documents
* Audit records

Traditional file-management approaches can make it difficult to determine:

* Who accessed a document
* Whether a document was modified
* Which case a document belongs to
* Whether a downloaded file is authentic
* What actions were performed on a case
* Whether an audit history has been altered

SecureDocs addresses these requirements by combining **case management, document storage, access control, cryptographic hashing, and audit-chain verification** into one application.

---

## 🎯 Objectives

The primary objectives of SecureDocs are:

* Build a centralized case-management platform.
* Provide authenticated access to sensitive information.
* Implement role-based authorization.
* Manage case records using REST APIs.
* Upload and manage evidentiary documents.
* Generate SHA-256 hashes for uploaded files.
* Detect document modification or mismatch.
* Maintain a tamper-evident audit history.
* Provide search and filtering for cases and documents.
* Provide a dashboard for important case statistics.
* Demonstrate cryptographic integrity concepts in a practical application.

---

# 🏗️ Architecture Overview

SecureDocs follows a layered full-stack architecture.

```text
                    ┌─────────────────────────┐
                    │       User / Officer     │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │     React Frontend      │
                    │  Vite + Tailwind CSS    │
                    └────────────┬────────────┘
                                 │
                          REST API / JWT
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   Node.js + Express     │
                    │       REST API          │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
       Authentication       Case Service      Document Service
              │                  │                  │
              └──────────────────┼──────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │ MongoDB + Mongoose      │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┴──────────────────┐
              ▼                                     ▼
      Document Hashing                      Audit Hash Chain
        SHA-256                                SHA-256
```

The repository separates frontend components, React pages, API services, backend routes, middleware, database models, and cryptographic audit logic.

---

# 🔄 System Workflow

```text
User Login
    │
    ▼
JWT Authentication
    │
    ▼
Role Authorization
    │
    ▼
Dashboard
    │
    ├──────────────► Case Management
    │                    │
    │                    ▼
    │               Create / Update Case
    │                    │
    │                    ▼
    │               Attach Documents
    │
    └──────────────► Document Management
                         │
                         ▼
                   Upload Evidence
                         │
                         ▼
                    SHA-256 Hash
                         │
                         ▼
                  Store Metadata
                         │
                         ▼
                   Audit Event
                         │
                         ▼
                Hash-Linked Chain
                         │
                         ▼
                 Integrity Verification
```

---

# 🛠️ Tech Stack

| Layer                | Technology     | Purpose                             |
| -------------------- | -------------- | ----------------------------------- |
| Frontend             | React.js       | User interface                      |
| Frontend Build Tool  | Vite           | Development and production build    |
| Styling              | Tailwind CSS   | Responsive UI styling               |
| Icons                | Lucide Icons   | Interface icons                     |
| Routing              | Wouter         | Client-side routing                 |
| Backend              | Node.js        | Server-side runtime                 |
| API                  | Express.js     | REST API                            |
| Database             | MongoDB        | Data persistence                    |
| ODM                  | Mongoose       | MongoDB data modeling               |
| Authentication       | JWT            | Session/token authentication        |
| Password Security    | Bcrypt         | Password hashing                    |
| Cryptography         | SHA-256        | Document integrity                  |
| Browser Cryptography | Web Crypto API | Client-side hashing                 |
| File Upload          | Multer         | Evidence/document uploads           |
| Containerization     | Docker Compose | Application environment             |
| Language             | JavaScript     | Frontend and backend implementation |

The repository specifically uses JavaScript/JSX rather than TypeScript and contains separate frontend and backend applications.

---

# 📁 Project Structure

The current repository contains the following major structure:

```text
Secure-Docs/
│
├── api/
│
├── backend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── db.js
│   │   │   └── audit.js
│   │   │
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   │
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Case.js
│   │   │   ├── Document.js
│   │   │   └── AuditLog.js
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── cases.js
│   │   │   ├── documents.js
│   │   │   ├── audit.js
│   │   │   └── dashboard.js
│   │   │
│   │   ├── seed.js
│   │   └── server.js
│   │
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   └── Modal.jsx
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Cases.jsx
│   │   │   ├── CaseDetail.jsx
│   │   │   ├── NewCase.jsx
│   │   │   ├── Documents.jsx
│   │   │   ├── DocumentUpload.jsx
│   │   │   ├── DocumentDetail.jsx
│   │   │   ├── IntegrityVerify.jsx
│   │   │   └── AuditLogs.jsx
│   │   │
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── caseService.js
│   │   │   ├── documentService.js
│   │   │   └── auditService.js
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── docker-compose.yml
├── package.json
├── start-all.mjs
├── vercel.json
├── .gitignore
└── README.md
```

---

# 🧩 Core Modules

## 1. Authentication Module

Responsible for:

* User login
* User registration
* JWT authentication
* Session state
* Role-based authorization
* Protected routes

Frontend authentication state is managed through `AuthContext.jsx`, while backend authorization is handled through authentication middleware.

---

## 2. Case Management Module

The case module provides:

* Case creation
* Case listing
* Case search
* Case filtering
* Case details
* Case status management
* Case deletion
* Document attachment

The backend exposes case REST operations while the frontend provides dedicated case-management pages.

---

## 3. Document Management Module

The document module acts as the evidence repository.

Main operations include:

* Upload evidence
* Store document metadata
* Calculate document hash
* Download documents
* View document details
* Verify document integrity
* Associate documents with cases

The backend uses Multer for upload processing and provides document-related REST endpoints.

---

# 🔐 Authentication & Role-Based Access

SecureDocs implements role-based access control using JWT authentication.

The project defines four primary roles:

| Role               | Main Responsibility                                    |
| ------------------ | ------------------------------------------------------ |
| **Admin**          | Full system access, user management and audit review   |
| **Officer**        | Investigation, case creation and document upload       |
| **Legal Reviewer** | Legal verification and case review                     |
| **Auditor**        | Cryptographic ledger inspection and chain verification |

JWT validation and role authorization are implemented through backend authentication middleware.

### Authentication Flow

```text
Login Form
    │
    ▼
Credentials
    │
    ▼
Backend Authentication
    │
    ▼
JWT Token
    │
    ▼
Frontend Session
    │
    ▼
Protected API Requests
    │
    ▼
Role Authorization
```

---

# 📂 Case Management

Cases act as the primary organizational unit for investigative information.

A case can contain:

* Case information
* Case status
* Associated documents
* Evidence metadata
* Audit activity

### Case Workflow

```text
Create Case
     │
     ▼
Case Repository
     │
     ├── Search
     ├── Filter
     ├── Update
     └── Delete
     │
     ▼
Case Dossier
     │
     ▼
Attach Evidence
```

---

# 📄 Document Management

Documents are treated as evidentiary records.

When a document is uploaded:

```text
Select File
    │
    ▼
Client-Side SHA-256
    │
    ▼
Upload to Backend
    │
    ▼
Server-Side SHA-256
    │
    ▼
Store Document Metadata
    │
    ▼
Create Audit Event
```

The application performs SHA-256 processing on both the client and server sides as part of its integrity workflow.

---

# 🔏 SHA-256 Integrity Verification

SHA-256 is used to generate a fixed-length cryptographic digest from a document.

Conceptually:

```text
Document
   │
   ▼
SHA-256 Algorithm
   │
   ▼
Hash Value
```

For example:

```text
Original Document
       │
       ▼
SHA-256
       │
       ▼
Stored Hash
```

When the document needs to be verified:

```text
Current Document
       │
       ▼
Calculate SHA-256
       │
       ▼
Compare With Registered Hash
       │
       ├── Match ───────► GENUINE / UNALTERED
       │
       └── Mismatch ────► TAMPERED / UNREGISTERED
```

This allows the system to detect whether the contents represented by the current file differ from the previously registered cryptographic fingerprint.

---

# ⛓️ Cryptographic Audit Chain

One of the core security concepts in SecureDocs is the hash-linked audit trail.

Each audit event contains an `eventHash` that is connected to the `previousHash`.

Conceptually:

```text
Block 1
┌─────────────────────┐
│ Event Data          │
│ previousHash: ...   │
│ eventHash: HASH-A   │
└──────────┬──────────┘
           │
           ▼
Block 2
┌─────────────────────┐
│ Event Data          │
│ previousHash: HASH-A│
│ eventHash: HASH-B   │
└──────────┬──────────┘
           │
           ▼
Block 3
┌─────────────────────┐
│ Event Data          │
│ previousHash: HASH-B│
│ eventHash: HASH-C   │
└─────────────────────┘
```

If an earlier event is changed, the cryptographic relationship between the blocks can no longer be reproduced correctly.

The backend contains dedicated audit logic and an `AuditLog` model for maintaining this tamper-evident event history.

---

# 🔎 Dashboard & Search

The dashboard provides an operational overview of the system.

The application includes:

* KPI statistics
* Recent activity
* Case information
* Search
* Filtering
* User status information
* Audit activity

The backend includes a dedicated dashboard route for KPI aggregation, while the frontend provides the dashboard interface.

---

# 🌐 API Architecture

The backend is organized around REST endpoints.

### Authentication

```text
/auth
```

Responsible for:

* Login
* Registration
* Profile information
* Authentication-related operations

### Cases

```text
/cases
```

Responsible for:

* Create
* Read
* Update
* Delete
* Search/filter operations

### Documents

```text
/documents
```

Responsible for:

* Upload
* Download
* Metadata
* Hashing
* Verification

### Audit

```text
/audit
```

Responsible for:

* Audit event retrieval
* Audit-chain verification

### Dashboard

```text
/dashboard
```

Responsible for:

* KPI aggregation
* Dashboard statistics

The repository organizes these operations into separate Express route modules.

---

# 📋 Prerequisites

Before running SecureDocs locally, install:

* **Node.js**
* **npm**
* **MongoDB** or a configured MongoDB connection
* **Git**
* **Docker** *(optional)*

Recommended environment:

```text
Node.js
npm
MongoDB
Git
```

---

# ⚙️ Environment Configuration

The backend requires environment configuration for values such as:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
```

> **Important:** Never commit production secrets, database passwords, private keys, or real credentials to GitHub.

For a local development environment, create the required `.env` file inside the backend configuration location used by the application.

---

# 📥 Installation

Clone the repository:

```bash
git clone https://github.com/hareshgavit189/Secure-Docs.git
```

Move into the project directory:

```bash
cd Secure-Docs
```

Install the root dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

Return to the root:

```bash
cd ..
```

---

# ⚡ Quick Start

SecureDocs provides a top-level development runner for starting the application components together.

Run:

```bash
npm run dev
```

The repository currently documents:

```text
Frontend:
http://localhost:3000

Backend:
http://localhost:5001

API Health Check:
http://localhost:5001/api/health
```

---

## ▶️ Start Backend Separately

```bash
cd backend
npm run dev
```

---

## ▶️ Start Frontend Separately

Open another terminal:

```bash
cd frontend
npm run dev
```

---

# 🌱 Database Seeding

SecureDocs includes an automated database seeder for preparing demonstration data.

From the project root:

```bash
npm run seed
```

The project documentation indicates that the seed data includes representative case files, FIRs, and forensic-report-style records for demonstration purposes.

---

# 👥 Demo Accounts

For demonstration/jury evaluation, the repository provides preconfigured test accounts:

| Role           | Email                      | Password      |
| -------------- | -------------------------- | ------------- |
| Officer        | `raj.patel@securedocs.gov` | `password123` |
| Admin          | `admin@securedocs.gov`     | `password123` |
| Legal Reviewer | `mehta@securedocs.gov`     | `password123` |
| Auditor        | `auditor@securedocs.gov`   | `password123` |

These credentials are documented by the repository as demo credentials and are intended for application demonstration.

> **Security Note:** These credentials should **not** be used in a production deployment.

---

# 🎬 Application Demonstration

A recommended demonstration flow is:

## Step 1 — Login

Open:

```text
/login
```

Select an appropriate demonstration role.

---

## Step 2 — Dashboard

Review:

* KPI statistics
* Recent activity
* User information
* Case overview

---

## Step 3 — Create a Case

Navigate to:

```text
/cases/new
```

Enter case information and create the case.

The system can then navigate to the corresponding case dossier.

---

## Step 4 — Manage Cases

Open:

```text
/cases
```

Demonstrate:

* Search
* Filtering
* Case details
* Status changes
* Case management

---

## Step 5 — Upload Evidence

Navigate to the document upload functionality.

Select an evidence document.

The application calculates a SHA-256 hash and processes the document through the backend verification workflow.

---

## Step 6 — Verify Integrity

Open:

```text
/integrity
```

Use the integrity-verification interface to compare document integrity against the registered cryptographic information.

The repository includes demonstration scenarios for both an authentic document and a simulated tampered/unregistered document.

---

## Step 7 — Verify Audit Chain

Open:

```text
/audit
```

Review the chronological audit events.

Then execute the cryptographic-chain verification process.

The application checks the relationship between `eventHash` and `previousHash` across the audit sequence.

---

# 🐳 Docker Support

The repository includes:

```text
docker-compose.yml
```

This provides a foundation for running the application's services through Docker Compose.

Typical workflow:

```bash
docker compose up --build
```

To stop the services:

```bash
docker compose down
```

> Verify the current Docker environment variables and service configuration before using this workflow in a production environment.

---

# 🛡️ Security Features

SecureDocs incorporates several security mechanisms:

### 🔑 JWT Authentication

Used to authenticate users and protect API operations.

### 👤 Role-Based Access Control

Different roles receive different application capabilities.

### 🔐 Bcrypt Password Hashing

Passwords are protected using Bcrypt rather than being stored as plain text.

### #️⃣ SHA-256 Document Hashing

Documents receive cryptographic hashes for integrity verification.

### ⛓️ Hash-Linked Audit Events

Audit events use cryptographic chaining through:

```text
eventHash
previousHash
```

### 🔍 Integrity Verification

The application provides a dedicated interface for detecting document integrity mismatches.

### 🧾 Audit Logging

Security-relevant actions can be represented through an audit trail.

These security mechanisms are part of the implementation documented in the repository.

---

# ✨ Key Features

| Feature                    | Description                                      |
| -------------------------- | ------------------------------------------------ |
| 🔐 Authentication          | JWT-based user authentication                    |
| 👥 RBAC                    | Admin, Officer, Legal Reviewer and Auditor roles |
| 📁 Case Management         | Create and manage investigative cases            |
| 📄 Evidence Management     | Upload and manage documents                      |
| #️⃣ SHA-256                | Cryptographic document fingerprinting            |
| 🛡️ Integrity Verification | Detect document mismatches                       |
| ⛓️ Audit Chain             | Hash-linked audit events                         |
| 🔎 Search                  | Fast case/document search                        |
| 🎛️ Filtering              | Filter case information                          |
| 📊 Dashboard               | KPI and activity overview                        |
| 🌱 Seeder                  | Preloaded demonstration data                     |
| 🐳 Docker                  | Container-based deployment support               |
| 📱 Responsive UI           | Modern responsive interface                      |

---

# 🧠 Technical Concepts

This project demonstrates practical implementation of:

### Frontend Development

* React components
* JSX
* React Context
* Client-side routing
* API service abstraction
* Tailwind CSS
* Responsive UI design

### Backend Development

* Node.js
* Express.js
* REST API
* Middleware
* Authentication
* Authorization
* File uploads
* Service routes

### Database

* MongoDB
* Mongoose
* Data models
* CRUD operations
* Document metadata

### Cybersecurity

* JWT authentication
* Role-based access control
* Password hashing
* SHA-256
* File integrity verification
* Tamper-evident audit logging
* Hash chaining

---

# 🔄 Complete Application Flow

```text
                 ┌───────────────┐
                 │     Login     │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │ JWT + RBAC    │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │   Dashboard   │
                 └───────┬───────┘
                         │
             ┌───────────┴───────────┐
             │                       │
             ▼                       ▼
       ┌───────────┐           ┌────────────┐
       │   Cases   │           │ Documents  │
       └─────┬─────┘           └──────┬─────┘
             │                        │
             │                        ▼
             │                  SHA-256 Hash
             │                        │
             └──────────┬─────────────┘
                        │
                        ▼
                 ┌───────────────┐
                 │  Audit Event  │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │ Hash Chaining  │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │   Integrity    │
                 │   Verification │
                 └───────────────┘
```

---

# 📚 Learning Outcomes

After implementing this project, the developer can understand:

* How to build a full-stack JavaScript application.
* How React communicates with an Express REST API.
* How JWT authentication works.
* How role-based authorization is implemented.
* How MongoDB and Mongoose are used in an application.
* How file uploads are processed.
* How SHA-256 can be used for file integrity verification.
* How hash chaining can create a tamper-evident audit structure.
* How frontend and backend security mechanisms work together.
* How to organize a modular full-stack project.

---

# ✅ Practical Checklist

### Frontend

* [x] React application
* [x] Vite configuration
* [x] Tailwind CSS
* [x] Reusable components
* [x] Authentication context
* [x] Application routing
* [x] Case pages
* [x] Document pages
* [x] Integrity verification page
* [x] Audit page

### Backend

* [x] Node.js
* [x] Express.js
* [x] REST API
* [x] Authentication middleware
* [x] Role authorization
* [x] MongoDB integration
* [x] Mongoose models
* [x] Case CRUD
* [x] Document upload
* [x] Audit routes
* [x] Dashboard API
* [x] Database seeding

### Security

* [x] JWT authentication
* [x] Bcrypt password protection
* [x] SHA-256 hashing
* [x] Client-side hash generation
* [x] Server-side hash generation
* [x] Document integrity verification
* [x] Hash-linked audit events
* [x] Cryptographic chain verification

---

# 🚀 Future Enhancements

Potential future improvements include:

* Advanced document version management
* Digital signatures
* Multi-factor authentication
* Stronger password policies
* Fine-grained permissions
* Document encryption at rest
* Secure cloud object storage
* Advanced audit reporting
* PDF audit reports
* Evidence chain-of-custody reports
* Email notifications
* Advanced case analytics
* Automated security monitoring
* Production-grade logging and monitoring
* Automated backup and disaster recovery

---

# 📊 Project Status

**Current Type:** Full-Stack Product Prototype / Hackathon Project

**Frontend:** React + Vite + Tailwind CSS

**Backend:** Node.js + Express.js

**Database:** MongoDB + Mongoose

**Security:** JWT + RBAC + Bcrypt + SHA-256 + Hash-Linked Audit Logging

**Primary Domain:** Secure document, evidence, and case management

The GitHub repository currently contains the frontend, backend, API-related project structure, Docker Compose configuration, startup script, deployment configuration, and project documentation.

---

# 👨‍💻 Author

**Haresh Gavit**

GitHub: **hareshgavit189**

Project Repository: **Secure-Docs**

---

# 📄 License

If a specific open-source license has not been added to the repository, treat the project as **all rights reserved by default** until a license is explicitly provided.

---

## ⭐ Project Summary

**SecureDocs** demonstrates how a modern full-stack application can combine:

```text
React
   +
Node.js / Express
   +
MongoDB
   +
JWT Authentication
   +
Role-Based Access Control
   +
SHA-256
   +
Cryptographic Audit Chaining
   =
Secure Evidence & Case Management Platform
```

The project goes beyond ordinary CRUD-based document management by adding **cryptographic integrity verification and a hash-linked audit trail**, making security and traceability central parts of the application architecture.
