import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { csrf } from "hono/csrf";
import { jsxRenderer } from "hono/jsx-renderer";
import { getCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import { marked } from "marked";
import { readFile } from "fs/promises";
import { join } from "path";
import { z } from "zod";
import config from "./core/config";
import {
  sessionMiddleware,
  setSessionCookie,
  clearSessionCookie,
  getSessionData,
} from "./core/session-middleware";
import { createSession, destroySession, refreshSession } from "./core/sessions";
import { UserModel } from "./models";
import { deleteUserAccount } from "./functions/account";
import {
  createCheckoutSession,
  createPortalSession,
  checkSubscriptionStatus,
} from "./functions/stripe";
import {
  HomePage,
  DashboardPage,
  Layout,
  LoadingPage,
} from "./client";
import {
  OAuthCallbackSchema,
  CreateCheckoutSessionSchema,
  CreatePortalSessionSchema,
  UpdateUserProfileSchema,
} from "./models/validation";

const app = new Hono();

// Middleware
app.use("*", requestId());
app.use(logger());

app.use(
  "/api/*",
  csrf({
    origin: (origin) => {
      const allowedOrigins = [
        config.app.url,
        "http://localhost:3000",
        "https://yourdomain.com",
      ];
      return allowedOrigins.includes(origin);
    },
  })
);

// JSX Renderer for pages that use Layout
app.use(
  "/dashboard",
  jsxRenderer(async ({ children }) => await Layout({ children }))
);

// Public routes
app.get("/", async (c) => {
  // Try to get session without throwing error
  const sessionCookie = getCookie(c, "app_session");

  if (sessionCookie) {
    try {
      const { validateSession } = await import("./core/sessions");
      const session = await validateSession(sessionCookie);

      if (session) {
        const user = await UserModel.findById(session.userId);
        if (user) {
          return c.redirect("/dashboard");
        }
      }
    } catch (error) {
      // Invalid session, clear the cookie and continue to show home page
      clearSessionCookie(c);
    }
  }

  // No valid session, show home page
  const homePage = await HomePage();
  return c.html(homePage);
});

// Serve assets locally during development
app.get("/assets/*", async (c) => {
  if (process.env.IS_OFFLINE || process.env.NODE_ENV === 'development') {
    const assetPath = c.req.path.replace('/assets/', '');
    try {
      const { readFile } = await import('fs/promises');
      const { join } = await import('path');
      const filePath = join(process.cwd(), 'assets', assetPath);
      const content = await readFile(filePath);
      
      // Set appropriate content type
      const ext = assetPath.split('.').pop()?.toLowerCase();
      const contentTypes: Record<string, string> = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'ico': 'image/x-icon',
        'json': 'application/json',
        'xml': 'application/xml',
        'css': 'text/css',
        'js': 'application/javascript'
      };
      
      const contentType = contentTypes[ext || ''] || 'application/octet-stream';
      c.header('Content-Type', contentType);
      c.header('Cache-Control', 'public, max-age=86400');
      
      return c.body(content);
    } catch (error) {
      return c.text('Asset not found', 404);
    }
  }
  return c.text('Not found', 404);
});

// Google OAuth routes
app.get("/oauth/google", async (c) => {
  const { getAuthorizationUrl } = await import("./core/google-auth");

  // Generate random state for CSRF protection
  const state = crypto.randomUUID();
  
  return c.redirect(getAuthorizationUrl(state));
});

app.get(
  "/oauth/google/callback",
  zValidator("query", OAuthCallbackSchema),
  async (c) => {
    const { exchangeCodeForToken, getProfile } = await import(
      "./core/google-auth"
    );

    const { code, state } = c.req.valid("query");

    try {
      // Exchange code for token
      const { access_token } = await exchangeCodeForToken(code);

      // Get user profile
      const profile = await getProfile(access_token);

      // Validate Google profile with our schema
      const { GoogleProfileSchema } = await import("./models");
      const validatedProfile = GoogleProfileSchema.parse(profile);

      // Create or update user
      let user = await UserModel.findByEmail(validatedProfile.email);

      if (!user) {
        user = await UserModel.create({
          email: validatedProfile.email,
          googleId: validatedProfile.sub || validatedProfile.id!, // Use 'sub' or fall back to 'id'
          name: validatedProfile.name,
          givenName: validatedProfile.given_name,
          familyName: validatedProfile.family_name,
          profilePicture: validatedProfile.picture,
        });
      }

      // Create session
      const sessionId = await createSession({
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        stripeCustomerId: user.stripeCustomerId,
      });

      // Set secure session cookie
      setSessionCookie(c, sessionId);

      return c.redirect("/dashboard");
    } catch (error) {
      console.error("OAuth error:", error);
      return c.json({ error: "Authentication failed" }, 500);
    }
  }
);

