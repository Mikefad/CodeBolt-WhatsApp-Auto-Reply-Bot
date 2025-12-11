const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const DEFAULT_BUSINESS_CONFIG = path.join(process.cwd(), 'config', 'business.json');

function getEnv(key, defaultValue, options = {}) {
  const raw = process.env[key];

  if (!raw || raw.length === 0) {
    if (options.required) {
      throw new Error(`Environment variable ${key} is required but was not provided.`);
    }

    return defaultValue;
  }

  return raw;
}

const config = {
  env: getEnv('NODE_ENV', 'development'),
  port: parseInt(getEnv('PORT', '3000'), 10),
  logLevel: getEnv('LOG_LEVEL', 'info'),
  businessConfigPath: getEnv('BUSINESS_CONFIG_PATH', DEFAULT_BUSINESS_CONFIG),
  twilio: {
    accountSid: getEnv('TWILIO_ACCOUNT_SID', undefined, { required: true }),
    authToken: getEnv('TWILIO_AUTH_TOKEN', undefined, { required: true }),
    whatsappNumber: getEnv('TWILIO_WHATSAPP_NUMBER', undefined, { required: true }),
  },
  googleSheets: {
    spreadsheetId: getEnv('GOOGLE_SHEETS_ID'),
    credentialsPath: getEnv('GOOGLE_APPLICATION_CREDENTIALS'),
    tabName: getEnv('GOOGLE_SHEETS_TAB_NAME', 'Conversations'),
  },
  dashboard: {
    username: getEnv('DASHBOARD_USERNAME', 'admin'),
    password: getEnv('DASHBOARD_PASSWORD', undefined, { required: true }),
    pageSize: parseInt(getEnv('DASHBOARD_PAGE_SIZE', '100'), 10),
    sessionSecret: getEnv('DASHBOARD_SESSION_SECRET', undefined, { required: true }),
  },
};

module.exports = config;
