# WhatsApp Auto-Reply Bot for Small Businesses

A production-ready Node.js/Express server that handles WhatsApp auto-replies using the Twilio WhatsApp Business API and logs every interaction to Google Sheets. Designed for agencies or freelancers that sell "WhatsApp Auto-Reply Bot for Small Businesses — $79 setup + $19/mo maintenance."

## Features
- Twilio WhatsApp webhook for inbound messages
- Template-based replies driven by a per-business JSON config
- Keyword/intent routing (greeting, hours, address, booking, fallback)
- Google Sheets logging (timestamp, customer number, inbound/outbound text, intent)
- Password-protected internal dashboard (server-rendered) with branded login, summary cards, CSV export, auto-refresh controls, and live data from Google Sheets
- Hot-reload of business config without restarting the server
- Health endpoint for uptime checks

## Project Structure
```
.
|-- config/
|   `-- business.json          # Business-specific branding + templates
|-- src/
|   |-- config/
|   |   |-- businessConfig.js
|   |   `-- env.js
|   |-- middleware/
|   |   `-- adminAuth.js       # Basic auth guard for dashboard
|   |-- routes/
|   |   |-- dashboard.js       # Password-protected dashboard
|   |   `-- webhook.js
|   |-- services/
|   |   |-- googleSheetsService.js
|   |   |-- replyService.js
|   |   `-- twilioService.js
|   |-- utils/
|   |   |-- logger.js
|   |   `-- text.js
|   `-- server.js
|-- .env.example
|-- package.json
`-- README.md
```

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Copy env template and set secrets**
   ```bash
   cp .env.example .env
   ```
   Fill in Twilio + Google credentials plus dashboard login/session secrets:
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`
   - `GOOGLE_SHEETS_ID` (from Sheets URL)
   - `GOOGLE_APPLICATION_CREDENTIALS` (path to service-account JSON)
   - `DASHBOARD_USERNAME`, `DASHBOARD_PASSWORD` (used on the login form)
   - `DASHBOARD_SESSION_SECRET` (random string for securing dashboard sessions)

3. **Configure a business**
   - Edit `config/business.json` per client.
   - Update `templates` and `keywordMapping` arrays to match their offerings.
   - Because the file is watched, changes propagate without restarting.

4. **Create Google Service Account & Sheet**
   - In Google Cloud Console enable *Google Sheets API*.
   - Create a service account, download JSON key, save to `config/google-service-account.json` (or another path referenced in `.env`).
   - Share the target Google Sheet with the service account email (Editor role).
   - Optional: Rename the tab to match `GOOGLE_SHEETS_TAB_NAME` (default `Conversations`).

5. **Expose webhook publicly**
   - In development use `ngrok`:
     ```bash
     ngrok http 3000
     ```
   - Configure Twilio WhatsApp sandbox or production number to POST to `https://<public-url>/webhook/whatsapp`.

6. **Run the bot**
   ```bash
   npm run dev    # with nodemon
   # or
   npm start
   ```

## Deployment Notes
- Works on any Node.js 18+ environment (Railway, Render, Fly.io, AWS Lambda w/ adapter, etc.).
- Remember to set the same environment variables in production secrets manager.
- Use HTTPS and optionally restrict the webhook route via Twilio signature validation (future enhancement).
- Set up monitoring for the `/health` endpoint.

## Extending the Bot
- Add more intents/templates by updating `keywordMapping` and `templates` in the config file.
- For capturing richer lead data, extend `googleSheetsService.appendLog` to include extra columns.
- Use the built-in `/dashboard` route as a client-facing view, or customize its HTML/CSS to match branding.
- Add persistence (Redis/Postgres) if you need conversation history beyond Sheets.

## Admin Dashboard
- Visit `https://<your-domain>/dashboard/login`, sign in with the username/password defined in `.env`, and a secure session cookie will be issued (no browser basic-auth prompts). Sessions auto-expire after ~8 hours; use “Sign out” to revoke immediately.
- Once in, the dashboard shows KPIs (records loaded, unique contacts, top intent, intent mix), live search/limit controls, preset quick filters, and auto-refresh options (manual to 10 minutes). Each row includes the inbound/outbound pair plus the detected intent badge.
- Use the CSV export button to download the current view or click “Open Google Sheet” to jump directly into the underlying sheet for deeper edits.
- Data loads directly from the configured Google Sheet, so anything written there (even manually) will appear in the dashboard moments later.

## Testing the Flow
1. Send a WhatsApp message to your Twilio number using keywords like "hi", "hours", or "book".
2. The bot responds with the configured template and logs the interaction into Google Sheets.
3. Check server logs to confirm intents, Twilio message SID, and any errors.

## Production Checklist
- [ ] Verify Twilio number is approved for WhatsApp Business.
- [ ] Confirm Google Sheet logging works (service account email has access).
- [ ] Rotate Twilio + Google secrets regularly.
- [ ] Add monitoring/alerting on webhook failures (5xx responses) and Sheets logging errors.
- [ ] Keep config files versioned per client.

This setup is ready for packaging as a turnkey "WhatsApp Auto-Reply Bot" service. Update the config + `.env` per client, deploy, and you have a repeatable productized offering.
