import { NextResponse } from 'next/server';
import { connectToMongoDB } from "@/dbConfig/dbConfig";
import PatientReport from '@/models/PatientReport';

export async function POST(request: Request) {
    try {
        await connectToMongoDB();
        const data = await request.json();
        
        // Validate required fields
        if (!data.patientId) {
            return NextResponse.json(
                { error: 'Patient ID is required' },
                { status: 400 }
            );
        }
        
        if (!data.description) {
            return NextResponse.json(
                { error: 'Description is required' },
                { status: 400 }
            );
        }
        
        if (!data.appointments || !Array.isArray(data.appointments) || data.appointments.length === 0) {
            return NextResponse.json(
                { error: 'At least one appointment is required' },
                { status: 400 }
            );
        }
        
        // Use provided timestamps or calculate Malaysia time (UTC+8)
        let createdAt, updatedAt;
        if (data.createdAt) {
            createdAt = new Date(data.createdAt);
        } else {
            const malaysiaOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
            createdAt = new Date(Date.now() + malaysiaOffset);
        }
        
        if (data.updatedAt) {
            updatedAt = new Date(data.updatedAt);
        } else {
            updatedAt = createdAt; // Use the same time for both if not provided
        }
        
        // Remove the timestamp fields from the data to be saved
        const { createdAt: _, updatedAt: __, ...dataWithoutTimestamps } = data;
        
        // Log the data being saved
        console.log('Creating patient report with data:', JSON.stringify(dataWithoutTimestamps, null, 2));
        console.log('Using timestamps:', { createdAt, updatedAt });

        const patientReport = await PatientReport.create({
            ...dataWithoutTimestamps,
            createdAt,
            updatedAt
        });
        
        return NextResponse.json(patientReport, { status: 201 });
    } catch (error: any) {
        console.error('Error creating patient report:', error);
        
        // Check for validation errors
        if (error.name === 'ValidationError') {
            return NextResponse.json(
                { error: 'Validation error', details: error.message },
                { status: 400 }
            );
        }
        
        return NextResponse.json(
            { error: 'Failed to create patient report', details: error.message },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        await connectToMongoDB();
        const { searchParams } = new URL(request.url);
        const patientId = searchParams.get('patientId');

        if (!patientId) {
            return NextResponse.json(
                { error: 'Patient ID is required' },
                { status: 400 }
            );
        }

        const patientReports = await PatientReport.find({ patientId });
        return NextResponse.json(patientReports);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch patient reports' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        await connectToMongoDB();
        const { searchParams } = new URL(request.url);
        const patientId = searchParams.get('patientId');

        if (!patientId) {
            return NextResponse.json(
                { error: 'Patient ID is required' },
                { status: 400 }
            );
        }

        const data = await request.json();
        const updatedReport = await PatientReport.findOneAndUpdate(
            { patientId },
            data,
            { new: true, upsert: true }
        );

        return NextResponse.json(updatedReport);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update patient report' },
            { status: 500 }
        );
    }
} 