// Protected routes (require session)
app.use("/api/*", sessionMiddleware());

app.get("/api/me", async (c) => {
  const session = getSessionData(c);
  const user = await UserModel.findById(session.userId);

  if (!user) return c.json({ error: "User not found" }, 404);

  return c.json({ user });
});

// User profile update endpoint
app.patch(
  "/api/me",
  zValidator("json", UpdateUserProfileSchema),
  async (c) => {
    const session = getSessionData(c);
    const updates = c.req.valid("json");

    try {
      await UserModel.update(session.userId, updates);
      const updatedUser = await UserModel.findById(session.userId);
      
      if (!updatedUser) {
        return c.json({ error: "User not found after update" }, 404);
      }

      return c.json({ user: updatedUser });
    } catch (error) {
      console.error("Profile update error:", error);
      return c.json({ error: "Failed to update profile" }, 500);
    }
  }
);

// Subscription endpoints (optional - only if Stripe is configured)
app.get("/api/subscription/status", async (c) => {
  const session = getSessionData(c);

  if (!config.stripe?.apiKey) {
    return c.json({ isPro: false, status: "not_configured" });
  }

  try {
    const status = await checkSubscriptionStatus(session.userId);
    return c.json({
      isPro: status.isActive,
      status: status.status,
      subscriptionId: status.subscriptionId,
    });
  } catch (error) {
    console.error("Subscription status check error:", error);
    return c.json({ error: "Failed to check subscription status" }, 500);
  }
});

app.post(
  "/api/subscription/checkout",
  zValidator("json", CreateCheckoutSessionSchema),
  async (c) => {
    const session = getSessionData(c);
    const { successUrl, cancelUrl } = c.req.valid("json");

    if (!config.stripe?.apiKey || !config.stripe?.priceId) {
      return c.json({ error: "Stripe not configured" }, 400);
    }

    try {
      const checkoutSession = await createCheckoutSession({
        userId: session.userId,
        userEmail: session.userEmail,
        successUrl: successUrl || `${config.app.url}/dashboard?subscription=success`,
        cancelUrl: cancelUrl || `${config.app.url}/dashboard?subscription=cancelled`,
      });

      return c.json({ url: checkoutSession.url });
    } catch (error) {
      console.error("Checkout session error:", error);
      return c.json({ error: "Failed to create checkout session" }, 500);
    }
  }
);

app.post(
  "/api/subscription/portal",
  zValidator("json", CreatePortalSessionSchema),
  async (c) => {
    const session = getSessionData(c);
    const { returnUrl } = c.req.valid("json");

    if (!config.stripe?.apiKey) {
      return c.json({ error: "Stripe not configured" }, 400);
    }

    try {
      const user = await UserModel.findById(session.userId);
      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      if (!user.stripeCustomerId) {
        return c.json({ error: "No active subscription found" }, 404);
      }

      const portalSession = await createPortalSession(
        user.stripeCustomerId,
        returnUrl || `${config.app.url}/dashboard`
      );

      return c.json({ url: portalSession.url });
    } catch (error) {
      console.error("Portal session error:", error);
      return c.json({ error: "Failed to create portal session" }, 500);
    }
  }
);

// Logout endpoint
app.post("/api/auth/logout", async (c) => {
  const session = getSessionData(c);

  try {
    await destroySession(session.sessionId);
    clearSessionCookie(c);
    return c.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return c.json({ error: "Failed to logout" }, 500);
  }
});

