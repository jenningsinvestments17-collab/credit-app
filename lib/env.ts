type EnvShape = {
  NODE_ENV: "development" | "production" | "test";
  DATABASE_URL: string;
  REDIS_URL: string;
  APP_SESSION_SECRET: string;
  ADMIN_BOOTSTRAP_EMAIL: string;
  ADMIN_BOOTSTRAP_PASSWORD: string;
  NEXT_PUBLIC_APP_URL: string;
  APP_BASE_URL: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  CERTIFIED_MAIL_PROVIDER: "lob" | "click2mail";
  NOTIFICATION_EMAIL_FROM: string;
  NOTIFICATION_EMAIL_PROVIDER: "placeholder";
  NOTIFICATION_SMS_ENABLED: boolean;
  ADMIN_ALERT_EMAIL_ENABLED: boolean;
  TRUST_PROXY: boolean;
};

declare global {
  // eslint-disable-next-line no-var
  var __validatedEnv: EnvShape | undefined;
}

function required(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function normalizeBaseUrl(value: string, name: string) {
  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Base URL must be http or https.");
    }

    return url.toString().replace(/\/$/, "");
  } catch (error) {
    throw new Error(
      `${name} must be a valid absolute URL. ${
        error instanceof Error ? error.message : ""
      }`.trim(),
    );
  }
}

function buildEnv(): EnvShape {
  const nodeEnv = (process.env.NODE_ENV?.trim() || "development") as EnvShape["NODE_ENV"];
  const baseUrl = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      process.env.APP_BASE_URL?.trim() ||
      "http://localhost:3001",
    "NEXT_PUBLIC_APP_URL",
  );

  return {
    NODE_ENV: nodeEnv,
    DATABASE_URL: required("DATABASE_URL"),
    REDIS_URL: required("REDIS_URL"),
    APP_SESSION_SECRET: required("APP_SESSION_SECRET"),
    ADMIN_BOOTSTRAP_EMAIL: required("ADMIN_BOOTSTRAP_EMAIL").toLowerCase(),
    ADMIN_BOOTSTRAP_PASSWORD: required("ADMIN_BOOTSTRAP_PASSWORD"),
    NEXT_PUBLIC_APP_URL: baseUrl,
    APP_BASE_URL: normalizeBaseUrl(
      process.env.APP_BASE_URL?.trim() || baseUrl,
      "APP_BASE_URL",
    ),
    STRIPE_SECRET_KEY: required("STRIPE_SECRET_KEY"),
    STRIPE_WEBHOOK_SECRET: required("STRIPE_WEBHOOK_SECRET"),
    CERTIFIED_MAIL_PROVIDER:
      (process.env.CERTIFIED_MAIL_PROVIDER?.trim().toLowerCase() === "click2mail"
        ? "click2mail"
        : "lob"),
    NOTIFICATION_EMAIL_FROM:
      process.env.NOTIFICATION_EMAIL_FROM?.trim() || "support@creduconsulting.com",
    NOTIFICATION_EMAIL_PROVIDER: "placeholder",
    NOTIFICATION_SMS_ENABLED: process.env.NOTIFICATION_SMS_ENABLED?.trim() === "1",
    ADMIN_ALERT_EMAIL_ENABLED: process.env.ADMIN_ALERT_EMAIL_ENABLED?.trim() !== "0",
    TRUST_PROXY: process.env.TRUST_PROXY?.trim() === "1",
  };
}

export function getEnv() {
  if (!globalThis.__validatedEnv) {
    globalThis.__validatedEnv = buildEnv();
  }

  return globalThis.__validatedEnv;
}

export const env = new Proxy({} as EnvShape, {
  get(_target, property) {
    return getEnv()[property as keyof EnvShape];
  },
});
