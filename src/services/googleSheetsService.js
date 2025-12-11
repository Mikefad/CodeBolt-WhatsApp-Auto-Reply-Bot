const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const SHEETS_SCOPE = ['https://www.googleapis.com/auth/spreadsheets'];

class GoogleSheetsService {
  constructor(config, logger) {
    this.spreadsheetId = config?.spreadsheetId;
    this.credentialsPath = config?.credentialsPath;
    this.tabName = config?.tabName || 'Conversations';
    this.logger = logger;

    this.enabled = Boolean(this.spreadsheetId && this.credentialsPath);

    if (!this.enabled) {
      this.logger?.warn('Google Sheets logging is disabled: missing Sheet ID or credentials path.');
      return;
    }

    this.initClient();
  }

  initClient() {
    const resolvedPath = path.isAbsolute(this.credentialsPath)
      ? this.credentialsPath
      : path.join(process.cwd(), this.credentialsPath);

    if (!fs.existsSync(resolvedPath)) {
      this.logger?.warn('Google credentials file not found; Sheets logging disabled.', {
        resolvedPath,
      });
      this.enabled = false;
      return;
    }

    this.auth = new google.auth.GoogleAuth({
      keyFile: resolvedPath,
      scopes: SHEETS_SCOPE,
    });

    this.sheets = google.sheets({
      version: 'v4',
      auth: this.auth,
    });
  }

  async appendLog(entry) {
    if (!this.enabled) {
      return;
    }

    const values = [[entry.timestamp, entry.from, entry.message, entry.reply, entry.intent]];

    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.tabName}!A:E`,
        valueInputOption: 'RAW',
        requestBody: { values },
      });
    } catch (error) {
      this.logger?.error('Failed to log conversation to Google Sheets', { error });
    }
  }

  async fetchLogs({ limit = 100, searchTerm } = {}) {
    if (!this.enabled) {
      throw new Error('Google Sheets integration is disabled.');
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.tabName}!A:E`,
      });

      const rows = response.data.values || [];
      const [, ...data] = rows;

      const formatted = data.map((row) => ({
        timestamp: row[0] || '',
        from: row[1] || '',
        message: row[2] || '',
        reply: row[3] || '',
        intent: row[4] || '',
      }));

      let filtered = formatted;
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        filtered = formatted.filter((entry) =>
          Object.values(entry).some((value) =>
            String(value).toLowerCase().includes(query),
          ),
        );
      }

      const sanitizedLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 500) : 100;
      return filtered.slice(-sanitizedLimit).reverse();
    } catch (error) {
      this.logger?.error('Failed to fetch conversation logs from Google Sheets', { error });
      throw error;
    }
  }
}

module.exports = GoogleSheetsService;
