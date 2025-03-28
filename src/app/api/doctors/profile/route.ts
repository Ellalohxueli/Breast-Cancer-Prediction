import { connectToMongoDB } from "@/dbConfig/dbConfig";
import Doctor from "@/models/doctorModel";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

// GET request to fetch doctor profile
export async function GET(request: NextRequest) {
    try {
        // Get token from cookies
        const token = request.cookies.get('token')?.value || '';
        
        if (!token) {
            return NextResponse.json({
                error: "Unauthorized - No token provided"
            }, { status: 401 });
        }

        // Verify token
        const decodedToken: any = jwt.verify(token, process.env.TOKEN_SECRET!);
        const doctorId = decodedToken.id;

        // Connect to MongoDB
        await connectToMongoDB();

        // Find doctor by ID
        const doctor = await Doctor.findById(doctorId).select('email phone specialization operatingHours bio status');

        if (!doctor) {
            return NextResponse.json({
                error: "Doctor not found"
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: doctor
        });

    } catch (error: any) {
        return NextResponse.json({
            error: error.message
        }, { status: 500 });
    }
}

// PUT request to update doctor profile
export async function PUT(request: NextRequest) {
    try {
        // Get token from cookies
        const token = request.cookies.get('token')?.value || '';
        
        if (!token) {
            return NextResponse.json({
                error: "Unauthorized - No token provided"
            }, { status: 401 });
        }

        // Verify token
        const decodedToken: any = jwt.verify(token, process.env.TOKEN_SECRET!);
        const doctorId = decodedToken.id;

        // Connect to MongoDB
        await connectToMongoDB();

        // Get request body
        const formData = await request.formData();
        
        // Create update object with only provided fields
        const updateData: any = {};
        
        if (formData.get('email')) updateData.email = formData.get('email');
        if (formData.get('phone')) updateData.phone = formData.get('phone');
        if (formData.get('specialization')) updateData.specialization = formData.get('specialization');
        if (formData.get('operatingHours')) updateData.operatingHours = formData.get('operatingHours');
        if (formData.get('bio')) updateData.bio = formData.get('bio');
        if (formData.get('status')) updateData.status = formData.get('status');

        // Update timestamp
        updateData.updatedAt = new Date();

        // Update doctor profile
        const updatedDoctor = await Doctor.findByIdAndUpdate(
            doctorId,
            { $set: updateData },
            { new: true }
        ).select('email phone specialization operatingHours bio status');

        if (!updatedDoctor) {
            return NextResponse.json({
                error: "Doctor not found"
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: updatedDoctor
        });

    } catch (error: any) {
        return NextResponse.json({
            error: error.message
        }, { status: 500 });
    }
}
