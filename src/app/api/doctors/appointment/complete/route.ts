import { connectToMongoDB } from "@/dbConfig/dbConfig";
import { NextResponse } from "next/server";
import BookedAppointment from "@/models/bookedAppointmentModel";

export async function PUT(req: Request) {
    try {
        await connectToMongoDB();

        const { appointmentId, updatedAt } = await req.json();

        if (!appointmentId) {
            return NextResponse.json({ 
                success: false, 
                error: "Appointment ID is required" 
            }, { status: 400 });
        }

        // Use provided updatedAt or calculate Malaysia time (UTC+8)
        let malaysiaTime;
        if (updatedAt) {
            malaysiaTime = new Date(updatedAt);
        } else {
            const malaysiaOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
            malaysiaTime = new Date(Date.now() + malaysiaOffset);
        }

        const updatedAppointment = await BookedAppointment.findByIdAndUpdate(
            appointmentId,
            { 
                $set: {
                    status: "Completed",
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
        console.error("Error completing appointment:", error);
        return NextResponse.json({ 
            success: false, 
            error: "Failed to complete appointment" 
        }, { status: 500 });
    }
} 