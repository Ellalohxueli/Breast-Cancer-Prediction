import mongoose from "mongoose";

mongoose.models = {};

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: Number,
        required: true,
    },
    specialization: {
        type: String,
        default: '',
    },
    operatingHours: {
        type: String,
        default: '',
    },
    bio: {
        type: String,
        default: '',
    },
    image: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        default: 'Active',
        enum: ['Active', 'Busy', 'Absent'],
    },
    role: {
        type: String,
        required: true,
        default: 'doctor', 
        enum: ['user', 'admin', 'doctor']
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
doctorSchema.pre('save', function(next) {
    const malaysiaOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    this.updatedAt = new Date(this.updatedAt.getTime() + malaysiaOffset);
    if (this.isNew) {
        this.createdAt = new Date(this.createdAt.getTime() + malaysiaOffset);
    }
    next();
});

export default mongoose.models.Doctor || mongoose.model('doctors', doctorSchema);