import { connectToMongoDB } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from "jsonwebtoken";

export async function GET() {
    try {
        // Get the token from cookies - await the cookies() call
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

        // Connect to database
        await connectToMongoDB();

        // Find all users with role 'user'
        const patients = await User.find({ role: 'user' })
            .select('firstname lastname email phone sex dob')
            .sort({ createdAt: -1 });

        // Count all users in the database with role 'user'
        const totalUsers = await User.countDocuments({ role: 'user' });

        return NextResponse.json({
            success: true,
            patients,
            count: totalUsers
        });

    } catch (error) {
        console.error('Patients fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
