const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

// POST /api/reactions/blogs/:id/reaction
router.post("/blogs/:id/reaction", requireAuth, async (req, res) => {
    try {
        const blogId = req.params.id;
        const { reaction } = req.body;
        const userId = req.session.user.id;

        console.log(`🔵 Reaction Request: User ${userId} -> Blog ${blogId} -> ${reaction}`);

        // Validate reaction type
        const validReactions = ['like', 'dislike', 'remove'];
        if (!validReactions.includes(reaction)) {
            return res.status(400).json({ 
                error: "Invalid reaction type. Must be 'like', 'dislike', or 'remove'" 
            });
        }

        // Find blog and user
        const blog = await Blog.findById(blogId);
        const user = await User.findById(userId);

        if (!blog) {
            return res.status(404).json({ error: "Blog not found" });
        }
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Initialize if not exists
        if (!user.reactions) user.reactions = {};
        if (typeof blog.likes !== 'number') blog.likes = 0;
        if (typeof blog.dislikes !== 'number') blog.dislikes = 0;

        const prevReaction = user.reactions[blogId] || null;

        console.log(`Previous reaction: ${prevReaction}`);
        console.log(`Before - Likes: ${blog.likes}, Dislikes: ${blog.dislikes}`);

        // Remove previous reaction
        if (prevReaction === 'like') {
            blog.likes = Math.max(0, blog.likes - 1);
        } else if (prevReaction === 'dislike') {
            blog.dislikes = Math.max(0, blog.dislikes - 1);
        }

        // Apply new reaction
        if (reaction === 'like') {
            blog.likes += 1;
        } else if (reaction === 'dislike') {
            blog.dislikes += 1;
        }
        
        // Update user's reaction record
        if (reaction === 'remove') {
            delete user.reactions[blogId];
        } else {
            user.reactions[blogId] = reaction;
        }

        console.log(`After - Likes: ${blog.likes}, Dislikes: ${blog.dislikes}`);
        console.log(`User reaction stored: ${user.reactions[blogId] || 'none'}`);

        // Update blog in database
        const updatedBlog = await Blog.findByIdAndUpdate(
            blogId,
            {
                likes: blog.likes,
                dislikes: blog.dislikes
            },
            { new: true }
        );

        // Update user's reactions in database
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { reactions: user.reactions },
            { new: true }
        );

        if (!updatedBlog || !updatedUser) {
            throw new Error('Failed to update database');
        }

        console.log(`✅ Reaction successful for blog ${blogId}`);

        res.json({ 
            success: true, 
            likes: blog.likes, 
            dislikes: blog.dislikes, 
            userReaction: user.reactions[blogId] || null 
        });

    } catch (error) {
        console.error('❌ Reaction error:', error);
        res.status(500).json({ 
            error: "Internal server error",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /api/reactions/blogs/:id - Get reaction counts for a blog
router.get("/blogs/:id", async (req, res) => {
    try {
        const blogId = req.params.id;
        const blog = await Blog.findById(blogId);

        if (!blog) {
            return res.status(404).json({ error: "Blog not found" });
        }

        let userReaction = null;
        
        // Check if user is logged in and has a reaction
        if (req.session.user) {
            const user = await User.findById(req.session.user.id);
            if (user && user.reactions && user.reactions[blogId]) {
                userReaction = user.reactions[blogId];
            }
        }

        res.json({
            success: true,
            likes: blog.likes || 0,
            dislikes: blog.dislikes || 0,
            userReaction
            
        });

    } catch (error) {
        console.error('Get reactions error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;