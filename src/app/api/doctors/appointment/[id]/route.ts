import { connectToMongoDB } from "@/dbConfig/dbConfig";
import { NextResponse } from "next/server";
import BookedAppointment from "@/models/bookedAppointmentModel";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        await connectToMongoDB();

        // Get the appointment ID from the URL parameters
        const appointmentId = params.id;

        // Find the appointment by ID
        const appointment = await BookedAppointment.findById(appointmentId);

        if (!appointment) {
            return NextResponse.json({ 
                success: false, 
                error: "Appointment not found" 
            }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true, 
            appointment 
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching appointment:", error);
        return NextResponse.json({ 
            success: false, 
            error: "Failed to fetch appointment" 
        }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
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

        // Get the appointment ID from the URL parameters
        const appointmentId = params.id;

        // Calculate Malaysia time (UTC+8)
        const malaysiaOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        const malaysiaTime = new Date(Date.now() + malaysiaOffset);

        // Update the appointment status
        const updatedAppointment = await BookedAppointment.findByIdAndUpdate(
            appointmentId,
            { 
                $set: {
                    status: "Ongoing",
                    updatedAt: malaysiaTime
                }
            },
            { 
                new: true,
                timestamps: false // Disable automatic timestamp updating
            }
        );

        if (!updatedAppointment) {
            return NextResponse.json({ 
                success: false, 
                error: "Appointment not found" 
            }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true, 
            appointment: updatedAppointment 
        }, { status: 200 });

    } catch (error) {
        console.error("Error updating appointment status:", error);
        return NextResponse.json({ 
            success: false, 
            error: "Failed to update appointment status" 
        }, { status: 500 });
    }
} 