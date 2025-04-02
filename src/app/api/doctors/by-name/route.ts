import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB } from "@/dbConfig/dbConfig";
import Doctor from "@/models/doctorModel";

export async function GET(request: NextRequest) {
    try {
        // Get the name from query parameters
        const { searchParams } = new URL(request.url);
        const name = searchParams.get('name');

        if (!name) {
            return NextResponse.json(
                { error: 'Doctor name is required' },
                { status: 400 }
            );
        }

        // Connect to MongoDB
        await connectToMongoDB();

        // Find doctor by name
        const doctor = await Doctor.findOne({ name });

        if (!doctor) {
            return NextResponse.json(
                { error: 'Doctor not found' },
                { status: 404 }
            );
        }

        // Return the doctor ID
        return NextResponse.json({
            success: true,
            doctorId: doctor._id.toString()
        });
    } catch (error: any) {
        console.error('Error fetching doctor by name:', error);
        return NextResponse.json(
            { error: 'Failed to fetch doctor' },
            { status: 500 }
        );
    }
} 