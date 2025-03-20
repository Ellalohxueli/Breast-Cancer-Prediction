import mongoose from "mongoose";

mongoose.models = {};

const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true,
    },
    lastname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: Number,
        required: true,
    },
    sex: {
        type: String,
        required: true,
        enum: ['male', 'female', 'prefer_not_to_say'],
    },
    dob: {
        type: Date,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
        default: 'user', // This sets the default role to 'user'
        enum: ['user', 'admin', 'doctor'] // These are the allowed roles
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

// Update the timestamps before saving
userSchema.pre('save', function(next) {
    const malaysiaOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    this.updatedAt = new Date(this.updatedAt.getTime() + malaysiaOffset);
    if (this.isNew) {
        this.createdAt = new Date(this.createdAt.getTime() + malaysiaOffset);
    }
    next();
});

const User = mongoose.models.users || mongoose.model("users", userSchema);
export default User;