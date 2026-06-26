import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { execSync } from "child_process";
import nodemailer from "nodemailer";
import crypto from "crypto";

// Load environment variables
dotenv.config();

import {
  dbGetProducts,
  dbAddProduct,
  dbUpdateProduct,
  dbDeleteProduct,
  dbGetCustomers,
  dbGetCustomerByMobile,
  dbRegisterOrUpdateCustomer,
  dbGetOrders,
  dbCreateOrder,
  dbUpdateOrderStatus,
  dbGetCoupons,
  dbCreateCoupon,
  dbUpdateCoupon,
  dbDeleteCoupon,
  dbSignInWithOtp,
  dbVerifyOtp,
  dbSignOut,
  isRealSupabaseConfigured,
  initLocalDatabase
} from "./src/supabase-server";

async function startServer() {
  const app = express();
  app.set("trust proxy", true);
  const PORT = 3000;

  // Set the admin token securely from the environment or generate a secure session-specific token
  const adminToken = process.env.ADMIN_TOKEN || crypto.randomBytes(32).toString("hex");
  if (!process.env.ADMIN_TOKEN) {
    console.warn("⚠️ ADMIN_TOKEN environment variable is not configured. A random secure session token has been generated.");
  }

  // Sync database schema on startup to ensure tables exist in production
  try {
    console.log("Synchronizing database schema via drizzle-kit push...");
    execSync("npx drizzle-kit push --config=src/db/drizzle.config.ts", { stdio: "inherit" });
    console.log("Database schema synchronized successfully.");
  } catch (err) {
    console.error("Database schema synchronization failed:", err);
  }

  // Initialize the database with default products and coupons
  try {
    await initLocalDatabase();
    console.log("Database initialized and seeded successfully.");
  } catch (err) {
    console.error("Database initialization failed:", err);
  }

  // Middleware
  app.use(express.json());

  // API Config route
  app.get("/api/config", (req, res) => {
    res.json({ isRealSupabaseConfigured });
  });

  // Database Diagnostics Route
  app.get("/api/db-test", async (req, res) => {
    if (process.env.NODE_ENV !== "development") {
      return res.status(403).json({
        success: false,
        message: "Database diagnostics endpoint is unavailable in production.",
      });
    }

    const config = {
      SQL_HOST: process.env.SQL_HOST,
      SQL_USER: process.env.SQL_USER,
      SQL_DB_NAME: process.env.SQL_DB_NAME,
      SQL_ADMIN_USER: process.env.SQL_ADMIN_USER,
      HAS_PASSWORD: !!process.env.SQL_PASSWORD,
      HAS_ADMIN_PASSWORD: !!process.env.SQL_ADMIN_PASSWORD,
      NODE_ENV: process.env.NODE_ENV,
    };

    try {
      const { db } = await import("./src/db/index.ts");
      const { sql } = await import("drizzle-orm");
      const result = await db.execute(sql`SELECT 1 as connected`);
      res.json({
        success: true,
        message: "Database connected successfully!",
        config,
        result: result.rows,
      });
    } catch (err: any) {
      console.error("Database connection diagnostics failed:", err);
      res.status(500).json({
        success: false,
        message: "Database connection failed",
        config,
        error: err.message || String(err),
        stack: err.stack,
        cause: err.cause ? (err.cause.message || String(err.cause)) : null,
      });
    }
  });

  // Middleware to validate admin privilege before accessing endpoints
  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    
    if (token === adminToken) {
      return next();
    }
    return res.status(401).json({ error: "Unauthorized access. Admin privileges required." });
  };

  // Products routes
  app.get("/api/products", async (req, res) => {
    try {
      const data = await dbGetProducts();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/products", requireAdmin, async (req, res) => {
    try {
      const data = await dbAddProduct(req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/products/:id", requireAdmin, async (req, res) => {
    try {
      const data = await dbUpdateProduct(req.params.id, req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/products/:id", requireAdmin, async (req, res) => {
    try {
      await dbDeleteProduct(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Customers routes
  app.get("/api/customers", requireAdmin, async (req, res) => {
    try {
      const data = await dbGetCustomers();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/customers/by-mobile/:mobile", async (req, res) => {
    try {
      const { mobile } = req.params;
      const data = await dbGetCustomerByMobile(mobile);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const { id, name, mobile } = req.body;
      const data = await dbRegisterOrUpdateCustomer(id, name, mobile);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Orders routes
  app.get("/api/orders", requireAdmin, async (req, res) => {
    try {
      const data = await dbGetOrders();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const data = await dbCreateOrder(req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/orders/:id", requireAdmin, async (req, res) => {
    try {
      const { status, timeline } = req.body;
      const data = await dbUpdateOrderStatus(req.params.id, status, timeline);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Coupons routes
  app.get("/api/coupons", async (req, res) => {
    try {
      const data = await dbGetCoupons();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/coupons", requireAdmin, async (req, res) => {
    try {
      const data = await dbCreateCoupon(req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/coupons/:id", requireAdmin, async (req, res) => {
    try {
      const data = await dbUpdateCoupon(req.params.id, req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/coupons/:id", requireAdmin, async (req, res) => {
    try {
      await dbDeleteCoupon(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Auth OTP routes
  const getGoogleRedirectUri = (req: express.Request) => {
    if (process.env.APP_URL) {
      return `${process.env.APP_URL.replace(/\/$/, "")}/api/auth/google/callback`;
    }
    const host = req.get('host') || '';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    const protocol = isLocal ? 'http' : 'https';
    return `${protocol}://${host}/api/auth/google/callback`;
  };

  // Admin login and check routes
  app.post("/api/auth/admin-login", (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminPassword) {
      return res.status(500).json({ success: false, error: "Server configuration error: ADMIN_PASSWORD is not configured." });
    }
    
    if (password && password === adminPassword) {
      return res.json({ success: true, token: adminToken });
    } else {
      return res.status(401).json({ success: false, error: "Incorrect Admin Credentials." });
    }
  });

  app.post("/api/auth/admin-check-email", (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.json({ isAdmin: false });
    }
    
    const adminEmailsStr = process.env.ADMIN_EMAILS || "karthikjadhav2007@gmail.com";
    const adminEmails = adminEmailsStr.split(",").map(e => e.trim().toLowerCase());
    
    if (adminEmails.includes(email.trim().toLowerCase())) {
      return res.json({ isAdmin: true, token: adminToken });
    } else {
      return res.json({ isAdmin: false });
    }
  });

  // Helper function to send email notifications when admin accesses the portal
  async function sendAdminAccessNotifications(ip: string, userAgent: string) {
    const emailDest = "karthikjadhav2007@gmail.com";
    const currentTime = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    const subject = "⚠️ Rekha Boutique - Admin Portal Accessed";
    const messageText = `Alert: Rekha Boutique Admin Portal was accessed on ${currentTime}.\n\n` +
      `Details:\n` +
      `- IP Address: ${ip}\n` +
      `- Device/User Agent: ${userAgent}\n\n` +
      `If this was not you, please immediately update your administrative credentials.`;

    const htmlContent = `
      <div style="font-family: sans-serif; padding: 25px; background-color: #fcfdfd; border-radius: 12px; border: 1px solid #e1e8e5; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: #064e3b; padding: 15px 20px; border-radius: 8px 8px 0 0; text-align: center; color: #f4ebd0;">
          <h2 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">⚠️ SECURITY ALERT: Admin Portal Accessed</h2>
        </div>
        <div style="padding: 20px 10px;">
          <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            The Rekha Boutique administrative portal has been accessed. A log of this access event is detailed below:
          </p>
          <table style="width: 100%; border-collapse: collapse; background-color: #fdfdfd; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 12px 15px; font-weight: bold; font-size: 13px; color: #64748b; width: 140px; background-color: #f8fafc;">Timestamp</td>
              <td style="padding: 12px 15px; font-size: 13px; color: #1e293b;">${currentTime} (IST)</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 12px 15px; font-weight: bold; font-size: 13px; color: #64748b; background-color: #f8fafc;">IP Address</td>
              <td style="padding: 12px 15px; font-size: 13px; color: #1e293b; font-family: monospace;">${ip}</td>
            </tr>
            <tr>
              <td style="padding: 12px 15px; font-weight: bold; font-size: 13px; color: #64748b; background-color: #f8fafc;">User Agent</td>
              <td style="padding: 12px 15px; font-size: 13px; color: #1e293b; font-family: monospace; word-break: break-all; line-height: 1.4;">${userAgent}</td>
            </tr>
          </table>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin-top: 25px; border-top: 1px solid #f1f5f9; pt-15px;">
            This email was dispatched to <strong>${emailDest}</strong> as per security protocols. If this access session was unauthorized, please change your system passcode immediately to protect boutique settings, catalogs, and orders.
          </p>
        </div>
      </div>
    `;

    // Send Email Notification via SMTP
    try {
      const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
      const smtpPort = parseInt(process.env.SMTP_PORT || '587');
      const smtpUser = process.env.SMTP_USER || 'karthikjadhav2007@gmail.com';
      const smtpPass = process.env.SMTP_PASS;

      if (smtpPass) {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"${process.env.SMTP_FROM_NAME || 'Rekha Boutique Admin Panel'}" <${smtpUser}>`,
          to: emailDest,
          subject: subject,
          text: messageText,
          html: htmlContent,
        });
        console.log(`[SUCCESS] Email notification dispatched to ${emailDest}`);
      } else {
        console.log(`[INFO] SMTP_PASS not set; email notification to ${emailDest} logged in server terminal:\n${messageText}`);
      }
    } catch (emailErr) {
      console.error("[ERROR] Failed to dispatch email notification:", emailErr);
    }
  }

  // Admin access alert webhook
  app.post("/api/admin/notify-access", async (req, res) => {
    let clientIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "Unknown IP";
    if (clientIp.includes(",")) {
      clientIp = clientIp.split(",")[0].trim();
    }
    const userAgent = req.headers["user-agent"] || "Unknown Device";

    // Trigger notification process asynchronously to respond instantly
    sendAdminAccessNotifications(clientIp, userAgent).catch(err => {
      console.error("Async sendAdminAccessNotifications encountered error:", err);
    });

    return res.json({ success: true, timestamp: new Date().toISOString() });
  });

  // Google OAuth URL generator route
  app.get("/api/auth/google/url", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: "GOOGLE_CLIENT_ID environment variable is not configured." });
    }
    const redirectUri = getGoogleRedirectUri(req);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent"
    });
    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  });

  // Google OAuth Callback Handler
  app.get(["/api/auth/google/callback", "/api/auth/google/callback/"], async (req, res) => {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send("No authorization code provided by Google.");
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(500).send("Google OAuth Client ID or Client Secret is not configured.");
    }

    try {
      const redirectUri = getGoogleRedirectUri(req);
      // Exchange code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        })
      });

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text();
        console.error("Token exchange failed:", errText);
        throw new Error(`Token exchange failed: ${errText}`);
      }

      const tokens = await tokenResponse.json();
      const { access_token } = tokens;

      // Fetch user profile info
      const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      if (!userinfoResponse.ok) {
        const errText = await userinfoResponse.text();
        console.error("Failed to fetch userinfo:", errText);
        throw new Error(`Failed to fetch userinfo: ${errText}`);
      }

      const googleUser = await userinfoResponse.json();
      const { sub, name, email } = googleUser;

      // Register or update customer
      const { dbRegisterOrUpdateGoogleCustomer } = await import("./src/supabase-server");
      const user = await dbRegisterOrUpdateGoogleCustomer(`google_${sub}`, name || "Google User", email || `google_${sub}@gmail.com`);

      // Return popup closer HTML page
      res.send(`
        <html>
          <head>
            <title>Authentication Successful</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                background-color: #f4fbf7;
                color: #10b981;
                margin: 0;
                text-align: center;
              }
              .spinner {
                border: 4px solid rgba(16, 185, 129, 0.1);
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border-left-color: #10b981;
                animation: spin 1s linear infinite;
                margin-bottom: 20px;
              }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              h1 { font-size: 24px; margin-bottom: 8px; color: #064e3b; }
              p { color: #047857; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="spinner"></div>
            <h1>Login Successful!</h1>
            <p>Completing login handshake and returning to Rekha Garments...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  user: ${JSON.stringify(user)} 
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error("Google OAuth callback error:", err);
      res.status(500).send(`
        <html>
          <body style="font-family: sans-serif; padding: 40px; text-align: center; color: #dc2626; background: #fff5f5;">
            <h2>Authentication Failed</h2>
            <p style="color: #991b1b;">${err.message || "An error occurred during Google authentication."}</p>
            <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #dc2626; color: white; border: none; border-radius: 6px; cursor: pointer;">Close Window</button>
          </body>
        </html>
      `);
    }
  });

  app.post("/api/auth/otp-send", async (req, res) => {
    try {
      const { mobile } = req.body;
      const data = await dbSignInWithOtp(mobile);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/otp-verify", async (req, res) => {
    try {
      const { mobile, otp } = req.body;
      const data = await dbVerifyOtp(mobile, otp);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/signout", async (req, res) => {
    try {
      await dbSignOut();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Gemini AI Coupon Generator route
  app.post("/api/gemini/generate-coupons", async (req, res) => {
    try {
      const { campaignTheme, targetDiscountLevel, maxSpend } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured in environment variables.");
      }

      const prompt = `You are the Royal AI Campaign Designer for 'Rekha Garments', a premium boutique in Bangalore selling premium women's drapes (sarees, lehengas, kurtis, gowns) and 1-gram gold temple or Kundan jewellery.
      
Create 3 beautiful, high-converting discount coupon proposals. 
Campaign Theme/Inspiration: "${campaignTheme || 'General Luxury Promos'}"
Desired Discount level or behavior: "${targetDiscountLevel || 'Moderate (15-20% value)'}"
Maximum budget/cap level: "${maxSpend || 'Standard boutique settings'}"

Design these with high-contrast, Indian-heritage inspired names (e.g. MONSOON20, ROYALDIWALI, SEEMAPURAM, JHUMKAGOLD) that reflect luxury. Return the exact JSON structure specified.`;

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                code: { type: Type.STRING, description: "Promo code in uppercase, e.g., FESTIVAL500" },
                type: { type: Type.STRING, description: "Discount type, must be exactly one of: percentage, flat" },
                value: { type: Type.NUMBER, description: "Discount value (e.g. 15 for percentage, or 500 for flat)" },
                minOrderValue: { type: Type.NUMBER, description: "Minimum spend required to use this coupon (e.g. 1500)" },
                expiryDate: { type: Type.STRING, description: "Recommended expiry date in YYYY-MM-DD format (must be a valid date in the future, e.g., 2026-12-31)" },
                description: { type: Type.STRING, description: "A highly luxurious, attractive 1-sentence marketing description explaining the coupon's royal inspiration" }
              },
              required: ["code", "type", "value", "minOrderValue", "expiryDate", "description"]
            }
          }
        }
      });

      const jsonText = response.text || "[]";
      const proposals = JSON.parse(jsonText);
      res.json({ success: true, proposals });
    } catch (error: any) {
      console.error("Gemini Coupon generation failed:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
