import { connectToMongoDB } from "@/dbConfig/dbConfig";
import { NextResponse } from "next/server";
import BookedAppointment from "@/models/bookedAppointmentModel";

export async function PUT(req: Request) {
    try {
        await connectToMongoDB();

        const { appointmentId } = await req.json();

        if (!appointmentId) {
            return NextResponse.json({ 
                success: false, 
                error: "Appointment ID is required" 
            }, { status: 400 });
        }

        // Calculate Malaysia time (UTC+8)
        const malaysiaOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        const malaysiaTime = new Date(Date.now() + malaysiaOffset);

        const updatedAppointment = await BookedAppointment.findByIdAndUpdate(
            appointmentId,
            { 
                $set: {
                    status: "Cancelled",
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
        console.error("Error cancelling appointment:", error);
        return NextResponse.json({ 
            success: false, 
            error: "Failed to cancel appointment" 
        }, { status: 500 });
    }
} 