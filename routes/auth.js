const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post("/sign-up", async (req, res) => {
    try {
        const { username, password, email } = req.body;
        
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(409).json({ error: "User already exists" });
        }

        // Check if this is the first user
        const userCount = await User.countDocuments();
        const isFirstUser = userCount === 0;

        const newUser = {
            username,
            password,
            email: email || null,
            role: isFirstUser ? "admin" : "user", // First user becomes admin
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            reactions: {},
            profile: {
                bio: "",
                avatar: null
            }
        };

        const user = await User.create(newUser);

        res.json({ 
            success: true, 
            message: isFirstUser ? "Admin user created successfully" : "User created successfully",
            userId: user._id.toString(),
            role: user.role
        });
    } catch (error) {
        console.error('Sign-up error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/login", async (req, res) => {
    try {
        console.log(req.body)
        const { username, password } = req.body;

        const user = await User.findOne({ username });

        if (!user || user.password !== password) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        req.session.user = {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            role: user.role,
            loginTime: new Date().toLocaleString()
        };

        console.log('✅ Login successful for user:', req.session.user); // Debug log

        res.json({ 
            success: true, 
            message: "Login successful",
            user: req.session.user
            // Remove the redirect property - let frontend handle it
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});


router.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "Could not log out" });
        }
        res.json({ success: true, message: "Logged out successfully" });
    });
});


router.get("/session", (req, res) => {
    if (!req.session.user) {
        return res.json({ authenticated: false });
    }

    res.json({ 
        authenticated: true, 
        user: req.session.user 
    });
});

module.exports = router;
