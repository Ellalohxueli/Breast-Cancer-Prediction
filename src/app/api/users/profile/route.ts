import { connectToMongoDB } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from "jsonwebtoken";

export async function GET() {
    try {
        // Get the token from cookies
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify token using the same secret as login
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET!);
        if (!decoded || typeof decoded !== 'object' || !decoded.id) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Connect to database
        await connectToMongoDB();

        // Find user using id from token
        const user = await User.findById(decoded.id).select('firstname lastname phone');
        
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Return user data
        return NextResponse.json({
            success: true,
            user: {
                firstName: user.firstname,
                lastName: user.lastname,
                phone: user.phone || ''
            }
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

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
        const { firstName, lastName, phone } = body;

        // Validate input
        if (!firstName || !lastName || !phone) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        // Connect to database
        await connectToMongoDB();

        // Calculate Malaysia timezone offset (UTC+8)
        const malaysiaOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        const updatedAtMalaysia = new Date(Date.now() + malaysiaOffset);

        // Update user with Malaysia timezone
        const updatedUser = await User.findByIdAndUpdate(
            decoded.id,
            {
                firstname: firstName,
                lastname: lastName,
                phone: phone,
                updatedAt: updatedAtMalaysia
            },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            user: {
                firstName: updatedUser.firstname,
                lastName: updatedUser.lastname,
                phone: updatedUser.phone
            }
        });

    } catch (error: any) {
        console.error('Profile update error:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error.message 
        }, { status: 500 });
    }
}
