import { connectToMongoDB } from "@/dbConfig/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import Review from "@/models/reviewModel";

export async function GET(request: NextRequest) {
    try {
        const firstName = request.nextUrl.searchParams.get('firstName');

        if (!firstName) {
            return NextResponse.json(
                { error: "First name is required" },
                { status: 400 }
            );
        }

        await connectToMongoDB();

        // Check if a review exists for this user
        const existingReview = await Review.findOne({ firstName });

        return NextResponse.json({
            success: true,
            hasReviewed: !!existingReview
        });

    } catch (error: any) {
        console.error("Error checking review:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 