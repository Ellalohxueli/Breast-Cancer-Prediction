import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, "First name is required"],
    },
    rating: {
        type: Number,
        required: [true, "Rating is required"],
        min: 1,
        max: 5
    },
    reviewComment: {
        type: String,
        required: [true, "Review comment is required"]
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

const Review = mongoose.models.reviews || mongoose.model("reviews", reviewSchema);

export default Review;
