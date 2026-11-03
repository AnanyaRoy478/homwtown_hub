const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const sanitize = require('./middleware/sanitize');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
app.use(cors({ origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(','), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(sanitize);
if (process.env.NODE_ENV !== 'test') app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), { maxAge: '7d' }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many attempts. Try again in a few minutes.' } });
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/communities', require('./routes/communities'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/events', require('./routes/events'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/misc'));

// In production, serve the built React app from the same server.
const dist = path.join(__dirname, '..', '..', 'client', 'dist');
if (process.env.NODE_ENV === 'production' && fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api|uploads).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
