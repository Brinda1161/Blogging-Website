const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

router.post("/blogs/:id/reaction", requireAuth, async (req, res) => {
    try {
        const blogId = req.params.id;
        const { reaction } = req.body;

        const blog = await Blog.findById(blogId);
        const user = await User.findById(req.session.user.id);

        if (!blog || !user) {
            return res.status(404).json({ error: "Not found" });
        }

        // Initialize reactions if they don't exist
        if (!user.reactions) user.reactions = new Map();
        if (typeof blog.likes !== 'number') blog.likes = 0;
        if (typeof blog.dislikes !== 'number') blog.dislikes = 0;

        const prevReaction = user.reactions.get(blogId);

        // Remove previous reaction
        if (prevReaction === 'like') blog.likes--;
        else if (prevReaction === 'dislike') blog.dislikes--;

        // Apply new reaction
        if (reaction === 'like') blog.likes++;
        else if (reaction === 'dislike') blog.dislikes++;
        
        // Update user's reaction record
        if (reaction === 'remove') {
            user.reactions.delete(blogId);
        } else {
            user.reactions.set(blogId, reaction);
        }

        // Update database using correct Mongoose methods
        await Blog.findByIdAndUpdate(blogId, {
            likes: Math.max(0, blog.likes),
            dislikes: Math.max(0, blog.dislikes)
        });

        await User.findByIdAndUpdate(req.session.user.id, {
            reactions: user.reactions
        });

        res.json({ 
            success: true, 
            likes: Math.max(0, blog.likes), 
            dislikes: Math.max(0, blog.dislikes), 
            userReaction: user.reactions.get(blogId) || null 
        });
    } catch (error) {
        console.error('Reaction error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;