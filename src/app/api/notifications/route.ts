import { NextResponse } from 'next/server';
import { connectToMongoDB } from "@/dbConfig/dbConfig";
import Notification from '@/models/notificationModel';
import BookedAppointment from "@/models/bookedAppointmentModel";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export async function POST(request: Request) {
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

        const body = await request.json();

        // Validate required fields
        if (!body.appointmentId || !body.patientId || !body.appointmentDate || !body.appointmentTime) {
            return NextResponse.json({ 
                success: false,
                error: 'Missing required fields' 
            }, { status: 400 });
        }

        // First, find and update the appointment
        const appointment = await BookedAppointment.findById(body.appointmentId);
        
        if (!appointment) {
            return NextResponse.json({ 
                success: false,
                error: 'Appointment not found' 
            }, { status: 404 });
        }

        // Update appointment status based on notification status
        if (body.status === 'completed') {
            appointment.status = 'Completed';
        } else if (body.status === 'cancelled') {
            appointment.status = 'Cancelled';
        } else if (body.status === 'rescheduled') {
            appointment.status = 'Rescheduled';
        }
        await appointment.save();

        // Validate and normalize the status
        let normalizedStatus = body.status;
        if (normalizedStatus === 'completed') {
            normalizedStatus = 'completed';
        } else if (normalizedStatus === 'cancelled') {
            normalizedStatus = 'cancelled';
        } else if (normalizedStatus === 'rescheduled') {
            normalizedStatus = 'rescheduled';
        } else {
            normalizedStatus = 'pending';
        }

        // Create notification with proper ObjectId conversion
        const notification = await Notification.create({
            doctorId: new mongoose.Types.ObjectId(doctorId),
            patientId: new mongoose.Types.ObjectId(appointment.patientId),
            appointmentDate: new Date(body.appointmentDate),
            appointmentDay: body.appointmentDay,
            appointmentTime: body.appointmentTime,
            status: normalizedStatus
        });

        return NextResponse.json({ 
            success: true,
            message: `Appointment ${body.status} successfully`, 
            notification 
        }, { status: 201 });

    } catch (error: any) {
        console.error('Server error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });

        // Handle specific errors
        if (error instanceof jwt.JsonWebTokenError) {
            return NextResponse.json({ 
                success: false,
                error: 'Invalid token' 
            }, { status: 401 });
        }

        if (error instanceof mongoose.Error.ValidationError) {
            return NextResponse.json({ 
                success: false,
                error: 'Validation error: ' + error.message 
            }, { status: 400 });
        }

        return NextResponse.json({ 
            success: false,
            error: error.message || 'Failed to create notification' 
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        await connectToMongoDB();

        // Get user ID from token - Fix for async cookies
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

        // Fetch notifications for the user (either as doctor or patient)
        const notifications = await Notification.find({
            $or: [
                { doctorId: userId },
                { patientId: userId }
            ]
        })
        .sort({ createdAt: -1 }) // Sort by newest first
        .limit(10); // Limit to 10 notifications

        return NextResponse.json({ 
            success: true,
            notifications 
        });

    } catch (error: any) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ 
            success: false,
            error: error.message || 'Failed to fetch notifications' 
        }, { status: 500 });
    }
} 