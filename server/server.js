require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// Removed express-mongo-sanitize (Express 5 incompat: tries to reassign req.query)
// Removed xss-clean (Express 5 incompat: mutates req.query reference)
const hpp = require('hpp');
const morgan = require('morgan');
const compression = require('compression');
const connectDB = require('./config/database');

// Route imports
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const discussionRoutes = require('./routes/discussionRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const certificateRoutes = require('./routes/certificateRoutes');

const app = express();

// Connect to database
connectDB();

// Trust proxy (needed for correct secure cookies behind proxies like Nginx)
app.set('trust proxy', 1);

// Middleware
// CORS: support multiple origins via env ALLOWED_ORIGINS (comma-separated)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

// Basic security headers
app.use(helmet());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsers - reduce limits
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Sanitization & protections
// Custom in-place sanitizer to avoid mutating req.query reference in Express 5
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
      continue;
    }
    const val = obj[key];
    if (val && typeof val === 'object') sanitizeObject(val);
  }
}

app.use((req, res, next) => {
  try {
    if (req.body) sanitizeObject(req.body);
    if (req.params) sanitizeObject(req.params);
    if (req.query) sanitizeObject(req.query);
  } catch (e) {
    console.error('Sanitization error:', e.message);
  }
  next();
});
// xss-clean removed; rely on helmet + custom sanitizer. For rich text inputs, sanitize at field level.
app.use(hpp());

// Compression
app.use(compression());

// Rate limiting (per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP
});
app.use('/api', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/certificates', certificateRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    const status = err.status || 500;
    res.status(status).json({ message: err.message || 'Something went wrong!' });
});

// 404 handler (Express 5 + path-to-regexp v6 doesn't accept bare "*")
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});