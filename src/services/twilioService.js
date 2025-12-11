const twilio = require('twilio');

class TwilioService {
  constructor({ accountSid, authToken, whatsappNumber }, logger) {
    this.client = twilio(accountSid, authToken);
    this.whatsappNumber = whatsappNumber;
    this.logger = logger;
  }

  async sendWhatsAppMessage(to, body) {
    if (!to || !body) {
      throw new Error('Missing recipient or message body for WhatsApp reply.');
    }

    const toAddress = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    const response = await this.client.messages.create({
      from: this.whatsappNumber,
      to: toAddress,
      body,
    });

    this.logger?.info('Sent WhatsApp reply', { messageSid: response.sid });

    return response;
  }
}

module.exports = TwilioService;
