function validateBlog(req, res, next) {
    const { title, content } = req.body;
    
    if (!title || title.trim().length === 0) {
        return res.status(400).json({ error: "Title is required" });
    }
    
    if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Content is required" });
    }
    
    if (title.length > 200) {
        return res.status(400).json({ error: "Title too long" });
    }
    
    next();
}

function validateUser(req, res, next) {
    const { username, password } = req.body;
    
    if (!username || username.trim().length < 3) {
        return res.status(400).json({ error: "Username must be at least 3 characters" });
    }
    
    if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    
    // Basic username validation (alphanumeric and underscores)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({ error: "Username can only contain letters, numbers, and underscores" });
    }
    
    next();
}

module.exports = {
    validateBlog,
    validateUser
};