import { connectToMongoDB } from "@/dbConfig/dbConfig";
import { NextResponse } from "next/server";
import Doctor from "@/models/doctorModel";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function PUT(request: Request) {
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

        // Get status from request body
        const { status } = await request.json();

        if (!status) {
            return NextResponse.json({ 
                success: false, 
                error: "Status is required" 
            }, { status: 400 });
        }

        // Update doctor status
        const updatedDoctor = await Doctor.findByIdAndUpdate(
            doctorId,
            { status },
            { new: true }
        );

        if (!updatedDoctor) {
            return NextResponse.json({ 
                success: false, 
                error: "Doctor not found" 
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Doctor status updated successfully",
            data: {
                status: updatedDoctor.status
            }
        });

    } catch (error) {
        console.error('Error updating doctor status:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to update doctor status' 
        }, { status: 500 });
    }
} 