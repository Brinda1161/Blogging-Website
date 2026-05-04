const mongoose = require("mongoose");

class Database {
    constructor() {
        this.MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/blogger-website";
    }

    async connect() {
        try {
            await mongoose.connect(this.MONGODB_URI);

            console.log("✅ Connected to MongoDB");

            await this.initializeDefaultAdmin();
        } catch (err) {
            console.error("❌ MongoDB connection error:", err);
            process.exit(1);
        }
    }

    async initializeDefaultAdmin() {
        const user = require("../models/User");

        const usersCount = await user.countDocuments();
        if (usersCount === 0) {
            await user.create({
                username: "admin",
                password: "admin123",
                email: "admin@blogger.com",
                role: "admin",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                reactions: {}
            });

            console.log("✅ Default admin created");
        }
    }

    async disconnect() {
        await mongoose.disconnect();
        console.log("✅ MongoDB disconnected");
    }
}

module.exports = new Database();
