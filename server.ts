import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { execSync } from "child_process";

// Load environment variables
dotenv.config();

import {
  dbGetProducts,
  dbAddProduct,
  dbUpdateProduct,
  dbDeleteProduct,
  dbGetCustomers,
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
  const PORT = 3000;

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

  // Products routes
  app.get("/api/products", async (req, res) => {
    try {
      const data = await dbGetProducts();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const data = await dbAddProduct(req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const data = await dbUpdateProduct(req.params.id, req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      await dbDeleteProduct(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Customers routes
  app.get("/api/customers", async (req, res) => {
    try {
      const data = await dbGetCustomers();
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
  app.get("/api/orders", async (req, res) => {
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

  app.put("/api/orders/:id", async (req, res) => {
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

  app.post("/api/coupons", async (req, res) => {
    try {
      const data = await dbCreateCoupon(req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/coupons/:id", async (req, res) => {
    try {
      const data = await dbUpdateCoupon(req.params.id, req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/coupons/:id", async (req, res) => {
    try {
      await dbDeleteCoupon(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Auth OTP routes
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
