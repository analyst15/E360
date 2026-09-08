import express from "express";
import fs from "fs";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// Fallback: Read non-placeholder variables from .env.example if not present in process.env
try {
  if (fs.existsSync(".env.example")) {
    const exampleConfig = dotenv.parse(fs.readFileSync(".env.example"));
    for (const k in exampleConfig) {
      if (!process.env[k] && exampleConfig[k] && !exampleConfig[k].startsWith("MY_")) {
        process.env[k] = exampleConfig[k];
      }
    }
  }
} catch (e) {
  console.warn("Could not load fallback .env.example:", e);
}

const HARDCODED_FALLBACK_USER = "it@elimishawatoto.org";
const HARDCODED_FALLBACK_PASS = "krfzkmadvaqzzbdw"; // Elimisha Watoto Foundation Google Workspace App Password
const HARDCODED_FALLBACK_FROM = '"Elimisha Watoto IT Helpdesk" <it@elimishawatoto.org>';

let runtimeSmtpOverrides: {
  user?: string;
  pass?: string;
  from?: string;
  port?: number;
} = {};

export function isValidGoogleAppPassword(candidate?: string): boolean {
  if (!candidate) return false;
  const clean = candidate.replace(/[\s'"]/g, "").trim();
  // Google Workspace App Passwords are strictly 16 alphabetic letters (e.g. 'krfz kmad vaqz zbdw' -> 'krfzkmadvaqzzbdw')
  return /^[a-zA-Z]{16}$/.test(clean);
}

export function parseFromAddress(fromStr?: string, defaultUser = "it@elimishawatoto.org"): { name: string; address: string } {
  const safeDefaultUser = defaultUser && defaultUser.includes("@") ? defaultUser.trim().toLowerCase() : "it@elimishawatoto.org";
  if (!fromStr) {
    return { name: "Elimisha Watoto IT Helpdesk", address: safeDefaultUser };
  }
  const clean = fromStr.trim();
  // Matches 'Elimisha Watoto IT Helpdesk <it@elimishawatoto.org>' or '"Elimisha Watoto IT Helpdesk" <it@elimishawatoto.org>'
  const match = clean.match(/^(?:["']?([^"'<]+)["']?\s*)?<([^>]+)>$/);
  if (match) {
    const name = (match[1] || "").trim() || "Elimisha Watoto IT Helpdesk";
    const address = (match[2] || "").trim().toLowerCase();
    return { name, address: address.includes("@") ? address : safeDefaultUser };
  }
  if (clean.includes("@")) {
    return { name: "Elimisha Watoto IT Helpdesk", address: clean.replace(/['"]/g, "").trim().toLowerCase() };
  }
  return { name: "Elimisha Watoto IT Helpdesk", address: safeDefaultUser };
}

export function getSmtpConfig() {
  let user = "";
  let pass = "";
  let host = "";
  let port = 587; // Port 587 STARTTLS is standard and succeeds in cloud/serverless where 465 hangs
  let secure = false;
  let from = "";

  // 1. Check runtime overrides (configured via admin diagnostics UI)
  if (runtimeSmtpOverrides.user) user = runtimeSmtpOverrides.user;
  if (runtimeSmtpOverrides.pass) pass = runtimeSmtpOverrides.pass;
  if (runtimeSmtpOverrides.from) from = runtimeSmtpOverrides.from;
  if (runtimeSmtpOverrides.port) port = runtimeSmtpOverrides.port;

  // 2. Check process.env (primary source in production: Vercel, Cloud Run, Docker)
  if (!user && process.env.SMTP_USER) user = process.env.SMTP_USER.replace(/['"]/g, "").trim();
  if (!pass && process.env.SMTP_PASS) {
    const envPass = process.env.SMTP_PASS.replace(/['"]/g, "").trim();
    if (envPass !== "ITEWF@2026" && !envPass.startsWith("MY_")) {
      pass = envPass;
    }
  }
  if (!host && process.env.SMTP_HOST) host = process.env.SMTP_HOST.replace(/['"]/g, "").trim();
  if (process.env.SMTP_PORT) {
    const p = Number(process.env.SMTP_PORT);
    if (p) port = p;
  }
  if (process.env.SMTP_SECURE) {
    secure = process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "1";
  }
  if (!from && process.env.SMTP_FROM) from = process.env.SMTP_FROM.replace(/^["']|["']$/g, "").trim();

  // 3. Check .env.example (fallback configuration in local/dev environments)
  if (fs.existsSync(".env.example")) {
    try {
      const exampleConfig = dotenv.parse(fs.readFileSync(".env.example"));
      if (!user && exampleConfig.SMTP_USER) user = exampleConfig.SMTP_USER.replace(/['"]/g, "").trim();
      if (!pass && exampleConfig.SMTP_PASS) {
        const candidate = exampleConfig.SMTP_PASS.replace(/['"]/g, "").trim();
        if (!candidate.startsWith("MY_") && candidate !== "ITEWF@2026") {
          pass = candidate;
        }
      }
      if (!host && exampleConfig.SMTP_HOST) host = exampleConfig.SMTP_HOST.replace(/['"]/g, "").trim();
      if (exampleConfig.SMTP_PORT && !process.env.SMTP_PORT) {
        const p = Number(exampleConfig.SMTP_PORT);
        if (p) port = p;
      }
      if (exampleConfig.SMTP_SECURE && !process.env.SMTP_SECURE) {
        secure = exampleConfig.SMTP_SECURE === "true";
      }
      if (!from && exampleConfig.SMTP_FROM) from = exampleConfig.SMTP_FROM.replace(/^["']|["']$/g, "").trim();
    } catch (e) {
      console.warn("Failed to parse .env.example for SMTP config:", e);
    }
  }

  // 4. Foundation Fail-Safe Fallbacks: Guarantee active production credentials even if env vars were omitted in deployment
  if (!user || user.startsWith("MY_") || !user.includes("@")) user = HARDCODED_FALLBACK_USER;

  // Google Workspace is the authoritative MX for elimishawatoto.org (MX: SMTP.GOOGLE.COM).
  // Connecting to 'mail.elimishawatoto.org' (old cPanel web IP) fails with 535 Incorrect authentication data.
  // Any @elimishawatoto.org or @gmail.com mailbox MUST use smtp.gmail.com.
  if (
    !host ||
    host === "mail.elimishawatoto.org" ||
    host.includes("elimishawatoto.org") ||
    user.endsWith("@elimishawatoto.org") ||
    user.endsWith("@gmail.com")
  ) {
    host = "smtp.gmail.com";
  }

  // Google Workspace strictly requires a 16-char App Password (e.g. krfz kmad vaqz zbdw).
  // Standard account passwords (like ITEWF@2026) are rejected by Google with 535 / 534.
  const isGoogle = host === "smtp.gmail.com" || user.endsWith("@elimishawatoto.org") || user.endsWith("@gmail.com");
  if (!pass || pass.startsWith("MY_") || (isGoogle && !isValidGoogleAppPassword(pass))) {
    pass = HARDCODED_FALLBACK_PASS;
  }

  // Sanitize Google Workspace App Password (16-char code: strip all spaces, quotes, and dashes)
  const cleanPass = pass.replace(/[\s'"]/g, "").trim();
  const parsedFrom = parseFromAddress(from, user);

  return {
    user,
    pass: cleanPass,
    rawPass: pass,
    host: host || "smtp.gmail.com",
    port: port || (secure ? 465 : 587),
    secure: port === 465 || secure,
    from: `"${parsedFrom.name}" <${parsedFrom.address}>`,
    fromParsed: parsedFrom,
    configured: Boolean(user && cleanPass && !user.startsWith("MY_") && !cleanPass.startsWith("MY_"))
  };
}

export function createMailTransporter(smtpConfig: ReturnType<typeof getSmtpConfig>, targetPort?: number) {
  const port = targetPort || smtpConfig.port || 587;
  const isDirectSsl = port === 465;

  return nodemailer.createTransport({
    host: smtpConfig.host || "smtp.gmail.com",
    port,
    secure: isDirectSsl,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 9000,
    greetingTimeout: 5000,
    socketTimeout: 12000,
  });
}

/**
 * Resilient email dispatch with automatic port fallback (Port 587 STARTTLS <-> Port 465 SMTPS)
 * This prevents timeouts in production environments (e.g. Cloud Run, Vercel) where port 465 or 587 may be restricted.
 */
export async function dispatchMailWithFallback(
  mailOptions: nodemailer.SendMailOptions,
  customConfig?: ReturnType<typeof getSmtpConfig>
): Promise<{ messageId: string; portUsed: number }> {
  const config = customConfig || getSmtpConfig();

  if (!config.configured) {
    throw new Error("SMTP credentials are not configured or invalid.");
  }

  const fromParsed = config.fromParsed || parseFromAddress(config.from, config.user);
  const optionsWithFrom: nodemailer.SendMailOptions = {
    ...mailOptions,
    from: fromParsed,
  };

  // Primary port based on config (default 587 for cloud reliability)
  const primaryPort = config.port || 587;
  const secondaryPort = primaryPort === 587 ? 465 : 587;

  // Attempt Primary Transport
  try {
    const primaryTransport = createMailTransporter(config, primaryPort);
    const info = await primaryTransport.sendMail(optionsWithFrom);
    return { messageId: info.messageId, portUsed: primaryPort };
  } catch (primaryErr: any) {
    console.warn(`[SMTP WARN] Primary dispatch on port ${primaryPort} failed: ${primaryErr?.message || primaryErr}. Attempting fallback port ${secondaryPort}...`);

    // Attempt Secondary Fallback Transport
    try {
      const fallbackTransport = createMailTransporter(config, secondaryPort);
      const info = await fallbackTransport.sendMail(optionsWithFrom);
      console.log(`[SMTP RECOVERED] Email dispatched successfully via fallback port ${secondaryPort}: ${info.messageId}`);
      return { messageId: info.messageId, portUsed: secondaryPort };
    } catch (fallbackErr: any) {
      console.error(`[SMTP ERROR] Both primary (${primaryPort}) and fallback (${secondaryPort}) dispatches failed:`, fallbackErr);
      throw new Error(`Email dispatch failed on port ${primaryPort} (${primaryErr?.message || primaryErr}) and fallback port ${secondaryPort} (${fallbackErr?.message || fallbackErr})`);
    }
  }
}

export const emailNotificationLogs: Array<{
  id: string;
  ticketNumber: string;
  recipients: string[];
  subject: string;
  timestamp: string;
  status: 'sent' | 'queued' | 'simulated';
  preview: string;
}> = [];

let aiClient: GoogleGenAI | null = null;
export function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

export const apiRouter = express.Router();

// CORS handling for production domains (it.elimishawatoto.org, Vercel, Cloud Run)
apiRouter.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (_req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

apiRouter.use(express.json({ limit: "10mb" }));

// Health check
apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", aiConfigured: Boolean(process.env.GEMINI_API_KEY) });
});

// Smart Ticket Triage & Classification
apiRouter.post("/ai/triage", async (req, res) => {
  try {
    const { title, description, department } = req.body;
    const ai = getAI();

    if (!ai) {
      // Intelligent rule-based fallback
      const lower = `${title} ${description}`.toLowerCase();
      let cat = "Other";
      let prio = "Medium";
      let estMin = 60;
      let hint = "Please restart your application or device to see if the issue persists.";

      if (lower.includes("keyboard") || lower.includes("mouse") || lower.includes("trackpad") || lower.includes("cursor")) {
        cat = "Keyboard or mouse not working";
        prio = "Medium";
        estMin = 30;
        hint = "Try disconnecting and reconnecting the USB receiver/cable or turning the mouse power switch off and on.";
      } else if (lower.includes("charging") || lower.includes("power") || lower.includes("turning on") || lower.includes("battery") || lower.includes("charger") || lower.includes("won't turn on")) {
        cat = "Laptop not charging or turning on";
        prio = "High";
        estMin = 45;
        hint = "Try a hard reset by holding down the laptop power button for 20 seconds while plugged into the wall charger.";
      } else if (lower.includes("password") || lower.includes("email password") || lower.includes("reset password") || lower.includes("locked out") || lower.includes("login")) {
        cat = "Email Password";
        prio = "High";
        estMin = 15;
        hint = "You can self-service reset your password via the identity portal if your MFA mobile device is enrolled.";
      } else if (lower.includes("word") || lower.includes("excel") || lower.includes("powerpoint") || lower.includes("office") || lower.includes("outlook") || lower.includes("microsoft 365") || lower.includes("m365")) {
        cat = "Microsoft Office( Word, Powerpoint & Excel)";
        prio = "Medium";
        estMin = 45;
        hint = "Try closing all Office applications and signing out and back in with your corporate Microsoft 365 credentials.";
      } else if (lower.includes("wifi") || lower.includes("network") || lower.includes("vpn") || lower.includes("internet") || lower.includes("connectivity") || lower.includes("dns")) {
        cat = "Network Connectivity";
        prio = "High";
        estMin = 30;
        hint = "Check your WiFi connection, toggle airplane mode off and on, or verify your VPN status.";
      } else if (lower.includes("license") || lower.includes("activation") || lower.includes("app error") || lower.includes("crash") || lower.includes("install") || lower.includes("software")) {
        cat = "Software (App errors, Activation Keys)";
        prio = "Medium";
        estMin = 60;
        hint = "Check if pending software updates are available in the corporate software portal.";
      } else if (lower.includes("request") || lower.includes("new laptop") || lower.includes("monitor") || lower.includes("headset") || lower.includes("equipment")) {
        cat = "Equipment Request";
        prio = "Low";
        estMin = 120;
        hint = "Your equipment request will be reviewed and routed to the IT procurement and inventory team.";
      }

      return res.json({
        detectedCategory: cat,
        recommendedPriority: prio,
        urgencyReasoning: "Evaluated based on enterprise operational impact rules.",
        estimatedMinutes: estMin,
        suggestedTags: [cat.toLowerCase().replace(/[^a-z0-9]/g, "-"), prio.toLowerCase(), "automated-triage"],
        autoDeflectionHint: hint,
        rootCauseHypothesis: `Issue appears related to ${cat} category. Initial inspection recommended.`,
        isAiGenerated: false
      });
    }

    const prompt = `You are an expert IT Service Desk Operations AI Agent.
Analyze the following IT support ticket request and output a strictly valid JSON object.

Ticket Title: "${title || ""}"
Ticket Description: "${description || ""}"
Reporter Department: "${department || "General"}"

Output JSON with these exact fields:
{
  "detectedCategory": "Keyboard or mouse not working" | "Laptop not charging or turning on" | "Email Password" | "Microsoft Office( Word, Powerpoint & Excel)" | "Software (App errors, Activation Keys)" | "Network Connectivity" | "Equipment Request" | "Other",
  "recommendedPriority": "Low" | "Medium" | "High" | "Critical",
  "urgencyReasoning": "Brief 1-sentence reasoning for this priority classification",
  "estimatedMinutes": integer estimated resolution time in minutes,
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "autoDeflectionHint": "A clear, polite 1-2 sentence self-service check or quick workaround the user can try right now before an agent responds",
  "rootCauseHypothesis": "Concise technical hypothesis for the IT technician"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ ...parsed, isAiGenerated: true });
  } catch (err: any) {
    console.error("AI Triage error:", err);
    return res.status(500).json({ error: err.message || "Failed to triage ticket" });
  }
});

// AI Diagnostic Copilot & Remediation Generator
apiRouter.post("/ai/diagnose", async (req, res) => {
  try {
    const { ticket, comments, agentPrompt } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.json({
        diagnosticSteps: [
          "1. Verify network connectivity and ping default gateway.",
          "2. Inspect Event Viewer / Console.log for corresponding error codes.",
          "3. Clear local application cache and restart corresponding system service.",
          "4. Verify user permissions and token validity in IAM directory."
        ],
        cliScript: "# Powershell Quick Check\nTest-NetConnection -ComputerName internal.corp.net -Port 443\nGet-Service -Name *Corp* | Restart-Service -Force",
        suggestedReply: `Hello ${ticket?.reporterName || "there"},\n\nThank you for reaching out to IT Support. We have received your request regarding "${ticket?.title || "your issue"}".\n\nCould you please confirm if this behavior persists after restarting the application? If you receive an error code, please share a screenshot.\n\nBest regards,\nIT Support Team`,
        internalNotes: "Standard triage applied. Awaiting user feedback on diagnostic steps.",
        isAiGenerated: false
      });
    }

    const prompt = `You are a Senior IT Systems Administrator & Helpdesk Copilot.
Analyze this IT Support ticket and provide step-by-step diagnostic procedures, CLI troubleshooting scripts, a friendly customer reply, and internal technician notes.

Ticket Details:
- Title: ${ticket.title}
- Category: ${ticket.category}
- Priority: ${ticket.priority}
- Status: ${ticket.status}
- Reporter: ${ticket.reporterName} (${ticket.reporterEmail || "unknown"}, Dept: ${ticket.reporterDepartment || "General"})
- Device/Asset: ${ticket.assetId || "Standard Laptop"} (OS: ${ticket.operatingSystem || "Windows 11 / macOS"})
- Description: ${ticket.description}
- Previous Comments: ${JSON.stringify(comments || [])}
- Agent Special Query/Instruction: "${agentPrompt || "Provide full diagnosis and resolution plan"}"

Output ONLY a JSON object with this structure:
{
  "diagnosticSteps": ["Step 1...", "Step 2...", "Step 3...", "Step 4..."],
  "cliScript": "Executable PowerShell / Bash / Terminal commands with comments for technician",
  "suggestedReply": "Polite, empathetic, and crystal clear message to the end-user explaining next steps or resolution",
  "internalNotes": "Technical summary for the IT team with root cause theory and escalation path",
  "recommendedAction": "e.g. Request Logs, Escalate to Tier 2, Execute PowerShell Script, or Mark as Resolved"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ ...parsed, isAiGenerated: true });
  } catch (err: any) {
    console.error("AI Diagnose error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate diagnosis" });
  }
});

// AI Thread Summarizer
apiRouter.post("/ai/summarize", async (req, res) => {
  try {
    const { ticket, comments } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.json({
        summary: `Ticket #${ticket.id} (${ticket.title}) reported by ${ticket.reporterName}. Status is currently ${ticket.status} with priority ${ticket.priority}. Total ${comments?.length || 0} updates logged.`,
        keyTakeaways: ["Initial issue logged", "Awaiting diagnostic verification", "SLA monitored"],
        isAiGenerated: false
      });
    }

    const prompt = `Summarize this IT support ticket conversation concisely for handover or SLA review.
Ticket: ${ticket.title} (${ticket.category}, ${ticket.priority})
Description: ${ticket.description}
Comments Timeline:
${(comments || []).map((c: any) => `[${c.authorRole} - ${c.authorName} (${c.type})]: ${c.content}`).join("\n")}

Return JSON:
{
  "summary": "2-3 sentence overview of issue, actions taken, and current roadblock/status",
  "keyTakeaways": ["point 1", "point 2", "point 3"],
  "nextBestAction": "Single immediate next step required"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ ...parsed, isAiGenerated: true });
  } catch (err: any) {
    console.error("AI Summarize error:", err);
    return res.status(500).json({ error: err.message || "Failed to summarize" });
  }
});

// AI Knowledge Base Article Generator
apiRouter.post("/ai/generate-kb", async (req, res) => {
  try {
    const { ticket, resolutionNotes } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.json({
        title: `Troubleshooting Guide: ${ticket.title}`,
        category: ticket.category || "General",
        summary: `Resolution guide for ${ticket.title} encountered by ${ticket.reporterDepartment || "users"}.`,
        symptoms: [ticket.description || "Reported unexpected behavior"],
        rootCause: "Software configuration mismatch or network timeout.",
        resolutionSteps: [
          "1. Identify affected endpoint and verify connectivity.",
          "2. Run application diagnostic utility or reinstall client package.",
          "3. Validate fix with end user and update inventory status."
        ],
        prevention: "Keep software clients updated via automatic patch management.",
        isAiGenerated: false
      });
    }

    const prompt = `Convert this resolved IT support ticket into a standardized IT Knowledge Base (KB) article for technicians and end-users.
Ticket Title: ${ticket.title}
Category: ${ticket.category}
Initial Problem: ${ticket.description}
Resolution Notes: ${resolutionNotes || "Issue resolved successfully."}

Output JSON:
{
  "title": "KB Article Title (e.g., How to Fix... / Troubleshooting...)",
  "category": "${ticket.category}",
  "summary": "Brief 1-2 sentence summary of what this article resolves",
  "symptoms": ["Symptom 1", "Symptom 2"],
  "rootCause": "Explanation of underlying root cause",
  "resolutionSteps": ["Step 1...", "Step 2...", "Step 3..."],
  "prevention": "Tips to prevent recurrence",
  "keywords": ["tag1", "tag2", "tag3"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ ...parsed, isAiGenerated: true });
  } catch (err: any) {
    console.error("AI KB Generator error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate KB article" });
  }
});

// Ticket Email Notification Endpoint (Tickets Raised -> Sent ONLY to IT Administrator)
apiRouter.post("/notifications/ticket-created", async (req, res) => {
  try {
    const { ticket, staffEmails = [], testRecipient } = req.body;

    if (!ticket || !ticket.ticketNumber || !ticket.title) {
      return res.status(400).json({ error: "Invalid ticket payload" });
    }

    const primaryAdminEmail = (process.env.IT_SUPPORT_EMAIL || "it@elimishawatoto.org").trim().toLowerCase();
    
    // STRICT RULE: Only the IT Administrator (it@elimishawatoto.org) receives tickets raised.
    // The staff member/employee who submitted the ticket does NOT receive this IT alert.
    let allRecipients: string[];
    if (testRecipient && typeof testRecipient === 'string' && testRecipient.includes('@')) {
      allRecipients = [testRecipient.trim().toLowerCase()];
    } else {
      allRecipients = [primaryAdminEmail];
    }

    const subject = `[New IT Support Ticket - ${ticket.priority?.toUpperCase() || "NEW"}] Ticket ${ticket.ticketNumber}: ${ticket.title}`;
    const itWorkspaceUrl = (process.env.IT_WORKSPACE_URL || "https://it.elimishawatoto.org").trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b; }
    .container { max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #0f172a; padding: 24px; color: #ffffff; }
    .header-tag { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #38bdf8; font-weight: 700; margin-bottom: 4px; }
    .header-title { font-size: 20px; font-weight: 700; margin: 0; color: #ffffff; }
    .content { padding: 24px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; }
    .badge-critical { background: #ffe4e6; color: #e11d48; }
    .badge-high { background: #ffedd5; color: #ea580c; }
    .badge-medium { background: #fef3c7; color: #d97706; }
    .badge-low { background: #f1f5f9; color: #475569; }
    .section-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0; }
    .label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 2px; }
    .value { font-size: 14px; font-weight: 600; color: #0f172a; }
    .desc-box { background: #ffffff; border-left: 4px solid #0284c7; padding: 12px 16px; margin-top: 12px; border-radius: 4px; font-size: 13px; line-height: 1.6; color: #334155; }
    .btn { display: inline-block; background: #0284c7; color: #ffffff; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 16px; }
    .footer { background: #f1f5f9; padding: 16px 24px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-tag">Elimisha Watoto Foundation • IT Helpdesk</div>
      <h1 class="header-title">New Support Incident Submitted</h1>
    </div>
    <div class="content">
      <p style="margin-top: 0; font-size: 14px; color: #475569;">
        A new ticket has been opened by an employee and requires review from the IT Support team.
      </p>

      <div class="section-box">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; width: 50%;">
              <div class="label">Ticket Number</div>
              <div class="value">${ticket.ticketNumber}</div>
            </td>
            <td style="padding: 6px 0; width: 50%;">
              <div class="label">Priority</div>
              <div class="value">
                <span class="badge badge-${(ticket.priority || 'medium').toLowerCase()}">${ticket.priority || 'Medium'}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0;">
              <div class="label">Category</div>
              <div class="value">${ticket.category || 'General Issue'}</div>
            </td>
            <td style="padding: 6px 0;">
              <div class="label">Reporter</div>
              <div class="value">${ticket.reporterName || 'Employee'} (${ticket.reporterDepartment || 'Staff'})</div>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 6px 0;">
              <div class="label">Reporter Email</div>
              <div class="value" style="font-weight: 400; color: #0284c7;">${ticket.reporterEmail || 'N/A'}</div>
            </td>
          </tr>
        </table>

        <div style="margin-top: 14px;">
          <div class="label">Summary / Title</div>
          <div class="value" style="font-size: 15px; margin-top: 2px;">${ticket.title}</div>
        </div>

        <div style="margin-top: 12px;">
          <div class="label">Incident Description</div>
          <div class="desc-box">${(ticket.description || '').replace(/\n/g, '<br/>')}</div>
        </div>
      </div>

      <div style="text-align: center; margin-top: 20px;">
        <a href="${itWorkspaceUrl}" class="btn" style="color: #ffffff;">Open IT Support Workspace</a>
      </div>
    </div>
    <div class="footer">
      Sent exclusively to IT Administration (<strong>${primaryAdminEmail}</strong>).<br/>
      Elimisha Watoto Foundation • Automated IT Service Desk Notification
    </div>
  </div>
</body>
</html>`;

    const textFallback = `[NEW IT TICKET: ${ticket.ticketNumber}]
Priority: ${ticket.priority}
Category: ${ticket.category}
Staff Member: ${ticket.reporterName} (${ticket.reporterDepartment || 'Staff'}) - ${ticket.reporterEmail || 'N/A'}
Summary: ${ticket.title}

Description:
${ticket.description}

Open IT Support Workspace: ${itWorkspaceUrl}
Elimisha Watoto Foundation IT Operations`;

    let sendStatus: 'sent' | 'simulated' = 'simulated';
    let messageId: string | undefined = undefined;
    let smtpError: string | undefined = undefined;
    let portUsed: number | undefined = undefined;

    const smtpConfig = getSmtpConfig();

    if (smtpConfig.configured) {
      try {
        const dispatchResult = await dispatchMailWithFallback({
          to: allRecipients,
          subject,
          text: textFallback,
          html: htmlContent,
        }, smtpConfig);

        sendStatus = 'sent';
        messageId = dispatchResult.messageId;
        portUsed = dispatchResult.portUsed;
        console.log(`[GOOGLE WORKSPACE EMAIL SENT] Ticket ${ticket.ticketNumber} notification sent to IT Admin: ${allRecipients.join(", ")} via Port ${portUsed} | ID: ${messageId}`);
      } catch (err: any) {
        smtpError = err?.message || String(err);
        console.error(`[SMTP ERROR] Failed to send ticket creation alert via Google Workspace / SMTP:`, smtpError);
        sendStatus = 'simulated';
      }
    } else {
      console.log(`[EMAIL NOTIFICATION DISPATCHED] (Simulated / Logged for IT Admin)`);
      console.log(`To: ${allRecipients.join(", ")}`);
      console.log(`Subject: ${subject}`);
      console.log(`Ticket: ${ticket.ticketNumber} - ${ticket.title}`);
    }

    // Record in notification audit logs
    const logEntry = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ticketNumber: ticket.ticketNumber,
      recipients: allRecipients,
      subject,
      timestamp: new Date().toISOString(),
      status: sendStatus,
      error: smtpError,
      preview: `New ${ticket.priority?.toUpperCase()} incident from ${ticket.reporterName} sent to IT Admin (${allRecipients.join(", ")})${portUsed ? ` via Port ${portUsed}` : ''}`,
    };
    emailNotificationLogs.unshift(logEntry);
    if (emailNotificationLogs.length > 50) emailNotificationLogs.pop();

    return res.json({
      success: sendStatus === 'sent',
      message: sendStatus === 'sent' 
        ? `Ticket notification successfully sent to IT administrator (${allRecipients.join(", ")}).`
        : `Ticket notification logged (Delivery could not complete: ${smtpError || 'Simulated mode'}).`,
      warning: sendStatus !== 'sent' ? (smtpError || 'Email could not be delivered live.') : undefined,
      recipients: allRecipients,
      ticketNumber: ticket.ticketNumber,
      status: sendStatus,
      port: portUsed,
      messageId,
      error: smtpError,
      dispatchedAt: logEntry.timestamp,
    });
  } catch (err: any) {
    console.error("Ticket email notification error:", err);
    return res.status(500).json({ error: err.message || "Failed to dispatch email notification" });
  }
});

// Ticket Resolved Notification Endpoint (Tickets Resolved -> Sent ONLY to Staff/Reporter)
apiRouter.post("/notifications/ticket-resolved", async (req, res) => {
  try {
    const { ticket, resolutionNotes, resolvedBy, testRecipient } = req.body;

    if (!ticket || !ticket.ticketNumber) {
      return res.status(400).json({ error: "Invalid ticket payload" });
    }

    const reporterEmail = (ticket.reporterEmail || "").trim().toLowerCase();
    
    // STRICT RULE: Only the staff member who raised the ticket receives the resolution notification.
    // The IT administrator (it@elimishawatoto.org) does NOT receive this resolution email.
    let allRecipients: string[];
    if (testRecipient && typeof testRecipient === 'string' && testRecipient.includes('@')) {
      allRecipients = [testRecipient.trim().toLowerCase()];
    } else if (reporterEmail && reporterEmail.includes("@")) {
      allRecipients = [reporterEmail];
    } else {
      return res.status(400).json({ error: "No valid staff email address found on ticket to receive resolution notification" });
    }

    const technicianName = resolvedBy || "IT Support Desk";
    const notesText = resolutionNotes || ticket.resolutionNotes || "Issue has been verified and resolved by the IT support team.";
    const subject = `[RESOLVED] Ticket ${ticket.ticketNumber}: ${ticket.title}`;
    const itWorkspaceUrl = (process.env.IT_WORKSPACE_URL || "https://it.elimishawatoto.org").trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b; }
    .container { max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #059669; padding: 24px; color: #ffffff; }
    .header-tag { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #a7f3d0; font-weight: 700; margin-bottom: 4px; }
    .header-title { font-size: 20px; font-weight: 700; margin: 0; color: #ffffff; }
    .content { padding: 24px; }
    .status-banner { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; color: #065f46; }
    .section-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0; }
    .label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 2px; }
    .value { font-size: 14px; font-weight: 600; color: #0f172a; }
    .resolution-box { background: #ffffff; border-left: 4px solid #10b981; padding: 14px 16px; margin-top: 12px; border-radius: 4px; font-size: 13px; line-height: 1.6; color: #334155; }
    .btn { display: inline-block; background: #059669; color: #ffffff; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 16px; }
    .footer { background: #f1f5f9; padding: 16px 24px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-tag">Elimisha Watoto Foundation • IT Support Desk</div>
      <h1 class="header-title">Your Support Ticket Has Been Resolved</h1>
    </div>
    <div class="content">
      <div class="status-banner">
        <strong>Great news!</strong> Your support incident has been investigated and marked as completed by our IT team.
      </div>

      <p style="font-size: 14px; color: #475569; margin-top: 0;">
        Dear <strong>${ticket.reporterName || 'Colleague'}</strong>,
      </p>

      <div class="section-box">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; width: 50%;">
              <div class="label">Ticket Number</div>
              <div class="value">${ticket.ticketNumber}</div>
            </td>
            <td style="padding: 6px 0; width: 50%;">
              <div class="label">Status</div>
              <div class="value">
                <span style="color: #059669; font-weight: 700;">RESOLVED</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0;">
              <div class="label">Category</div>
              <div class="value">${ticket.category || 'General Issue'}</div>
            </td>
            <td style="padding: 6px 0;">
              <div class="label">Resolved By</div>
              <div class="value">${technicianName}</div>
            </td>
          </tr>
          ${ticket.assetId ? `
          <tr>
            <td colspan="2" style="padding: 6px 0;">
              <div class="label">Device / Asset</div>
              <div class="value" style="font-weight: 500;">${ticket.assetId}</div>
            </td>
          </tr>
          ` : ''}
        </table>

        <div style="margin-top: 12px;">
          <div class="label">Original Request</div>
          <div class="value" style="font-size: 14px; color: #1e293b;">${ticket.title}</div>
        </div>

        <div style="margin-top: 14px;">
          <div class="label" style="color: #047857;">Resolution Summary & Actions Taken</div>
          <div class="resolution-box">${notesText.replace(/\n/g, '<br/>')}</div>
        </div>
      </div>

      <div style="background: #f0fdf4; border-radius: 10px; padding: 12px 16px; font-size: 12px; color: #166534; line-height: 1.5; border: 1px dashed #86efac;">
        <strong>Need further assistance?</strong> If you continue to experience any issues, you can reply directly to this email or reopen the request in your Employee Support Portal.
      </div>

      <div style="text-align: center; margin-top: 20px;">
        <a href="${itWorkspaceUrl}?portal=employee" class="btn" style="color: #ffffff;">View Ticket in Employee Portal</a>
      </div>
    </div>
    <div class="footer">
      Sent to staff member <strong>${allRecipients.join(", ")}</strong>.<br/>
      Elimisha Watoto Foundation • IT Service Desk • <strong>it@elimishawatoto.org</strong>
    </div>
  </div>
</body>
</html>`;

    const textFallback = `[TICKET RESOLVED: ${ticket.ticketNumber}]
Hello ${ticket.reporterName || "Colleague"},

Your support request "${ticket.title}" (${ticket.ticketNumber}) has been marked as RESOLVED by ${technicianName}.

Category: ${ticket.category}
Resolution Notes:
${notesText}

If you have questions or need further assistance, you can contact IT Support at it@elimishawatoto.org or reopen your ticket in the portal.

View in Portal: ${itWorkspaceUrl}?portal=employee
Elimisha Watoto Foundation IT Helpdesk`;

    let sendStatus: 'sent' | 'simulated' = 'simulated';
    let messageId: string | undefined = undefined;
    let smtpError: string | undefined = undefined;
    let portUsed: number | undefined = undefined;

    const smtpConfig = getSmtpConfig();

    if (smtpConfig.configured) {
      try {
        const dispatchResult = await dispatchMailWithFallback({
          to: allRecipients,
          subject,
          text: textFallback,
          html: htmlContent,
        }, smtpConfig);

        sendStatus = 'sent';
        messageId = dispatchResult.messageId;
        portUsed = dispatchResult.portUsed;
        console.log(`[GOOGLE WORKSPACE RESOLUTION EMAIL SENT] Ticket ${ticket.ticketNumber} to staff member: ${allRecipients.join(", ")} via Port ${portUsed} | ID: ${messageId}`);
      } catch (err: any) {
        smtpError = err?.message || String(err);
        console.error(`[SMTP ERROR] Failed to send resolution email via Google Workspace / SMTP:`, smtpError);
        sendStatus = 'simulated';
      }
    } else {
      console.log(`[RESOLUTION EMAIL DISPATCHED] (Simulated / Logged for Staff: ${allRecipients.join(", ")})`);
      console.log(`To: ${allRecipients.join(", ")}`);
      console.log(`Subject: ${subject}`);
      console.log(`Ticket: ${ticket.ticketNumber} - ${ticket.title}`);
      console.log(`Resolution: ${notesText}`);
    }

    // Record in notification logs
    const logEntry = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ticketNumber: ticket.ticketNumber,
      recipients: allRecipients,
      subject,
      timestamp: new Date().toISOString(),
      status: sendStatus,
      error: smtpError,
      preview: `Resolution notification for ticket ${ticket.ticketNumber} sent to staff member (${allRecipients.join(", ")})${portUsed ? ` via Port ${portUsed}` : ''}`,
    };
    emailNotificationLogs.unshift(logEntry);
    if (emailNotificationLogs.length > 50) emailNotificationLogs.pop();

    return res.json({
      success: sendStatus === 'sent',
      message: sendStatus === 'sent'
        ? `Resolution email successfully sent to staff member (${allRecipients.join(", ")}).`
        : `Resolution email logged (Delivery could not complete: ${smtpError || 'Simulated mode'}).`,
      warning: sendStatus !== 'sent' ? (smtpError || 'Email could not be delivered live.') : undefined,
      recipients: allRecipients,
      ticketNumber: ticket.ticketNumber,
      status: sendStatus,
      port: portUsed,
      messageId,
      error: smtpError,
      dispatchedAt: logEntry.timestamp,
    });
  } catch (err: any) {
    console.error("Ticket resolution email error:", err);
    return res.status(500).json({ error: err.message || "Failed to dispatch resolution email" });
  }
});

// Get recent notification dispatch log and SMTP status
apiRouter.get("/notifications/recent", (_req, res) => {
  const smtpConfig = getSmtpConfig();
  res.json({
    primaryAdminEmail: process.env.IT_SUPPORT_EMAIL || "it@elimishawatoto.org",
    smtpConfigured: smtpConfig.configured,
    provider: `Google Workspace (${smtpConfig.host}:${smtpConfig.port})`,
    activeSender: smtpConfig.user,
    fromHeader: smtpConfig.from,
    port: smtpConfig.port,
    logs: emailNotificationLogs,
  });
});

// Test Live Email Dispatch Endpoint & update credentials if valid
apiRouter.post("/notifications/test-email", async (req, res) => {
  try {
    const { targetEmail, smtpUser, smtpPass, smtpPort } = req.body || {};
    
    // If testing custom credentials provided in the request
    let customConfig: ReturnType<typeof getSmtpConfig> | null = null;
    if (smtpPass) {
      const cleanPass = String(smtpPass).replace(/[\s'"]/g, "").trim();
      const cleanUser = String(smtpUser || getSmtpConfig().user || "it@elimishawatoto.org").trim();
      const parsedFrom = parseFromAddress(`"Elimisha Watoto IT Helpdesk" <${cleanUser}>`, cleanUser);
      const testPort = Number(smtpPort) || 587;
      customConfig = {
        user: cleanUser,
        pass: cleanPass,
        rawPass: String(smtpPass),
        host: "smtp.gmail.com",
        port: testPort,
        secure: testPort === 465,
        from: `"${parsedFrom.name}" <${parsedFrom.address}>`,
        fromParsed: parsedFrom,
        configured: Boolean(cleanUser && cleanPass),
      };
    }

    const smtpConfig = customConfig || getSmtpConfig();
    const recipient = (targetEmail || smtpConfig.user || "it@elimishawatoto.org").trim();

    if (!smtpConfig.configured) {
      return res.status(400).json({
        success: false,
        error: "SMTP credentials not configured. Please check SMTP_USER and SMTP_PASS.",
        config: { user: smtpConfig.user, configured: false }
      });
    }

    const { messageId, portUsed } = await dispatchMailWithFallback({
      to: recipient,
      subject: `[TEST] Elimisha 360 - Google Workspace Live Email Verification (${new Date().toLocaleTimeString()})`,
      text: `Hello IT Administrator,\n\nThis is a verified live test email dispatched from your Elimisha 360 IT Operations Service Desk.\n\nSender: ${smtpConfig.user}\nHost: ${smtpConfig.host}\nRecipient: ${recipient}\nTimestamp: ${new Date().toISOString()}\nStatus: Live SMTP Connected & Authenticated via Google Workspace.\n\nAutomated ticket submission alerts and employee resolution emails are functioning in production.`,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 540px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
  <div style="background: #0284c7; padding: 18px 24px; color: #ffffff;">
    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.85;">Elimisha Watoto Foundation</div>
    <h2 style="margin: 4px 0 0 0; font-size: 18px;">Live Email Verification Test</h2>
  </div>
  <div style="padding: 24px; color: #334155; line-height: 1.6;">
    <p style="margin-top: 0;">Hello IT Administrator,</p>
    <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 4px; color: #166534; font-size: 14px; margin: 16px 0;">
      <strong>✓ Google Workspace SMTP is connected!</strong> Live email delivery has been verified successfully.
    </div>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 16px 0;">
      <tr>
        <td style="padding: 6px 0; color: #64748b;"><strong>Sender Account:</strong></td>
        <td style="padding: 6px 0; color: #0f172a;">${smtpConfig.user}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #64748b;"><strong>Recipient:</strong></td>
        <td style="padding: 6px 0; color: #0f172a;">${recipient}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #64748b;"><strong>Provider:</strong></td>
        <td style="padding: 6px 0; color: #0f172a;">Google Workspace (${smtpConfig.host}:${smtpConfig.port || 587})</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #64748b;"><strong>Timestamp:</strong></td>
        <td style="padding: 6px 0; color: #0f172a;">${new Date().toISOString()}</td>
      </tr>
    </table>
    <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">
      All ticket submission alerts and employee resolution emails are dispatched live through this connection.
    </p>
  </div>
</div>`
    }, smtpConfig);

    // If verification succeeded and custom credentials were provided, save them to runtime overrides!
    if (customConfig) {
      runtimeSmtpOverrides.user = customConfig.user;
      runtimeSmtpOverrides.pass = customConfig.pass;
      runtimeSmtpOverrides.from = customConfig.from;
      runtimeSmtpOverrides.port = portUsed;
    }

    const logEntry = {
      id: `notif-test-${Date.now()}`,
      ticketNumber: "TEST-VERIFY",
      recipients: [recipient],
      subject: "Google Workspace Live Email Verification",
      timestamp: new Date().toISOString(),
      status: 'sent' as const,
      preview: `Verified live test email sent to ${recipient} via Google Workspace (Port ${portUsed})`,
    };
    emailNotificationLogs.unshift(logEntry);

    return res.json({
      success: true,
      message: `Test email successfully dispatched to ${recipient} via Port ${portUsed}!`,
      messageId,
      recipient,
      sender: smtpConfig.user,
      port: portUsed,
    });
  } catch (err: any) {
    console.error("Test email dispatch error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to send test email",
      hint: "Verify Google Workspace account has 2-Step Verification and a valid 16-character App Password (krfz kmad vaqz zbdw).",
    });
  }
});

// Update active SMTP credentials at runtime
apiRouter.post("/notifications/config", (req, res) => {
  const { smtpUser, smtpPass, smtpPort } = req.body || {};
  if (smtpUser) runtimeSmtpOverrides.user = String(smtpUser).trim();
  if (smtpPass) runtimeSmtpOverrides.pass = String(smtpPass).replace(/\s+/g, "").trim();
  if (smtpUser) runtimeSmtpOverrides.from = `"Elimisha Watoto IT Helpdesk" <${smtpUser}>`;
  if (smtpPort) runtimeSmtpOverrides.port = Number(smtpPort) || 587;

  const updated = getSmtpConfig();
  res.json({
    success: true,
    message: "Google Workspace SMTP credentials updated for runtime.",
    user: updated.user,
    port: updated.port,
    configured: updated.configured,
  });
});

// ==========================================
// VERCEL SERVERLESS FUNCTION ENTRYPOINT
// ==========================================
export const app = express();

app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (_req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: "10mb" }));

// Normalize URL for Vercel rewrites: /api/(.*) -> /api?0=$1 or x-matched-path
app.use((req, _res, next) => {
  const queryMatch = req.url.match(/[?&]0=([^&]+)/);
  if (queryMatch) {
    const subPath = decodeURIComponent(queryMatch[1]);
    const cleanSubPath = subPath.startsWith("/") ? subPath : "/" + subPath;
    const cleanQuery = req.url.replace(/[?&]0=[^&]+/, "").replace(/\?$/, "");
    const queryString = cleanQuery.includes("?") ? cleanQuery.slice(cleanQuery.indexOf("?")) : "";
    req.url = cleanSubPath + queryString;
  } else if (req.headers["x-matched-path"]) {
    const matched = req.headers["x-matched-path"];
    if (typeof matched === "string" && matched.startsWith("/api/")) {
      req.url = matched.slice(4);
    }
  }
  next();
});

// Mount routes on both /api and / to support direct calls and Vercel rewrites
app.use("/api", apiRouter);
app.use("/", apiRouter);

// Fallback JSON 404 handler (prevents returning HTML to API consumers)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "API route not found: " + req.method + " " + req.url,
    hint: "Verify endpoint path and method in client request.",
  });
});

// Global Error Handler: guarantees API returns structured JSON, not raw server error HTML
app.use((err, _req, res, _next) => {
  console.error("Vercel Serverless Function execution error:", err);
  res.status(500).json({
    success: false,
    error: (err && err.message) || "Internal Server Error in serverless execution",
    stack: process.env.NODE_ENV !== "production" ? (err && err.stack) : undefined,
  });
});

export default app;
