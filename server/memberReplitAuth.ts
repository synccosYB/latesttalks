import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getMemberSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const isProduction = process.env.NODE_ENV === "production" || process.env.REPL_ID;
  
  let sessionStore;
  if (process.env.DATABASE_URL) {
    const pgStore = connectPg(session);
    sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      ttl: sessionTtl,
      tableName: "sessions",
    });
  }
  
  return session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      maxAge: sessionTtl,
      sameSite: isProduction ? "none" as const : "lax" as const,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertMember(claims: any) {
  const replitId = claims["sub"];
  const email = claims["email"];
  const firstName = claims["first_name"] || "";
  const lastName = claims["last_name"] || "";
  const name = [firstName, lastName].filter(Boolean).join(" ") || email?.split("@")[0] || "Member";
  const profileImageUrl = claims["profile_image_url"];

  return await storage.upsertMemberByReplitId({
    replitId,
    email,
    name,
    profileImageUrl,
  });
}

export async function setupMemberAuth(app: Express) {
  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user: any = {};
    updateUserSession(user, tokens);
    const member = await upsertMember(tokens.claims());
    user.memberId = member.id;
    verified(null, user);
  };

  const registeredStrategies = new Set<string>();

  const ensureStrategy = (domain: string) => {
    const strategyName = `memberauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/members/oauth/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  app.get("/api/members/oauth/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`memberauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/members/oauth/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`memberauth:${req.hostname}`, {
      failureRedirect: "/plus/login?error=oauth_failed",
    })(req, res, (err: any) => {
      if (err) {
        return res.redirect("/plus/login?error=oauth_failed");
      }
      
      const user = req.user as any;
      if (user?.memberId) {
        req.session.memberId = user.memberId;
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
          }
          res.redirect("/plus");
        });
      } else {
        res.redirect("/plus/login?error=no_member");
      }
    });
  });

  app.get("/api/members/oauth/logout", (req, res) => {
    req.session.memberId = undefined;
    req.logout(() => {
      res.redirect("/plus");
    });
  });
}

export const isOAuthMemberAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user?.expires_at) {
    return next();
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    return next();
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    return next();
  }
};
