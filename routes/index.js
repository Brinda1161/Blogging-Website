const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const blogRoutes = require('./blogs');
const userRoutes = require('./users');
const reactionRoutes = require('./reactions');

// Mount routes
router.use('/auth', authRoutes);
router.use('/blogs', blogRoutes);
router.use('/users', userRoutes);
router.use('/reactions', reactionRoutes);

module.exports = router;