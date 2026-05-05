const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// Get all blogs
router.get("/", optionalAuth, async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// Get user's blogs
router.get("/my-blogs", requireAuth, async (req, res) => {
    try {
        const blogs = await Blog.find({ authorId: req.session.user.id }).sort({ createdAt: -1 });
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// Create blog
router.post("/", requireAuth, async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) return res.status(400).json({ error: "Title and content required" });

        const newBlog = new Blog({
            title,
            content,
            author: req.session.user.username,
            authorId: new mongoose.Types.ObjectId(req.session.user.id),
            likes: 0,
            dislikes: 0
        });

        await newBlog.save();
        res.status(201).json({ success: true, blog: newBlog });
    } catch (error) {
        console.error('Create blog error:', error);
        res.status(500).json({ error: "Server error", details: error.message });
    }
});

// Update blog
router.put("/:id", requireAuth, async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) return res.status(400).json({ error: "Title and content required" });

        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ error: "Blog not found" });

        if (blog.authorId.toString() !== req.session.user.id && req.session.user.role !== 'admin') {
            return res.status(403).json({ error: "Access denied" });
        }

        blog.title = title;
        blog.content = content;
        await blog.save();
        
        res.json(blog);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// Delete blog
router.delete("/:id", requireAuth, async (req, res) => {
    try {
        const blogId = req.params.id;
        let deletedBlog;

        if (req.session.user.role === 'admin') {
            deletedBlog = await Blog.findByIdAndDelete(blogId);
        } else {
            deletedBlog = await Blog.findOneAndDelete({
                _id: blogId,
                authorId: req.session.user.id
            });
        }

        if (!deletedBlog) return res.status(404).json({ error: "Blog not found" });
        res.json({ message: "Blog deleted" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// Search blogs
router.get("/search", async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ error: "Search query required" });

        const blogs = await Blog.find({
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { content: { $regex: q, $options: 'i' } }
            ]
        }).sort({ createdAt: -1 });
        
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;