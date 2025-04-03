import { connectToMongoDB } from "@/dbConfig/dbConfig";
import { NextResponse } from "next/server";
import BookedAppointment from "@/models/bookedAppointmentModel";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
    try {
        await connectToMongoDB();

        // Get user ID from token
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ 
                success: false, 
                error: "Unauthorized" 
            }, { status: 401 });
        }

        const decodedToken: any = jwt.verify(token, process.env.TOKEN_SECRET!);
        const userId = decodedToken.id;

        const body = await req.json();
        const { appointmentId, rating, reviewComment } = body;

        // Validate required fields
        if (!appointmentId || !rating || !reviewComment) {
            return NextResponse.json({ 
                success: false,
                error: 'Missing required fields' 
            }, { status: 400 });
        }

        // Find the appointment
        const appointment = await BookedAppointment.findById(appointmentId);

        if (!appointment) {
            return NextResponse.json({ 
                success: false,
                error: 'Appointment not found' 
            }, { status: 404 });
        }

        // Verify that the user is the patient of this appointment
        if (appointment.patientId !== userId) {
            return NextResponse.json({ 
                success: false,
                error: 'Unauthorized to review this appointment' 
            }, { status: 403 });
        }

        // Create date with Malaysia timezone offset (UTC+8)
        const malaysiaDate = new Date();
        malaysiaDate.setHours(malaysiaDate.getHours() + 8);

        // Add the review to the appointment's reviews array
        appointment.reviews.push({
            rating,
            review: reviewComment,
            createdAt: malaysiaDate
        });

        await appointment.save();

        return NextResponse.json({ 
            success: true,
            message: 'Review submitted successfully'
        }, { status: 201 });

    } catch (error) {
        console.error('Error submitting review:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to submit review' 
        }, { status: 500 });
    }
} 