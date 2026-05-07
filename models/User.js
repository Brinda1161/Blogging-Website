const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    email: {
        type: String,
        trim: true,
        default: null
    },

    role: {
        type: String,
        default: "user",
        enum: ["user", "admin"]
    },

    reactions: {
        type: Map,
        of: String,
        default: {}
    },

    profile: {
        bio: { type: String, default: "" },
        avatar: { type: String, default: null }
    }
}, {
    timestamps: true // createdAt, updatedAt auto
});

module.exports = mongoose.model("User", userSchema);
