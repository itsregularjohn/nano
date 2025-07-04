import { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { getCookie } from "hono/cookie";
import { validateSession, SessionData } from "./sessions";

const SESSION_COOKIE_NAME = "app_session";

// Extend Hono context to include session data
declare module "hono" {
  interface ContextVariableMap {
    session: SessionData;
  }
}

export function sessionMiddleware() {
  return async (c: Context, next: Next) => {
    const sessionId = getCookie(c, SESSION_COOKIE_NAME);

    if (!sessionId) {
      throw new HTTPException(401, { message: "No session found" });
    }

    const session = await validateSession(sessionId);

    if (!session) {
      // Clear invalid session cookie
      c.header(
        "Set-Cookie",
        `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`
      );
      throw new HTTPException(401, { message: "Invalid or expired session" });
    }

    // Attach session data to context
    c.set("session", session);

    await next();
  };
}

export function setSessionCookie(
  c: Context,
  sessionId: string,
  maxAge: number = 24 * 60 * 60
): void {
  const isProduction = process.env.NODE_ENV === "production";

  const cookieOptions = [
    `${SESSION_COOKIE_NAME}=${sessionId}`,
    "Path=/",
    "HttpOnly",
    `Max-Age=${maxAge}`,
    "SameSite=Lax",
  ];

  // Only set Secure flag in production (HTTPS)
  if (isProduction) {
    cookieOptions.push("Secure");
  }

  c.header("Set-Cookie", cookieOptions.join("; "));
}

export function clearSessionCookie(c: Context): void {
  c.header(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`
  );
}

export function getSessionData(c: Context): SessionData {
  return c.get("session");
}
