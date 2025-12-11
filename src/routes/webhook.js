const express = require('express');
const { getReplyForMessage } = require('../services/replyService');

function createWebhookRouter({ getBusinessConfig, twilioService, sheetsService, logger }) {
  const router = express.Router();

  router.post('/whatsapp', async (req, res) => {
    const { Body, From, Timestamp } = req.body;

    if (!Body || !From) {
      logger?.warn('Invalid payload received from Twilio', { Body, From });
      return res.status(400).json({ error: 'Missing Body or From in Twilio payload.' });
    }

    const businessConfig = getBusinessConfig();
    const reply = getReplyForMessage(Body, businessConfig);

    const logEntry = {
      timestamp: Timestamp || new Date().toISOString(),
      from: From,
      message: Body,
      reply: reply.replyText,
      intent: reply.intent,
    };

    try {
      await twilioService.sendWhatsAppMessage(From, reply.replyText);

      if (sheetsService?.appendLog) {
        await sheetsService.appendLog(logEntry);
      }
      logger?.info('Processed WhatsApp message', {
        intent: reply.intent,
        from: From,
      });
      return res.status(200).json({ status: 'ok' });
    } catch (error) {
      logger?.error('Failed to process WhatsApp message', { error });
      return res.status(500).json({ error: 'Failed to send reply.' });
    }
  });

  return router;
}

module.exports = createWebhookRouter;
