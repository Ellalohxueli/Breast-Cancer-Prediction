import mongoose from "mongoose";

// Define the SEO metadata schema
const seoMetadataSchema = new mongoose.Schema({
    title: {
        type: String,
        required: false,
        trim: true
    },
    description: {
        type: String,
        required: false,
        trim: true
    },
    keywords: {
        type: String,
        required: false,
        trim: true
    }
});

// Define the main resources schema
const resourceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Tips & Guides', 'News & Articles', 'Events & Support Groups'],
    },
    content: {
        type: String,
        required: false // Not required for events
    },
    featuredImage: {
        type: String,
        required: false
    },
    status: {
        type: String,
        required: false,
        enum: ['published', 'draft'],
        default: 'draft'
    },
    seoMetadata: seoMetadataSchema,
    publishDate: {
        type: Date,
        required: false,
        default: Date.now
    },
    // Event-specific fields
    eventCategory: {
        type: String,
        enum: ['support group', 'workshop', 'seminar'],
        required: function() {
            return this.category === 'Events & Support Groups';
        }
    },
    eventDate: {
        type: Date,
        required: function() {
            return this.category === 'Events & Support Groups';
        }
    },
    eventTime: {
        type: String,
        required: function() {
            return this.category === 'Events & Support Groups';
        }
    },
    shortDescription: {
        type: String,
        required: function() {
            return this.category === 'Events & Support Groups';
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Add a pre-save middleware to update the updatedAt timestamp
resourceSchema.pre('save', function(next) {
    const malaysiaOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    this.updatedAt = new Date(this.updatedAt.getTime() + malaysiaOffset);
    if (this.isNew) {
        this.createdAt = new Date(this.createdAt.getTime() + malaysiaOffset);
    }
    next();
});

// Create and export the model
const Resource = mongoose.models.resources || mongoose.model("resources", resourceSchema);

export default Resource;
