import { connectToMongoDB } from "@/dbConfig/dbConfig";
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from "jsonwebtoken";
import PatientReport, { IPatientReport } from "@/models/PatientReport";

interface JwtPayload {
    id: string;
    email: string;
    role: string;
}

interface IMammogramInfo {
    image: string;
    predictionResult: string;
}

interface IAppointmentInfo {
    doctorId: string;
    appointmentId: string;
    dateRange: {
        startDate: Date;
        day: string;
        timeSlot: {
            startTime: string;
        };
    };
    appointmentType: string;
}

export async function GET() {
    try {
        // Get the token from cookies
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Verify token and get doctor ID
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET!) as JwtPayload;
        const doctorId = decoded.id;

        // Connect to database
        await connectToMongoDB();

        // Find all reports for the current doctor
        const reports = await PatientReport.find({ 'appointments.doctorId': doctorId })
            .sort({ createdAt: -1 })
            .lean();
        
        const totalReports = reports.length;

        if (totalReports === 0) {
            return NextResponse.json({
                success: true,
                reports: []
            });
        }

        return NextResponse.json({
            success: true,
            reports,
            count: totalReports
        });

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
} 