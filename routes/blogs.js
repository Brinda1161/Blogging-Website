const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// Utility to generate slug
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);
};

// Get all blogs (public route)
router.get("/", optionalAuth, async (req, res) => {
    try {
        const blogs = await Blog.find({}).sort({ createdAt: -1 });
        res.json(blogs);
    } catch (error) {
        console.error('Get blogs error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get user's blogs
router.get("/my-blogs", requireAuth, async (req, res) => {
    try {
        // Corrected: Use find({ author: id }) instead of non-existent findByAuthor
        const blogs = await Blog.find({ author: req.session.user.id }).sort({ createdAt: -1 });
        res.json(blogs);
    } catch (error) {
        console.error('Get my-blogs error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Create new blog
router.post("/", requireAuth, async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ error: "Title and content required" });
        }

        const newBlog = {
            title,
            content,
            slug: generateSlug(title), // Added required slug
            author: req.session.user.id, // Corrected: Should be ID, not username
            likes: 0,
            dislikes: 0
        };

        const blog = await Blog.create(newBlog);
        res.json({ success: true, blog });
    } catch (error) {
        console.error('Create blog error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Update blog
router.put("/:id", requireAuth, async (req, res) => {
    try {
        const blogId = req.params.id;
        const { title, content } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ error: "Title and content required" });
        }

        const blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({ error: "Blog not found" });
        }

        // Check if user owns the blog or is admin
        if (blog.author.toString() !== req.session.user.id && req.session.user.role !== 'admin') {
            return res.status(403).json({ error: "Access denied" });
        }

        const updates = {
            title,
            content
        };

        await Blog.findByIdAndUpdate(blogId, updates);
        res.json({ success: true, message: "Blog updated successfully" });
    } catch (error) {
        console.error('Update blog error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Delete blog
router.delete("/:id", requireAuth, async (req, res) => {
    try {
        const blogId = req.params.id;
        const blog = await Blog.findById(blogId);

        if (!blog) {
            return res.status(404).json({ error: "Blog not found" });
        }

        // Check if user owns the blog or is admin
        if (blog.author.toString() !== req.session.user.id && req.session.user.role !== 'admin') {
            return res.status(403).json({ error: "Access denied" });
        }

        await Blog.findByIdAndDelete(blogId);
        res.json({ success: true, message: "Blog deleted successfully" });
    } catch (error) {
        console.error('Delete blog error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Search blogs
router.get("/search", async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ error: "Search query required" });
        }

        // Corrected: Use regex search instead of non-existent search method
        const blogs = await Blog.find({
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { content: { $regex: q, $options: 'i' } }
            ]
        });
        res.json(blogs);
    } catch (error) {
        console.error('Search blogs error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;