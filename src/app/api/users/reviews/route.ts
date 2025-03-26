import { connectToMongoDB } from "@/dbConfig/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import Review from "@/models/reviewModel";

export async function POST(request: NextRequest) {
    try {
        const reqBody = await request.json();
        const { firstName, rating, reviewComment } = reqBody;

        // Validate required fields
        if (!firstName || !rating || !reviewComment) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            );
        }

        // Connect to MongoDB
        await connectToMongoDB();

        // Create Malaysia timezone date (UTC+8)
        const malaysiaDate = new Date();
        malaysiaDate.setHours(malaysiaDate.getHours() + 8);

        // Create new review
        const newReview = new Review({
            firstName,
            rating,
            reviewComment,
            created_at: malaysiaDate
        });

        // Save review to database
        await newReview.save();

        return NextResponse.json({
            success: true,
            message: "Review submitted successfully",
        });

    } catch (error: any) {
        console.error("Error in review submission:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        await connectToMongoDB();

        // Fetch reviews and sort by created_at in descending order (newest first)
        const reviews = await Review.find()
            .sort({ created_at: -1 })
            .select('firstName rating reviewComment created_at');

        return NextResponse.json({
            success: true,
            reviews
        });

    } catch (error: any) {
        console.error("Error fetching reviews:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
