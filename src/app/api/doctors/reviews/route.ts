import { connectToMongoDB } from "@/dbConfig/dbConfig";
import { NextResponse } from "next/server";
import BookedAppointment from "@/models/bookedAppointmentModel";
import User from "@/models/userModel";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// Define interfaces for type safety
interface Review {
    rating: number;
    review: string;
    createdAt: string;
}

interface AppointmentWithReviews {
    _id: string;
    reviews: Review[];
    dateRange: {
        startDate: string;
    };
    patientId: {
        firstname: string;
        lastname: string;
    };
}

export async function GET() {
    try {
        await connectToMongoDB();

        // Get doctor ID from token
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ 
                success: false, 
                error: "Unauthorized" 
            }, { status: 401 });
        }

        const decodedToken: any = jwt.verify(token, process.env.TOKEN_SECRET!);
        const doctorId = decodedToken.id;

        // Find all appointments for this doctor that have reviews
        const appointments = await BookedAppointment.find({
            doctorId,
            'reviews.0': { $exists: true } // Only get appointments that have at least one review
        })
        .select('reviews dateRange patientId')
        .populate({
            path: 'patientId',
            model: User,
            select: 'firstname lastname'
        })
        .sort({ 'reviews.createdAt': -1 }); // Sort by review date, newest first

        // Transform the data to match the frontend requirements
        const reviews = appointments.flatMap((appointment: AppointmentWithReviews) => 
            appointment.reviews.map((review: Review) => ({
                _id: appointment._id,
                name: `${appointment.patientId.firstname} ${appointment.patientId.lastname}`,
                date: new Date(review.createdAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                }),
                rating: review.rating,
                comment: review.review
            }))
        );

        // Calculate average rating
        const averageRating = reviews.length > 0
            ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
            : 0;

        return NextResponse.json({
            success: true,
            reviews,
            averageRating: Number(averageRating.toFixed(1))
        });

    } catch (error) {
        console.error('Error fetching reviews:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to fetch reviews' 
        }, { status: 500 });
    }
} 