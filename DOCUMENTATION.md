# Elimisha Watoto Foundation — IT Operations & Service Desk
## Comprehensive System Documentation & Technical Manual

---

### Table of Contents
1. [Executive Summary & Purpose](#1-executive-summary--purpose)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Dual-Portal Ecosystem](#3-dual-portal-ecosystem)
   - [3.1 Employee Support Portal](#31-employee-support-portal)
   - [3.2 IT Operations & Administration Console](#32-it-operations--administration-console)
4. [AI Copilot & Operations Automation (Gemini 3.7 Flash)](#4-ai-copilot--operations-automation-gemini-37-flash)
   - [4.1 Intelligent Ticket Triage](#41-intelligent-ticket-triage)
   - [4.2 Diagnostic Copilot & Remediation Generator](#42-diagnostic-copilot--remediation-generator)
   - [4.3 Thread Summarizer & Handover Engine](#43-thread-summarizer--handover-engine)
   - [4.4 Automated Knowledge Base Article Generator](#44-automated-knowledge-base-article-generator)
5. [Google Workspace & Email Notification System](#5-google-workspace--email-notification-system)
   - [5.1 Submission Alert Flow (IT Admin & Staff)](#51-submission-alert-flow-it-admin--staff)
   - [5.2 Ticket Resolution Email (Reporting Employee)](#52-ticket-resolution-email-reporting-employee)
   - [5.3 Dispatch Logging & Resilience](#53-dispatch-logging--resilience)
6. [IT Electronic Asset Directory](#6-it-electronic-asset-directory)
7. [User Accounts, Roles & Colleague Directory](#7-user-accounts-roles--colleague-directory)
8. [Workplace Portals Launcher](#8-workplace-portals-launcher)
9. [Knowledge Base & Self-Service Deflection](#9-knowledge-base--self-service-deflection)
10. [Database Schema & Data Models](#10-database-schema--data-models)
11. [REST API Specification](#11-rest-api-specification)
12. [Environment Configuration & Deployment](#12-environment-configuration--deployment)
13. [Operational Workflows & User Guides](#13-operational-workflows--user-guides)

---

## 1. Executive Summary & Purpose

The **Elimisha Watoto Foundation IT Operations & Service Desk** is an enterprise-grade IT Service Management (ITSM), incident tracking, asset inventory, and self-help platform. It is engineered specifically for the organizational needs of the **Elimisha Watoto Foundation**, bridging the gap between non-technical staff across disparate departments and dedicated IT technicians.

### Key Objectives:
- **Zero-Friction Incident Reporting**: Enables employees to easily log IT issues with intelligent category assignment, priority guidance, and instant self-service deflection advice.
- **Unified IT Operations**: Equips IT administrators and helpdesk technicians with a real-time command center featuring Kanban boards, diagnostic automation, and live ticket synchronization.
- **Asset Accountability**: Provides a comprehensive electronic device directory that logs laptops, serial numbers, conditions, peripherals, and cellular connections per employee.
- **End-to-End Email Visibility**: Integrates natively with Google Workspace (`it@elimishawatoto.org`) to notify IT teams upon ticket submission and notify employees when their tickets are resolved.
- **Generative AI Diagnostics**: Integrates Google Gemini 3.7 Flash to recommend troubleshooting steps, generate executable PowerShell/Bash scripts, and automatically document incident resolutions into knowledge base articles.

---

## 2. High-Level Architecture

The system is architected as a modern full-stack web application designed for high availability, low latency, and responsive performance across desktop and mobile devices.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPLICATION                            │
│                                                                        │
│   ┌─────────────────────────────┐     ┌────────────────────────────┐   │
│   │    Employee Support Portal  │     │  IT Operations Management  │   │
│   │   (Self-service, directory, │     │ (Kanban, diagnostics, SLA, │   │
│   │    ticket tracking & KB)    │     │  assets, user management)  │   │
│   └──────────────┬──────────────┘     └─────────────┬──────────────┘   │
│                  │                                  │                  │
│                  └────────────────┬─────────────────┘                  │
│                                   │                                    │
│        React 19 + TypeScript + Tailwind CSS + Framer Motion (Motion)   │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │
                   │ Real-time Synced via WebSockets │ REST / HTTPS API
                   ▼                                 ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│       FIREBASE FIRESTORE DB          │  │       NODE / EXPRESS BACKEND  │
│                                      │  │                              │
│ • collections/tickets                │  │ • POST /api/ai/triage        │
│ • collections/assets                 │  │ • POST /api/ai/diagnose      │
│ • collections/users                  │  │ • POST /api/ai/summarize     │
│                                      │  │ • POST /api/ai/generate-kb   │
│ Security: firestore.rules            │  │ • POST /api/notifications/*  │
└──────────────────────────────────────┘  └──────┬───────────────┬───────┘
                                                 │               │
                                                 ▼               ▼
                                       ┌────────────────┐ ┌──────────────┐
                                       │ Gemini 3.7 AI  │ │Google Work-  │
                                       │ Operations     │ │space SMTP    │
                                       │ Copilot Engine │ │(it@elimi...) │
                                       └────────────────┘ └──────────────┘
```

### Technology Stack:
- **Frontend Framework**: React 19, TypeScript, Vite 6
- **Styling & UI**: Tailwind CSS v4, Lucide React icons, Motion (`motion/react`)
- **Visual Analytics**: Recharts
- **Database & Persistence**: Google Cloud Firestore with real-time snapshot listeners (`onSnapshot`)
- **Backend Runtime**: Node.js with Express 4 (bundled with `esbuild` to CommonJS for production)
- **AI Engine**: Google Gen AI SDK (`@google/genai`) powered by `gemini-3.7-flash`
- **Email Delivery**: Nodemailer connecting to Google Workspace SMTP (`smtp.gmail.com:465` SSL / `587` TLS)

---

## 3. Dual-Portal Ecosystem

The application features a role-tailored dual-mode user experience:

### 3.1 Employee Support Portal
Accessed automatically by users with the **Employee** role, or directly via the `/portal` URL parameter (`?portal=employee`).

#### Core Employee Capabilities:
1. **Support Ticket Submission**:
   - Clean, modal-driven submission interface.
   - Real-time pre-flight AI triage advising on category selection, estimated turnaround time, and self-service tips before submission.
   - Attachment and device tag linking.
2. **My Requests Tracking**:
   - Status tracking across `Open`, `In Progress`, `Waiting on User`, `Escalated`, and `Resolved`.
   - Thread view for conversing directly with assigned IT technicians.
   - Ability to confirm resolution and reopen tickets if issues reoccur.
3. **Colleague & Staff Directory**:
   - Fast lookup for staff members across all foundation departments: *Secondary, Tertiary, Front Office, Finance, Human Resource, Communications & Media, IT, Administration, Care & Share, Property*.
   - Instant email copying and phone number access.
4. **Workplace Portals Hub**:
   - Direct single-click launchers to core foundation platforms (SharePoint, Secondary Student Portal, Tertiary Portal, etc.).
5. **Interactive Knowledge Base**:
   - Searchable library of troubleshooting walkthroughs and step-by-step guides for common issues (printer toner, email passwords, Wi-Fi, Office 365).
6. **In-App Notification Center**:
   - Real-time notification feed alerting employees when tickets are acknowledged, assigned, commented on, or resolved.

---

### 3.2 IT Operations & Administration Console
Accessed by **IT Staff** and **Admin** users to supervise and resolve all foundation technical operations.

#### Core IT Staff & Admin Capabilities:
1. **Unified Dashboard**:
   - Executive operational metrics: Total Open Incidents, Critical/High SLA Alerts, Mean Time to Resolution (MTTR), Hardware vs Software distribution.
   - Active ticket queues and recent activity feeds.
2. **Interactive Ticket Management (Table & Kanban Views)**:
   - **Table View**: Multi-column filtering by status, priority, category, tier (`Tier 1 Helpdesk`, `Tier 2 SysAdmin`, `Tier 3 DevOps/SecOps`, `Field Support`), and assigned agent.
   - **Kanban Board**: Drag-and-drop or status-click workflows transitioning tickets from `Open` ➔ `In Progress` ➔ `Waiting on User` ➔ `Escalated` ➔ `Resolved`.
3. **Ticket Detail & Diagnostics Drawer**:
   - Complete incident audit history and SLA timers.
   - Bidirectional messaging: Public replies to the employee vs. internal private notes for IT staff.
   - Integrated AI Diagnostic Copilot with executable scripts and resolution recommendations.
4. **Electronic Asset Directory**:
   - Complete inventory registry of foundation-issued laptops, condition reports, accessories (mouse, tripod, mic), and foundation phones.
5. **User Accounts Management** (Admin Only):
   - User account provisioning, role adjustments (`Employee`, `IT Staff`, `Admin`), active/inactive status toggling.
6. **Reports & Analytics**:
   - Categorical incident trends, resolution rates, department failure hotspots, and technician workload balancing.

---

## 4. AI Copilot & Operations Automation (Gemini 3.7 Flash)

The system embeds Google's **Gemini 3.7 Flash** model server-side to automate complex IT support workflows while maintaining high throughput.

### 4.1 Intelligent Ticket Triage (`POST /api/ai/triage`)
When an employee enters an incident title and description, the AI engine performs instant pre-classification:
- **Detected Category**: Matches to 1 of 8 primary operational categories (e.g., *Laptop not charging or turning on*, *Email Password*, *Microsoft Office*, *Network Connectivity*, etc.).
- **Priority Recommendation**: Computes severity (`Low`, `Medium`, `High`, `Critical`) according to organizational disruption risk.
- **Estimated Turnaround**: Predicts expected resolution duration in minutes.
- **Self-Service Deflection Hint**: Generates polite, actionable immediate steps for the user (e.g., hard reset steps for charging problems, MFA portal links for password resets) to deflect unnecessary ticket overhead.
- **Root-Cause Hypothesis**: Provides an initial hypothesis for the reviewing technician.

### 4.2 Diagnostic Copilot & Remediation Generator (`POST /api/ai/diagnose`)
Inside the technician's ticket inspection modal:
- **Diagnostic Steps**: Step-by-step diagnostic verification plan customized to the specific operating system and hardware profile.
- **Executable CLI Script**: PowerShell or Bash commands tailored to test network connectivity, restart corresponding services, or inspect event logs.
- **Suggested Customer Reply**: Professionally phrased, empathetic response ready to be dispatched to the reporting employee.
- **Internal Technician Notes**: Technical summary with recommended escalation path.

### 4.3 Thread Summarizer & Handover Engine (`POST /api/ai/summarize`)
For lengthy support incidents with multiple replies and system notes:
- Generates a 2-3 sentence executive synopsis.
- Lists key technical takeaways.
- Identifies the single immediate next action required to unblock the ticket.

### 4.4 Automated Knowledge Base Generator (`POST /api/ai/generate-kb`)
Upon resolving a unique ticket:
- Automatically synthesizes the incident's symptoms, root cause, and technician resolution notes into a standardized, reusable Knowledge Base article complete with keywords and prevention tips.

---

## 5. Google Workspace & Email Notification System

The application features full bidirectional email integration connecting to **Elimisha Watoto Foundation's Google Workspace** domain (`it@elimishawatoto.org`).

```
[Employee Submits Ticket]
        │
        ▼
POST /api/notifications/ticket-created
        │
        ├───────────────────────────────────────────────┐
        ▼                                               ▼
[Google Workspace SMTP (SSL:465)]          [In-Memory Audit Dispatch Log]
        │                                               │
        ├─────────────────────────────┐                 ▼
        ▼                             ▼          GET /api/notifications/recent
it@elimishawatoto.org       All Assigned IT Staff
(Primary IT Admin)               (Technicians)
```

### 5.1 Submission Alert Flow (`/api/notifications/ticket-created`)
- **Trigger**: Fired whenever any ticket is created via the Employee Portal or Admin console.
- **Recipients**: Primary IT Administration address (`it@elimishawatoto.org`) plus all active `IT Staff` member emails.
- **Format**: Responsive, branded HTML email containing:
  - Ticket reference ID (e.g., `INC-8042`)
  - Priority badge (`Critical`, `High`, `Medium`, `Low`)
  - Reporting employee name and foundation department
  - Incident title and formatted issue description
  - Direct "Open IT Support Workspace" button linking back into the application.

### 5.2 Ticket Resolution Alert (`/api/notifications/ticket-resolved`)
- **Trigger**: Fired when a technician marks an incident as **Resolved**.
- **Recipient**: The reporting employee's email address.
- **Format**: Branded green resolution receipt highlighting:
  - Resolution confirmation banner
  - Name of the resolving IT technician
  - Comprehensive resolution summary and actions taken
  - Instructions on reopening or requesting follow-up support if the issue reoccurs.

### 5.3 Dispatch Logging & Resilience
- **Fault-Tolerant Delivery**: If SMTP credentials are non-functional or unset, the system logs the full transaction to internal server logs and maintains an in-memory dispatch history accessible via `GET /api/notifications/recent` without crashing the application.
- **Credential Sanitation**: Automatically removes extraneous spaces often created when copying Google Workspace App Passwords.

---

## 6. IT Electronic Asset Directory

The asset management subsystem maintains inventory control over foundation-issued hardware, tracking 13 attributes per entry:

| Field Name | Description / Values |
|---|---|
| `employeeName` | Name of the staff member assigned the equipment |
| `department` | Staff department (e.g., Secondary, Tertiary, Finance, HR) |
| `laptopModel` | Model specification (e.g., HP ProBook 450 G8, Dell Latitude 5420) |
| `laptopPrice` | Purchase or valuation figure (KES / USD) |
| `laptopSerialNumber` | Unique manufacturer hardware serial number |
| `laptopConditionComments`| Operational status, casing defects, battery health notes |
| `issuedWithMouse` | `Yes` / `No` |
| `issuedWithTripod` | `Yes` / `No` |
| `issuedWithMic` | `Yes` / `No` |
| `phoneModel` | Assigned cellular handset (e.g., Samsung Galaxy A14) |
| `phonePrice` | Phone valuation figure |
| `safaricomPhoneNumber` | Corporate Safaricom SIM line |
| `airtelPhoneNumber` | Corporate Airtel SIM line |
| `phoneConditionComments`| Screen condition, battery notes, SIM slot integrity |

---

## 7. User Accounts, Roles & Colleague Directory

The system implements Role-Based Access Control (RBAC) across three distinct tiers:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    EMPLOYEE     │       │    IT STAFF     │       │      ADMIN      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ • Submit tickets│       │ • Triage tickets│       │ • Full tickets  │
│ • View own queue│       │ • Resolve issues│       │ • Manage assets │
│ • Access KB     │       │ • Use AI Copilot│       │ • User accounts │
│ • Directory &   │       │ • View assets   │       │ • System stats  │
│   Portals       │       │ • Dispatch email│       │ • Audit logs    │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

### Standard Organizational Departments:
1. Secondary
2. Tertiary
3. Front Office
4. Finance
5. Human Resource
6. Communications & Media
7. IT
8. Administration
9. Care & Share
10. Property

---

## 8. Workplace Portals Launcher

Integrated inside both the Employee and IT consoles, this launcher provides quick access to external enterprise platforms used across the foundation:
- **Elimisha SharePoint**: Central document repository, shared drives, and organizational policies.
- **Secondary School Portal**: Academic student tracking and sponsorship management.
- **Tertiary Portal**: Higher education, college sponsorships, and vocational programs.
- **Enterprise Webmail**: Direct link to webmail inbox.

---

## 9. Knowledge Base & Self-Service Deflection

The Knowledge Base repository accelerates first-contact resolution and empowers staff self-reliance:
- **Searchable Index**: Real-time filtering across article titles, categories, root causes, and keywords.
- **Structured Guides**: Every article contains:
  - Diagnostic symptoms
  - Technical root cause explanation
  - Step-by-step numbered resolution procedure
  - Preventative recommendations
- **Audience Metrics**: Tracks helpfulness votes and view counters.

---

## 10. Database Schema & Data Models

### Firestore Collections:

#### 1. `tickets`
```typescript
interface Ticket {
  id: string;                       // Unique document ID
  ticketNumber: string;             // Human-readable code e.g. "INC-8042"
  title: string;                    // Short issue summary
  description: string;              // Detailed symptom description
  category: TicketCategory;         // Standardized issue category
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Waiting on User' | 'Escalated' | 'Resolved' | 'Closed';
  tier: 'Tier 1 (Helpdesk)' | 'Tier 2 (SysAdmin)' | 'Tier 3 (DevOps / SecOps)' | 'Field Support';
  assignedAgent: string;            // Name of assigned technician or "Unassigned"
  assignedTeam: string;             // e.g. "Workplace Tech", "SecOps"
  reporterName: string;             // Submitting employee's name
  reporterEmail: string;            // Submitting employee's email
  reporterDepartment: string;       // Submitting employee's department
  assetId?: string;                 // Device serial or tag
  operatingSystem?: string;         // Windows 11, macOS, Linux, etc.
  tags: string[];                   // Tagging array
  createdAt: string;                // ISO 8601 string
  updatedAt: string;                // ISO 8601 string
  comments: TicketComment[];        // Array of conversation objects
  aiTriage?: AITriageData;          // Server-generated AI evaluation
  resolutionNotes?: string;         // Technician closing comments
  satisfactionRating?: number;      // 1-5 feedback rating
}
```

#### 2. `assets`
```typescript
interface ITAsset {
  id: string;                       // Document ID
  employeeName: string;             // Staff custodian
  department?: string;              // Organizational unit
  laptopModel: string;              // Brand & model
  laptopPrice: string;              // Value
  laptopSerialNumber: string;       // Unique Serial
  laptopConditionComments: string;  // State / repairs
  issuedWithMouse: 'Yes' | 'No';
  issuedWithTripod: 'Yes' | 'No';
  issuedWithMic: 'Yes' | 'No';
  phoneModel: string;
  phonePrice: string;
  safaricomPhoneNumber: string;
  airtelPhoneNumber: string;
  phoneConditionComments: string;
  dateAdded?: string;
}
```

#### 3. `users`
```typescript
interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'Employee' | 'IT Staff' | 'Admin';
  department: string;
  status: 'Active' | 'Inactive';
  dateAdded: string;
}
```

---

## 11. REST API Specification

### Health Check
- **Endpoint**: `GET /api/health`
- **Response**: `{ "status": "ok", "aiConfigured": true }`

### AI Triage
- **Endpoint**: `POST /api/ai/triage`
- **Request Body**:
  ```json
  {
    "title": "My laptop won't turn on or charge",
    "description": "Plugged into the wall charger for 2 hours, no light.",
    "department": "Finance"
  }
  ```
- **Response**:
  ```json
  {
    "detectedCategory": "Laptop not charging or turning on",
    "recommendedPriority": "High",
    "urgencyReasoning": "Finance department member completely blocked from computer operations.",
    "estimatedMinutes": 45,
    "suggestedTags": ["laptop-power", "battery", "hardware"],
    "autoDeflectionHint": "Try holding the power button for 20 seconds while plugged into a wall outlet to perform a hard reset.",
    "rootCauseHypothesis": "Power delivery handshake failure or deep battery discharge.",
    "isAiGenerated": true
  }
  ```

### AI Diagnosis & Remediation Copilot
- **Endpoint**: `POST /api/ai/diagnose`
- **Request Body**: `{ "ticket": { ... }, "comments": [ ... ], "agentPrompt": "Provide diagnosis" }`
- **Response**:
  ```json
  {
    "diagnosticSteps": ["Step 1...", "Step 2..."],
    "cliScript": "Test-NetConnection -ComputerName internal.corp.net -Port 443",
    "suggestedReply": "Dear Colleague...",
    "internalNotes": "Technical summary for technician...",
    "recommendedAction": "Execute PowerShell script and test adapter"
  }
  ```

### AI Ticket Summarizer
- **Endpoint**: `POST /api/ai/summarize`
- **Request Body**: `{ "ticket": { ... }, "comments": [ ... ] }`
- **Response**:
  ```json
  {
    "summary": "Ticket INC-8042 opened for charging issues. Technician performed hard reset...",
    "keyTakeaways": ["Issue verified", "Adapter tested", "Resolved"],
    "nextBestAction": "Close ticket"
  }
  ```

### AI KB Article Generator
- **Endpoint**: `POST /api/ai/generate-kb`
- **Request Body**: `{ "ticket": { ... }, "resolutionNotes": "..." }`
- **Response**:
  ```json
  {
    "title": "Troubleshooting HP Laptop Power Delivery",
    "category": "Laptop not charging or turning on",
    "summary": "Standard procedure for restoring unresponsive laptops.",
    "symptoms": ["No power LED", "Unresponsive display"],
    "rootCause": "Static charge accumulation in embedded controller.",
    "resolutionSteps": ["Disconnect AC", "Hold power button for 20 seconds", "Reconnect AC"],
    "prevention": "Ensure power strips are properly grounded.",
    "keywords": ["laptop", "charging", "battery"]
  }
  ```

### Notification: Ticket Created
- **Endpoint**: `POST /api/notifications/ticket-created`
- **Request Body**: `{ "ticket": { ... }, "staffEmails": ["tech1@elimishawatoto.org"] }`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Email notification sent to IT admin (it@elimishawatoto.org) and IT staff members.",
    "recipients": ["it@elimishawatoto.org", "tech1@elimishawatoto.org"],
    "ticketNumber": "INC-8042",
    "status": "sent"
  }
  ```

### Notification: Ticket Resolved
- **Endpoint**: `POST /api/notifications/ticket-resolved`
- **Request Body**: `{ "ticket": { ... }, "resolutionNotes": "...", "resolvedBy": "Alex Mercer" }`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Resolution email successfully sent to employee@elimishawatoto.org.",
    "recipients": ["employee@elimishawatoto.org"],
    "ticketNumber": "INC-8042",
    "status": "sent"
  }
  ```

### Notification Dispatch Audit Logs
- **Endpoint**: `GET /api/notifications/recent`
- **Response**: `{ "primaryAdminEmail": "...", "smtpConfigured": true, "logs": [ ... ] }`

---

## 12. Environment Configuration & Deployment

### Required Environment Variables (`.env` / AI Studio Secrets):

```bash
# Gemini Generative AI Key (Required for AI Triage & Copilot features)
GEMINI_API_KEY="AIzaSy..."

# Public Application URL (Used in notification emails to direct users back into app)
APP_URL="https://your-domain.run.app"

# Primary IT Department Notification Recipient
IT_SUPPORT_EMAIL="it@elimishawatoto.org"

# Google Workspace / SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER="it@elimishawatoto.org"
SMTP_PASS="your-16-char-app-password"
SMTP_FROM="Elimisha Watoto IT Helpdesk <it@elimishawatoto.org>"
```

### Local Development Commands:
```bash
# Install dependencies
npm install

# Start full-stack development server on port 3000
npm run dev

# Run TypeScript typechecks
npm run lint

# Build production bundle (Vite frontend + esbuild backend)
npm run build

# Start production server
npm start
```

---

## 13. Operational Workflows & User Guides

### Workflow A: Employee Reports an Issue
1. Employee navigates to the **Employee Support Portal**.
2. Clicks **Submit Support Request**.
3. Inputs problem title, selects category, and provides details.
4. Observes the live AI pre-check: if a self-service fix solves the problem, the employee can resolve it immediately without waiting for a technician.
5. Submits the ticket. The ticket appears instantly in the employee's request feed, and automated email alerts are transmitted to `it@elimishawatoto.org`.

### Workflow B: IT Technician Resolves an Incident
1. Technician opens the **IT Operations Console** (`Table` or `Kanban` view).
2. Filters or locates the new ticket.
3. Opens the ticket drawer to inspect logs, device tags, and reporter information.
4. Uses **AI Copilot** to produce diagnostic steps or executable PowerShell scripts.
5. Communicates with the employee via **Public Replies** or records internal technician notes.
6. Changes ticket status to **Resolved**, inputting the resolution summary.
7. System immediately dispatches a branded resolution confirmation email to the employee.

### Workflow C: Managing Electronic Assets
1. Administrator or IT staff selects **Asset Inventory** from the sidebar.
2. Filters by staff member name, department, or device condition.
3. Adds new assets recording all 13 attributes including laptop serials, peripherals, phone models, and Safaricom/Airtel lines.
4. Changes in asset data synchronize in real-time with Firestore across all active administrative sessions.
