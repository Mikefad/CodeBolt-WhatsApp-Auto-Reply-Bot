const express = require('express');

function escapeHtml(text = '') {
  return text
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderLoginPage({ errorMessage, loggedOut }) {
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>WhatsApp Bot Dashboard • Sign in</title>
      <style>
        body { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; background: radial-gradient(circle at top, #1e3a8a, #0f172a 55%, #020617 100%); color: #f8fafc; display:flex; justify-content:center; align-items:center; min-height:100vh; margin:0; }
        .card { background: rgba(15,23,42,0.75); border: 1px solid rgba(255,255,255,0.08); border-radius: 28px; padding: 40px; width: 100%; max-width: 420px; box-shadow: 0 30px 80px rgba(2,6,23,0.65); backdrop-filter: blur(18px); }
        h1 { margin-top: 0; font-size: 1.8rem; }
        label { display: block; font-weight: 600; margin-bottom: 6px; }
        input { width: 100%; padding: 12px 14px; margin-bottom: 16px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.15); background: rgba(2,6,23,0.7); color: #fff; font-size: 1rem; }
        button { width: 100%; padding: 14px; border: none; border-radius: 999px; background: linear-gradient(135deg, #38bdf8, #2563eb); color: #fff; font-weight: 600; font-size: 1rem; cursor: pointer; box-shadow: 0 20px 45px rgba(37,99,235,0.45); }
        button:hover { opacity: 0.95; }
        .meta { font-size: 0.9rem; opacity: 0.75; margin-bottom: 20px; }
        .alert { padding: 10px 12px; border-radius: 12px; margin-bottom: 16px; font-size: 0.95rem; }
        .alert-error { background: rgba(248,113,113,0.2); color: #fecaca; }
        .alert-success { background: rgba(52,211,153,0.2); color: #bbf7d0; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>WhatsApp Bot Control Room</h1>
        <p class="meta">Secure access • Internal staff only</p>
        ${errorMessage ? `<div class="alert alert-error">${escapeHtml(errorMessage)}</div>` : ''}
        ${loggedOut ? '<div class="alert alert-success">Session closed. See you soon.</div>' : ''}
        <form method="post" action="/dashboard/login">
          <label for="username">Username</label>
          <input type="text" id="username" name="username" autocomplete="username" required />
          <label for="password">Password</label>
          <input type="password" id="password" name="password" autocomplete="current-password" required />
          <button type="submit">Sign in</button>
        </form>
      </div>
    </body>
  </html>`;
}

function renderDashboardPage({
  entries,
  searchTerm,
  limit,
  sheetsEnabled,
  lastRefreshed,
  stats,
  sheetLink,
  user,
  autoRefresh,
  exportUrl,
  envLabel,
  quickFilters,
}) {
  const colorMap = { greeting: 'mint', hours: 'sky', booking: 'orchid', address: 'amber', fallback: 'slate' };

  const rows = entries
    .map((entry) => {
      const intent = entry.intent || 'fallback';
      const pillClass = `pill pill-${colorMap[intent] || 'slate'}`;
      return `
        <tr>
          <td data-label="Timestamp">
            <div class="cell-line">${escapeHtml(entry.timestamp)}</div>
          </td>
          <td data-label="Number">
            <div class="cell-line">${escapeHtml(entry.from)}</div>
          </td>
          <td data-label="Incoming">
            <div class="cell-text">${escapeHtml(entry.message)}</div>
          </td>
          <td data-label="Reply">
            <div class="cell-text">${escapeHtml(entry.reply)}</div>
          </td>
          <td data-label="Intent"><span class="${pillClass}">${escapeHtml(intent)}</span></td>
        </tr>
      `;
    })
    .join('');

  const emptyState =
    entries.length === 0
      ? '<tr><td colspan="5" class="empty">No data to display. Try expanding the date range or remove filters.</td></tr>'
      : '';

  const autoRefreshOptions = [0, 30, 60, 120, 300, 600];
  const intentRanking = Object.entries(stats.intents).sort((a, b) => b[1] - a[1]);
  const intentCards = intentRanking.length
    ? intentRanking
        .slice(0, 4)
        .map(([intent, count]) => {
          const percent = stats.total ? Math.round((count / stats.total) * 100) : 0;
          return `
            <div class="intent-row">
              <div class="intent-info">
                <span>${escapeHtml(intent)}</span>
                <small>${count} msg</small>
              </div>
              <div class="intent-progress">
                <div style="width:${percent}%"></div>
              </div>
            </div>`;
        })
        .join('')
    : '<div class="intent-row">No intents recorded</div>';

  const quickFilterButtons = quickFilters
    .map((filter) => `<button type="button" class="chip" data-query="${escapeHtml(filter.query)}">${escapeHtml(filter.label)}</button>`)
    .join('');

  const timelineCards = entries
    .slice(0, 6)
    .map((entry) => {
      const intent = entry.intent || 'fallback';
      return `
        <div class="timeline-card">
          <div class="timeline-time">${escapeHtml(entry.timestamp)}</div>
          <div class="timeline-body">
            <div class="timeline-pill">${escapeHtml(intent)}</div>
            <div class="timeline-number">${escapeHtml(entry.from)}</div>
            <p>${escapeHtml(entry.message || '')}</p>
            <div class="timeline-reply">${escapeHtml(entry.reply || '')}</div>
          </div>
        </div>
      `;
    })
    .join('');

  const latestEntry =
    entries[0] || {
      timestamp: 'No data yet',
      from: 'Awaiting activity',
      message: 'Send a message to see a snapshot here.',
      reply: 'Bot replies will be summarized in this panel.',
      intent: 'n/a',
    };

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>WhatsApp Bot Dashboard</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        :root { --nav-width: 280px; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Space Grotesk', 'Inter', sans-serif; background: #000814; color: #e2e8f0; overflow: hidden; }
        .layout { display: flex; min-height: 100vh; }
        nav {
          width: var(--nav-width);
          padding: 32px 28px;
          border-right: 1px solid rgba(255,255,255,0.08);
          background: radial-gradient(circle at top, rgba(14,116,144,0.4), rgba(2,6,23,0.95));
          backdrop-filter: blur(18px);
          display: flex;
          flex-direction: column;
          gap: 28px;
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
        }
        .scroll-region {
          margin-left: var(--nav-width);
          flex: 1;
          height: 100vh;
          overflow-y: auto;
          background: linear-gradient(160deg, #020617 0%, #0f172a 40%, #020617 100%);
        }
        nav h2 { margin: 0; font-size: 1rem; letter-spacing: 0.24em; text-transform: uppercase; color: #94a3b8; }
        nav .logo { font-size: 1.6rem; font-weight: 600; }
        nav ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
        nav li a { display: block; text-decoration: none; color: rgba(255,255,255,0.7); padding: 12px 14px; border-radius: 12px; font-weight: 500; transition: background 0.2s ease; }
        nav li a.active, nav li a:hover { background: rgba(96,165,250,0.15); color: #fff; }
        main { padding: 32px 48px 48px; display: flex; flex-direction: column; gap: 28px; min-height: 100%; }
        header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
        header h1 { margin: 0; font-size: 2rem; }
        header .meta { color: #94a3b8; font-size: 0.95rem; }
        .hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .btn { border: none; border-radius: 12px; padding: 12px 18px; font-weight: 600; cursor: pointer; font-size: 0.95rem; }
        .btn-primary { background: linear-gradient(135deg, #38bdf8, #2563eb); color: #fff; box-shadow: 0 15px 35px rgba(37,99,235,0.35); }
        .btn-outline { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); color: #cbd5f5; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; min-width: 130px; }
        .btn-outline:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.2); color: #fff; }
        .surface { background: rgba(2,6,23,0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 24px; box-shadow: 0 25px 70px rgba(2,6,23,0.65); }
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap: 18px; }
        .kpi-card { padding: 16px; border-radius: 20px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); }
        .kpi-card h3 { margin: 0; font-size: 0.85rem; color: #94a3b8; letter-spacing: 0.12em; text-transform: uppercase; }
        .kpi-card strong { display: block; font-size: 2rem; margin: 8px 0; color: #f8fafc; }
        .intent-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)); gap: 14px; }
        .intent-row { padding: 14px; border-radius: 16px; background: rgba(148,163,184,0.08); display: flex; flex-direction: column; gap: 8px; }
        .intent-info { display: flex; justify-content: space-between; font-weight: 600; }
        .intent-info small { color: #94a3b8; font-weight: normal; }
        .intent-progress { width: 100%; height: 6px; border-radius: 999px; background: rgba(148,163,184,0.2); overflow: hidden; }
        .intent-progress div { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #38bdf8, #6366f1); }
        form.filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)); gap: 14px; margin-top: 18px; }
        form.filters input, form.filters select { padding: 12px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.2); background: rgba(15,23,42,0.65); color: #f8fafc; }
        form.filters button { padding: 12px; border-radius: 14px; border: none; background: #2563eb; color: #fff; font-weight: 600; cursor:pointer; }
        .chips { margin-top: 14px; display: flex; flex-wrap: wrap; gap: 10px; }
        .chip { border: none; border-radius: 999px; padding: 6px 16px; background: rgba(96,165,250,0.12); color: #93c5fd; cursor: pointer; }
        .quick-actions { margin-top: 16px; display: flex; gap: 12px; flex-wrap: wrap; }
        .qa-btn { border: 1px solid rgba(96,165,250,0.4); background: rgba(96,165,250,0.12); color: #93c5fd; border-radius: 999px; padding: 8px 16px; font-weight: 600; cursor: pointer; }
        .qa-btn:hover { background: rgba(96,165,250,0.2); }
        .insights-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
        .summary-card { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap: 18px; }
        .summary-panel { border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 18px; background: rgba(2,6,23,0.6); }
        .summary-panel h3 { margin: 0 0 6px; font-size: 0.95rem; color: #94a3b8; letter-spacing: 0.08em; text-transform: uppercase; }
        .summary-panel p { margin: 2px 0; color: #f8fafc; }
        .summary-panel strong { font-size: 1.05rem; }
        .summary-meta { color: #94a3b8; font-size: 0.85rem; }
        .summary-card { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap: 18px; }
        .summary-panel { border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 18px; background: rgba(2,6,23,0.6); }
        .summary-panel h3 { margin: 0 0 6px; font-size: 0.95rem; color: #94a3b8; letter-spacing: 0.08em; text-transform: uppercase; }
        .summary-panel p { margin: 2px 0; color: #f8fafc; }
        .summary-panel strong { font-size: 1.05rem; }
        .summary-meta { color: #94a3b8; font-size: 0.85rem; }
        .table-wrapper { overflow-x: hidden; border-radius: 20px; }
        table { width: 100%; border-collapse: collapse; background: rgba(2,6,23,0.85); border-radius: 18px; table-layout: fixed; }
        th, td { padding: 16px; border-bottom: 1px solid rgba(148,163,184,0.15); text-align: left; font-size: 0.95rem; vertical-align: top; }
        th { background: rgba(15,23,42,0.8); color: #94a3b8; font-size: 0.8rem; letter-spacing: 0.12em; text-transform: uppercase; }
        th:nth-child(1), td:nth-child(1) { width: 18%; }
        th:nth-child(2), td:nth-child(2) { width: 18%; }
        th:nth-child(3), td:nth-child(3) { width: 22%; }
        th:nth-child(4), td:nth-child(4) { width: 28%; }
        th:nth-child(5), td:nth-child(5) { width: 14%; }
        .cell-line { white-space: normal; word-break: break-word; }
        .cell-text { white-space: normal; line-height: 1.35; max-width: 240px; word-break: break-word; }
        tbody tr:hover { background: rgba(96,165,250,0.08); }
        .empty { text-align: center; padding: 24px; color: #94a3b8; }
        .pill { padding: 6px 12px; border-radius: 999px; font-size: 0.85rem; text-transform: capitalize; }
        .pill-mint { background: rgba(16,185,129,0.2); color: #6ee7b7; }
        .pill-sky { background: rgba(14,165,233,0.2); color: #bae6fd; }
        .pill-orchid { background: rgba(192,132,252,0.2); color: #f3e8ff; }
        .pill-amber { background: rgba(251,191,36,0.2); color: #fed7aa; }
        .pill-slate { background: rgba(148,163,184,0.2); color: #cbd5f5; }
        .timeline { background: rgba(2,6,23,0.9); border-radius: 20px; padding: 20px; border: 1px solid rgba(148,163,184,0.2); max-height: 560px; overflow-y: auto; }
        .timeline-card { border-left: 3px solid rgba(96,165,250,0.5); padding-left: 16px; margin-bottom: 18px; }
        .timeline-time { color: #94a3b8; font-size: 0.8rem; }
        .timeline-pill { background: rgba(79,70,229,0.2); color: #c7d2fe; border-radius: 999px; padding: 4px 10px; display: inline-block; margin: 6px 0; font-size: 0.75rem; letter-spacing: 0.08em; }
        .timeline-number { font-weight: 600; color: #f8fafc; }
        .timeline-reply { margin-top: 8px; font-size: 0.85rem; color: #bae6fd; }
        footer { text-align: center; color: #475569; font-size: 0.85rem; }
        @media (max-width: 1100px) {
          nav { position: static; width: 100%; border-right: none; border-bottom: 1px solid rgba(255,255,255,0.08); }
          .scroll-region { margin-left: 0; }
          .layout { flex-direction: column; }
          main { padding: 28px; }
          .insights-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .table-wrapper { overflow-x: auto; }
          table, thead, tbody, th, td, tr { display: block; }
          th { display: none; }
          td { position: relative; padding-left: 50%; border-bottom: 1px solid rgba(148,163,184,0.2); }
          td::before { position: absolute; left: 16px; top: 16px; font-weight: 600; color: #94a3b8; text-transform: uppercase; font-size: 0.75rem; }
          td[data-label="Timestamp"]::before { content: 'Timestamp'; }
          td[data-label="Number"]::before { content: 'Number'; }
          td[data-label="Incoming"]::before { content: 'Incoming'; }
          td[data-label="Reply"]::before { content: 'Reply'; }
          td[data-label="Intent"]::before { content: 'Intent'; }
        }
      </style>
    </head>
    <body>
      <div class="layout">
        <nav>
          <div>
            <div class="logo">CodeBolt</div>
            <h2>Automation Suite</h2>
          </div>
          <ul>
            <li><a href="#" class="active">WhatsApp Bot</a></li>
            <li><a href="#">Leads</a></li>
            <li><a href="#">Broadcasts</a></li>
          </ul>
          <div style="margin-top:auto; font-size:0.85rem; color:#94a3b8;">
            Environment: ${escapeHtml(envLabel)}<br />
            Signed in as ${escapeHtml(user || 'admin')}
          </div>
        </nav>
        <div class="scroll-region">
          <main>
            <header>
              <div>
                <h1>Conversation Intelligence</h1>
                <div class="meta">${escapeHtml(
                  sheetsEnabled ? 'Live sync with Google Sheets' : 'Sheets disabled',
                )} • Last refreshed ${escapeHtml(lastRefreshed)}</div>
              </div>
              <div class="hero-actions">
                ${sheetLink ? `<a class="btn btn-outline" href="${escapeHtml(sheetLink)}" target="_blank">Open Sheet</a>` : ''}
                <a class="btn btn-outline" href="${escapeHtml(exportUrl)}">Export CSV</a>
                <form method="post" action="/dashboard/logout">
                  <button class="btn btn-primary" type="submit">Sign out</button>
                </form>
              </div>
            </header>
            <section class="surface kpi-grid">
              <div class="kpi-card">
                <h3>Records loaded</h3>
                <strong>${stats.total}</strong>
                <span>Across filters</span>
              </div>
              <div class="kpi-card">
                <h3>Unique contacts</h3>
                <strong>${stats.uniqueContacts}</strong>
                <span>Latest ${limit} messages</span>
              </div>
              <div class="kpi-card">
                <h3>Top intent</h3>
                <strong>${escapeHtml(stats.topIntent || 'N/A')}</strong>
                <span>Last message ${escapeHtml(stats.lastMessageAt || 'N/A')}</span>
              </div>
              <div class="kpi-card">
                <h3>Auto refresh</h3>
                <strong>${autoRefresh ? `${autoRefresh}s` : 'Manual'}</strong>
                <span>Update cadence</span>
              </div>
            </section>
            <section class="surface">
              <h2 style="margin-top:0;">Intent mix</h2>
              <div class="intent-grid">${intentCards}</div>
            <form class="filters" method="get">
              <input type="search" name="q" placeholder="Search by phone, keyword, intent..." value="${escapeHtml(searchTerm)}" />
              <input type="number" min="1" max="500" name="limit" value="${limit}" />
              <select name="autoRefresh">
                ${autoRefreshOptions
                    .map(
                      (seconds) =>
                        `<option value="${seconds}" ${seconds === autoRefresh ? 'selected' : ''}>${
                          seconds === 0 ? 'Manual refresh' : `Refresh every ${seconds}s`
                        }</option>`,
                    )
                    .join('')}
                </select>
                <button type="submit">Apply Filters</button>
                <a href="/dashboard" style="align-self:center;color:#60a5fa;font-weight:600;text-decoration:none;">Reset</a>
            </form>
            <div class="chips">${quickFilterButtons}</div>
            <div class="quick-actions">
              <button type="button" class="qa-btn" onclick="window.location.reload()">Refresh data</button>
              ${
                sheetLink
                  ? `<button type="button" class="qa-btn" onclick="window.open('${escapeHtml(sheetLink)}','_blank')">Open sheet</button>`
                  : ''
              }
              <button type="button" class="qa-btn" onclick="document.getElementById('conversation-table').scrollIntoView({behavior:'smooth'})">Jump to table</button>
            </div>
          </section>
          <section class="insights-grid">
            <div class="surface">
              <h2 style="margin-top:0;">Latest conversation snapshot</h2>
              <div class="summary-card">
                <div class="summary-panel">
                  <h3>Contact</h3>
                  <strong>${escapeHtml(latestEntry.from)}</strong>
                  <p class="summary-meta">${escapeHtml(latestEntry.timestamp)}</p>
                </div>
                <div class="summary-panel">
                  <h3>Intent</h3>
                  <strong>${escapeHtml(latestEntry.intent || 'n/a')}</strong>
                  <p class="summary-meta">Detected by keyword rules</p>
                </div>
                <div class="summary-panel">
                  <h3>Incoming</h3>
                  <p>${escapeHtml(latestEntry.message)}</p>
                </div>
                <div class="summary-panel">
                  <h3>Reply sent</h3>
                  <p>${escapeHtml(latestEntry.reply)}</p>
                </div>
              </div>
            </div>
            <div class="timeline surface">
              <h3>Live highlights</h3>
              ${timelineCards || '<p style="color:#94a3b8;">No recent conversations.</p>'}
            </div>
          </section>
          <section class="surface" id="conversation-table">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <h2 style="margin:0;">Conversation table</h2>
              <span style="color:#94a3b8;font-size:0.9rem;">Showing ${entries.length} rows</span>
            </div>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Number</th>
                    <th>Incoming</th>
                    <th>Reply</th>
                    <th>Intent</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows || emptyState}
                </tbody>
              </table>
            </div>
          </section>
            <footer>WhatsApp Auto-Reply Bot • Powered by CodeBolt • Data sourced from Google Sheets in real time.</footer>
          </main>
        </div>
      </div>
      <script>
        (function() {
          const chips = Array.from(document.querySelectorAll('.chip'));
          const searchInput = document.querySelector('input[name="q"]');
          chips.forEach((chip) => {
            chip.addEventListener('click', () => {
              const query = chip.getAttribute('data-query');
              if (searchInput) {
                searchInput.value = query;
                searchInput.closest('form').submit();
              }
            });
          });
          const refreshSeconds = ${autoRefresh};
          if (refreshSeconds > 0) {
            setTimeout(() => window.location.reload(), refreshSeconds * 1000);
          }
        })();
      </script>
    </body>
  </html>`;
}

function createDashboardRouter({ sheetsService, auth, logger, defaultLimit, envLabel }) {
  const router = express.Router();
  const quickFilters = [
    { label: 'Greetings intent', query: 'greeting' },
    { label: 'Booking intent', query: 'booking' },
    { label: 'Hours intent', query: 'hours' },
    { label: 'Address intent', query: 'address' },
    { label: 'Fallback leads', query: 'fallback' },
    { label: 'Nigeria leads', query: '+234' },
  ];

  function parseFilters(req) {
    const searchTerm = req.query.q ? String(req.query.q) : '';
    const limitParam = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 500) : defaultLimit;
    const autoRefreshParam = parseInt(req.query.autoRefresh, 10);
    const autoRefresh =
      Number.isFinite(autoRefreshParam) && autoRefreshParam >= 0 ? Math.min(autoRefreshParam, 600) : 0;

    return { searchTerm, limit, autoRefresh };
  }

  router.get('/login', (req, res) => {
    if (!auth) {
      return res.status(503).send('Dashboard unavailable: credentials not configured.');
    }

    if (req.session?.isDashboardUser) {
      return res.redirect('/dashboard');
    }

    return res.send(
      renderLoginPage({
        errorMessage: req.query.error ? 'Invalid username or password.' : '',
        loggedOut: Boolean(req.query.loggedOut),
      }),
    );
  });

  router.post('/login', (req, res) => {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.redirect('/dashboard/login?error=1');
    }

    if (!auth.authenticate(username, password)) {
      return res.redirect('/dashboard/login?error=1');
    }

    req.session.isDashboardUser = true;
    req.session.user = username;
    return res.redirect('/dashboard');
  });

  router.post('/logout', auth.requireAuth, (req, res) => {
    req.session.destroy(() => {
      res.redirect('/dashboard/login?loggedOut=1');
    });
  });

  router.get('/', auth.requireAuth, async (req, res) => {
    const { searchTerm, limit, autoRefresh } = parseFilters(req);

    if (!sheetsService.enabled) {
      return res.status(503).send(
        renderDashboardPage({
          entries: [],
          searchTerm,
          limit,
          sheetsEnabled: false,
          lastRefreshed: new Date().toLocaleString(),
          stats: { total: 0, uniqueContacts: 0, intents: {} },
          sheetLink: null,
          user: req.session.user,
          autoRefresh,
          exportUrl: '#',
          envLabel: envLabel || 'development',
          quickFilters,
        }),
      );
    }

    try {
      const entries = await sheetsService.fetchLogs({ limit, searchTerm });
      const stats = {
        total: entries.length,
        uniqueContacts: new Set(entries.map((entry) => entry.from)).size,
        intents: entries.reduce((acc, entry) => {
          const intent = entry.intent || 'fallback';
          acc[intent] = (acc[intent] || 0) + 1;
          return acc;
        }, {}),
        topIntent: null,
        lastMessageAt: entries[0]?.timestamp || null,
      };

      const sortedIntents = Object.entries(stats.intents).sort((a, b) => b[1] - a[1]);
      stats.topIntent = sortedIntents[0]?.[0] || 'N/A';
      stats.lastMessageAt = entries[0]?.timestamp || 'N/A';

      const query = new URLSearchParams();
      if (searchTerm) query.set('q', searchTerm);
      query.set('limit', String(limit));
      if (autoRefresh) query.set('autoRefresh', String(autoRefresh));
      const exportUrlComputed = `/dashboard/export.csv?${query.toString()}`;

      const sheetLink = sheetsService.spreadsheetId
        ? `https://docs.google.com/spreadsheets/d/${sheetsService.spreadsheetId}/edit`
        : null;

      return res.send(
        renderDashboardPage({
          entries,
          searchTerm,
          limit,
          sheetsEnabled: true,
          lastRefreshed: new Date().toLocaleString(),
          stats,
          sheetLink,
          user: req.session.user,
          autoRefresh,
          exportUrl: exportUrlComputed,
          envLabel: envLabel || 'development',
          quickFilters,
        }),
      );
    } catch (error) {
      logger?.error('Failed to render dashboard', { error });
      return res.status(500).send('Failed to load dashboard data. Check server logs for details.');
    }
  });

  router.get('/export.csv', auth.requireAuth, async (req, res) => {
    const { searchTerm, limit } = parseFilters(req);

    if (!sheetsService.enabled) {
      return res.status(503).send('Export unavailable: Google Sheets is disabled.');
    }

    try {
      const entries = await sheetsService.fetchLogs({ limit, searchTerm });
      const rows = [
        ['Timestamp', 'Number', 'Incoming', 'Reply', 'Intent'],
        ...entries.map((entry) => [entry.timestamp, entry.from, entry.message, entry.reply, entry.intent]),
      ];

      const csv = rows
        .map((row) => row.map((value) => `"${String(value || '').replace(/"/g, '""')}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="whatsapp-conversations.csv"');
      return res.send(csv);
    } catch (error) {
      logger?.error('Failed to export dashboard data', { error });
      return res.status(500).send('Failed to export data. Check server logs for details.');
    }
  });

  return router;
}

module.exports = createDashboardRouter;
