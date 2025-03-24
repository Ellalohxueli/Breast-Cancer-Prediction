import { connectToMongoDB } from "@/dbConfig/dbConfig";
import { NextResponse } from "next/server";
import User from "@/models/userModel";

export async function GET() {
    try {
        await connectToMongoDB();
        
        // Count users with role 'user'
        const userCount = await User.countDocuments({ role: 'user' });
        
        return NextResponse.json({
            success: true,
            userCount
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
