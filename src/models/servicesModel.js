import mongoose from "mongoose";

// Define the schema for content items
const contentSchema = new mongoose.Schema({
    subheader: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true, 
    }
});

// Define the main services schema
const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true, 
        trim: true
    },
    icon: {
        type: String,
        required: true, 
    },
    contents: {
        type: [contentSchema],
        required: true, 
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive'
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
serviceSchema.pre('save', function(next) {
    const malaysiaOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    this.updatedAt = new Date(this.updatedAt.getTime() + malaysiaOffset);
    if (this.isNew) {
        this.createdAt = new Date(this.createdAt.getTime() + malaysiaOffset);
    }
    next();
});

// Create the model if it doesn't exist, otherwise use the existing model
const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);

export default Service;