// Refresh session with latest user data
app.post("/api/auth/refresh", async (c) => {
  const session = getSessionData(c);
  const user = await UserModel.findById(session.userId);

  if (!user) return c.json({ error: "User not found" }, 404);

  // Refresh session with updated user data
  const updatedSession = await refreshSession(session.sessionId, {
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    stripeCustomerId: user.stripeCustomerId,
  });

  if (!updatedSession) {
    return c.json({ error: "Failed to refresh session" }, 500);
  }

  return c.json({ user });
});

// Account deletion endpoint
app.delete("/api/account", async (c) => {
  const session = getSessionData(c);

  try {
    console.log(`Account deletion requested for user ${session.userId}`);
    await deleteUserAccount(session.userId);

    // Destroy the session
    await destroySession(session.sessionId);
    clearSessionCookie(c);

    return c.json({
      success: true,
      message: "Account and all associated data have been permanently deleted",
    });
  } catch (error) {
    console.error("Account deletion error:", error);
    if (error instanceof Error && error.message === "User not found") {
      return c.json({ error: "User not found" }, 404);
    }
    return c.json(
      {
        error: `Failed to delete account: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      500
    );
  }
});

// Dashboard route
app.get("/dashboard", sessionMiddleware(), async (c) => {
  const session = getSessionData(c);
  const user = await UserModel.findById(session.userId);

  if (!user) {
    return c.redirect("/");
  }

  // Check subscription status if Stripe is configured
  let isPro = false;
  if (config.stripe?.apiKey) {
    try {
      const subscriptionStatus = await checkSubscriptionStatus(session.userId);
      isPro = subscriptionStatus.isActive;
    } catch (error) {
      console.error("Error checking subscription status:", error);
    }
  }

  const userWithSubscription = {
    ...user,
    isPro,
  };

  const dashboardPage = await DashboardPage({ user: userWithSubscription });
  return c.render(dashboardPage);
});

// Privacy Policy route
app.get("/privacy", async (c) => {
  try {
    const markdownPath = join(__dirname, "static", "PRIVACY.md");
    const markdownContent = await readFile(markdownPath, "utf-8");
    const htmlContent = marked(markdownContent);

    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Privacy Policy - SaaS Boilerplate</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
          }
          h1, h2, h3 {
            color: #2c3e50;
          }
          h1 {
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
          }
          h2 {
            margin-top: 30px;
            color: #34495e;
          }
          a {
            color: #3498db;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          code {
            background: #f8f9fa;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', monospace;
          }
          .nav {
            margin-bottom: 30px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <div class="nav">
          <a href="/">← Back to Home</a> | 
          <a href="/dashboard">Dashboard</a>
        </div>
        ${htmlContent}
        <hr>
        <p><small>Generated: ${new Date().toISOString()}</small></p>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Error loading privacy policy:", error);
    return c.html(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Privacy Policy</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px;">
        <h1>Privacy Policy</h1>
        <p>Sorry, we couldn't load the privacy policy at this time. Please try again later.</p>
        <a href="/">← Back to Home</a>
      </body>
      </html>
    `,
      500
    );
  }
});

// Terms of Service route
app.get("/terms", async (c) => {
  try {
    const markdownPath = join(__dirname, "static", "TERMS.md");
    const markdownContent = await readFile(markdownPath, "utf-8");
    const htmlContent = marked(markdownContent);

    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Terms of Service - SaaS Boilerplate</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
          }
          h1, h2, h3 {
            color: #2c3e50;
          }
          h1 {
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
          }
          h2 {
            margin-top: 30px;
            color: #34495e;
          }
          a {
            color: #3498db;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          code {
            background: #f8f9fa;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', monospace;
          }
          .nav {
            margin-bottom: 30px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <div class="nav">
          <a href="/">← Back to Home</a> | 
          <a href="/dashboard">Dashboard</a>
        </div>
        ${htmlContent}
        <hr>
        <p><small>Generated: ${new Date().toISOString()}</small></p>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Error loading terms of service:", error);
    return c.html(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Terms of Service</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px;">
        <h1>Terms of Service</h1>
        <p>Sorry, we couldn't load the terms of service at this time. Please try again later.</p>
        <a href="/">← Back to Home</a>
      </body>
      </html>
    `,
      500
    );
  }
});

app.onError(async (err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }

  console.error("Unexpected error:", err);
  return c.json({ error: "Internal Server Error" }, 500);
});

app.notFound((c) => {
  return c.text("Not Found", 404);
});

export default app;
