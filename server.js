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
const FRONTEND_URL = process.env.FRONTEND_URL || "https://bri1977.github.io/Blogger-Website";
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
    origin: [FRONTEND_URL, "http://localhost:3000"],
    credentials: true
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || "secret-key",
    saveUninitialized: false,
    resave: false,
    cookie: { 
        maxAge: 1000 * 60 * 60 * 24,
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true
    }
}));

// Routes (direct mounting without the router index file for now)
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

// Serve HTML pages
const servePage = (page) => (req, res) => {
    res.sendFile(path.join(__dirname, 'public', page));
};

app.get('/', servePage('index.html'));
app.get('/login', servePage('login.html'));
app.get('/sign-up', servePage('sign-up.html'));
app.get('/dashboard', servePage('dashboard.html'));
app.get('/admin', servePage('admin.html'));
app.get('/reader', servePage('reader.html'));
app.get('/user', servePage('userPage.html'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler for API routes
// 404 for API routes
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API route not found' });
});

// HTML catch-all for frontend routes (SPA)
app.get('/', (req, res) => {
    // if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await database.disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await database.disconnect();
    process.exit(0);
});

startServer();