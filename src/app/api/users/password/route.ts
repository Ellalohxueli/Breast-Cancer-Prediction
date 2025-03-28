import { connectToMongoDB } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";

export async function PUT(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET!);
        if (!decoded || typeof decoded !== 'object' || !decoded.id) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Get request body
        const body = await request.json();
        const { currentPassword, newPassword } = body;

        // Validate new password length
        if (!newPassword || newPassword.length < 8) {
            return NextResponse.json({ 
                error: 'New password must be at least 8 characters long' 
            }, { status: 400 });
        }

        // Connect to database
        await connectToMongoDB();

        // Find user
        const user = await User.findById(decoded.id);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Verify current password
        const isPasswordValid = await bcryptjs.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
        }

        // Hash new password
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(newPassword, salt);

        // Calculate Malaysia timezone offset (UTC+8)
        const malaysiaOffset = 8 * 60 * 60 * 1000;
        const updatedAtMalaysia = new Date(Date.now() + malaysiaOffset);

        // Update password
        await User.findByIdAndUpdate(
            decoded.id,
            {
                password: hashedPassword,
                updatedAt: updatedAtMalaysia
            }
        );

        return NextResponse.json({
            success: true,
            message: 'Password updated successfully'
        });

    } catch (error: any) {
        console.error('Password update error:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error.message 
        }, { status: 500 });
    }
} 