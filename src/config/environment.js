/**
 * Environment Configuration Helper
 * Provides runtime environment information and validation
 */

const ENV_CONFIG = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",

  // App Configuration
  APP_NAME: import.meta.env.VITE_APP_NAME || "Bandaru Pay Super Admin",
  APP_VERSION: import.meta.env.VITE_APP_VERSION || "1.0.0",
  APP_ENV: import.meta.env.VITE_APP_ENV || "development",

  // Runtime Detection
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
};

/**
 * Validate environment configuration
 */
export const validateEnvironment = () => {
  const issues = [];

  // Check API URL
  if (!ENV_CONFIG.API_BASE_URL) {
    issues.push("VITE_API_BASE_URL is not configured");
  } else if (
    ENV_CONFIG.IS_PRODUCTION &&
    ENV_CONFIG.API_BASE_URL.includes("localhost")
  ) {
    issues.push("Production build is using localhost API URL");
  }

  // Check for required variables
  const required = ["VITE_API_BASE_URL", "VITE_APP_NAME"];
  required.forEach((key) => {
    if (!import.meta.env[key]) {
      issues.push(`${key} is not configured`);
    }
  });

  return {
    isValid: issues.length === 0,
    issues,
    config: ENV_CONFIG,
  };
};

/**
 * Log environment information (development only)
 */
export const logEnvironment = () => {
  if (ENV_CONFIG.IS_DEVELOPMENT) {
    console.group("🔧 Environment Configuration");
    console.log("Environment:", ENV_CONFIG.APP_ENV);
    console.log("API Base URL:", ENV_CONFIG.API_BASE_URL);
    console.log("App Name:", ENV_CONFIG.APP_NAME);
    console.log("App Version:", ENV_CONFIG.APP_VERSION);
    console.log("Is Development:", ENV_CONFIG.IS_DEVELOPMENT);
    console.log("Is Production:", ENV_CONFIG.IS_PRODUCTION);
    console.groupEnd();

    const validation = validateEnvironment();
    if (!validation.isValid) {
      console.warn("⚠️ Environment Issues:", validation.issues);
    }
  }
};

export default ENV_CONFIG;
