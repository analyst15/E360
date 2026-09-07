# Elimisha Watoto Foundation — IT Operations & Service Desk

An enterprise IT Service Management (ITSM), incident tracking, electronic asset inventory, and employee self-service platform designed for the **Elimisha Watoto Foundation**.

---

## 🚀 Key Features

- **Dual-Portal Architecture**:
  - **Employee Support Portal** (`/portal` or `?portal=employee`): Frictionless incident reporting, real-time ticket tracking, colleague directory, knowledge base, and organization application launcher.
  - **IT Operations Management Console**: Interactive table and Kanban boards, SLA tracking, diagnostics drawer, electronic device inventory, user provisioning, and analytics.
- **AI Diagnostics & Automation (Gemini 3.7 Flash)**:
  - Automated ticket category detection, priority recommendation, and self-service deflection hints.
  - Diagnostic copilot with step-by-step troubleshooting procedures, PowerShell/Bash scripts, and customer reply generator.
  - Automated incident summarization and one-click Knowledge Base article generation.
- **Google Workspace & Live Email Notifications**:
  - Automated submission alerts sent to IT Administration (`it@elimishawatoto.org`) and assigned technicians.
  - Branded resolution notices with action summaries sent to employees upon ticket resolution.
  - In-memory dispatch audit logs.
- **Electronic Asset Management**:
  - Full inventory control across 13 required attributes tracking laptops, serial numbers, conditions, peripherals (mouse, tripod, mic), company phones, Safaricom, and Airtel lines.
- **Cloud Database (Firebase Firestore)**:
  - Real-time live synchronization for tickets, inventory items, and user accounts.

---

## 📖 Complete Documentation

For the full architectural breakdown, API specifications, data models, and administrator guides, please consult:

👉 **[DOCUMENTATION.md](./DOCUMENTATION.md)**

---

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Configure your environment variables in `.env` (or via AI Studio Secrets):
```bash
# Gemini AI
GEMINI_API_KEY="your-gemini-api-key"

# Application URL
APP_URL="https://your-domain.run.app"

# IT Admin Notification Email
IT_SUPPORT_EMAIL="it@elimishawatoto.org"

# Google Workspace / SMTP Setup
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_USER="it@elimishawatoto.org"
SMTP_PASS="your-16-char-app-password"
SMTP_FROM="Elimisha Watoto IT Helpdesk <it@elimishawatoto.org>"
```

### 3. Run in Development
```bash
npm run dev
```
The server will start on port `3000`.

### 4. Build for Production
```bash
npm run build
npm start
```
