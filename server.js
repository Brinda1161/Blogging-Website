const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const database = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blogs');
const userRoutes = require('./routes/users');
const reactionRoutes = require('./routes/reactions');

const app = express();

// ✅ Constants
const FRONTEND_URL = process.env.FRONTEND_URL || "https://brinda1161.github.io";
const VERCEL_URL = "https://blogging-website-beige-two.vercel.app";
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
    origin: function(origin, callback) {
        const allowedOrigins = [
            FRONTEND_URL,
            VERCEL_URL,
            "https://brinda1161.github.io",
            "https://brinda1161.github.io/Blogging-Website",
            "http://localhost:3000",
            "http://localhost:5500",
            "http://127.0.0.1:5500"
        ];
        // Allow requests with no origin (mobile apps, curl, etc.)
        // Also allow all vercel.app preview deployments
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Origin', 'x-user-id', 'x-username', 'x-user-role'],
    exposedHeaders: ['Set-Cookie']
}));
app.options('*', cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || "secret-key",
    saveUninitialized: false,
    resave: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        secure: true,
        httpOnly: true,
        sameSite: 'none'
    }
}));

// Debug middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reactions', reactionRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        user: req.session.user ? 'authenticated' : 'anonymous'
    });
});

// Serve specific pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/sign-up', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sign-up.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/reader', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reader.html'));
});

app.get('/user', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'userPage.html'));
});

// ✅ 404 handler for API routes
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API route not found' });
});

// ✅ Frontend 404 handler (must be last)
// app.use((req, res) => {
//     res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
// });

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
async function startServer() {
    try {
        await database.connect();
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📝 Frontend URL: ${FRONTEND_URL}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();