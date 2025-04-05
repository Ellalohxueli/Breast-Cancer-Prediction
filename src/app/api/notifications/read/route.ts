import { NextResponse } from 'next/server';
import { connectToMongoDB } from "@/dbConfig/dbConfig";
import Notification from '@/models/notificationModel';

export async function PUT(request: Request) {
    try {
        await connectToMongoDB();
        
        const { notificationId } = await request.json();

        if (!notificationId) {
            return NextResponse.json({ 
                success: false, 
                error: "Notification ID is required" 
            }, { status: 400 });
        }

        // Calculate Malaysia time
        const malaysiaOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        const malaysiaTime = new Date(new Date().getTime() + malaysiaOffset);

        // Update the notification's isRead status and updatedAt
        const updatedNotification = await Notification.findByIdAndUpdate(
            notificationId,
            { 
                isRead: true,
                updatedAt: malaysiaTime 
            },
            { 
                new: true,
                timestamps: false // Disable automatic timestamp update
            }
        );

        if (!updatedNotification) {
            return NextResponse.json({ 
                success: false, 
                error: "Notification not found" 
            }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true,
            notification: updatedNotification 
        });

    } catch (error: any) {
        console.error('Error updating notification read status:', error);
        return NextResponse.json({ 
            success: false,
            error: error.message || 'Failed to update notification' 
        }, { status: 500 });
    }
} 