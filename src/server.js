const express = require('express');
const session = require('express-session');
const config = require('./config/env');
const { loadBusinessConfig, watchBusinessConfig } = require('./config/businessConfig');
const Logger = require('./utils/logger');
const TwilioService = require('./services/twilioService');
const GoogleSheetsService = require('./services/googleSheetsService');
const createWebhookRouter = require('./routes/webhook');
const createDashboardRouter = require('./routes/dashboard');
const { createDashboardAuth } = require('./middleware/dashboardAuth');

const logger = new Logger(config.logLevel);

let businessConfig;

try {
  businessConfig = loadBusinessConfig(config.businessConfigPath);
  logger.info('Business configuration loaded', {
    businessName: businessConfig.businessName,
  });
} catch (error) {
  logger.error('Failed to load business configuration. Exiting.', { error });
  process.exit(1);
}

watchBusinessConfig(config.businessConfigPath, (updatedConfig) => {
  businessConfig = updatedConfig;
  logger.info('Business configuration reloaded', {
    businessName: businessConfig.businessName,
  });
});

const twilioService = new TwilioService(config.twilio, logger);
const sheetsService = new GoogleSheetsService(config.googleSheets, logger);
const dashboardAuth = createDashboardAuth(config.dashboard);

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

if (config.env === 'production') {
  app.set('trust proxy', 1);
}

app.use(
  session({
    secret: config.dashboard.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.env === 'production',
      maxAge: 1000 * 60 * 60 * 8,
    },
  }),
);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    business: businessConfig.businessName,
    env: config.env,
  });
});

app.use(
  '/webhook',
  createWebhookRouter({
    getBusinessConfig: () => businessConfig,
    twilioService,
    sheetsService,
    logger,
  }),
);

app.use(
  '/dashboard',
  createDashboardRouter({
    sheetsService,
    auth: dashboardAuth,
    logger,
    defaultLimit: config.dashboard.pageSize,
    envLabel: config.env,
  }),
);

app.get('/', (req, res) => res.redirect('/dashboard'));

app.use(
  // eslint-disable-next-line no-unused-vars
  (err, req, res, next) => {
    logger.error('Unhandled error', { error: err });
    res.status(500).json({ error: 'Internal server error' });
  },
);

app.listen(config.port, () => {
  logger.info(`WhatsApp bot listening on port ${config.port}`);
});
