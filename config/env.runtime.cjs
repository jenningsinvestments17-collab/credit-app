const requiredVariables = [
  "DATABASE_URL",
  "REDIS_URL",
  "APP_SESSION_SECRET",
  "ADMIN_BOOTSTRAP_EMAIL",
  "ADMIN_BOOTSTRAP_PASSWORD",
  "NEXT_PUBLIC_APP_URL",
  "APP_BASE_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
];

function validateAbsoluteUrl(name, value) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("must use http or https");
    }
  } catch (error) {
    throw new Error(`${name} must be a valid absolute URL. ${error.message}`);
  }
}

function validateRuntimeEnv() {
  const missing = requiredVariables.filter((name) => !process.env[name] || !String(process.env[name]).trim());

  if (missing.length) {
    const message = `Missing required environment variables: ${missing.join(", ")}`;
    console.error(message);
    throw new Error(message);
  }

  validateAbsoluteUrl("NEXT_PUBLIC_APP_URL", process.env.NEXT_PUBLIC_APP_URL);
  validateAbsoluteUrl("APP_BASE_URL", process.env.APP_BASE_URL);
}

module.exports = {
  validateRuntimeEnv,
  requiredVariables,
};
