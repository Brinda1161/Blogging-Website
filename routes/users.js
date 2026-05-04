const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Blog = require('../models/Blog');
const { requireAdmin } = require('../middleware/auth');

// Get all users (admin only)
router.get("/", requireAdmin, async (req, res) => {
    try {
        const users = await User.find().select('_id username role createdAt');

        const sanitizedUsers = users.map(u => ({
            id: u._id.toString(),
            username: u.username,
            role: u.role,
            createdAt: u.createdAt
        }));

        res.json(sanitizedUsers);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Delete user (admin only)
router.delete("/:id", requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;

        if (userId === req.session.user.id) {
            return res.status(400).json({ error: "Cannot delete your own account" });
        }

        await User.findByIdAndDelete(userId);

        // 🔥 THIS IS THE IMPORTANT FIX
        await Blog.deleteMany({ authorId: userId });

        res.json({ success: true });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});


module.exports = router;
