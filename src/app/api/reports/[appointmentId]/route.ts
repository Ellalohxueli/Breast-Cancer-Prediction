import { connectToMongoDB } from "@/dbConfig/dbConfig";
import PatientReport from "@/models/PatientReport";
import Doctor from "@/models/doctorModel";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: { appointmentId: string } }
) {
    try {
        await connectToMongoDB();
        
        const { appointmentId } = params;
        if (!appointmentId) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: "Appointment ID is required",
                    details: "No appointment ID provided in the request"
                },
                { status: 400 }
            );
        }

        // Find the report that contains the appointment ID
        const report = await PatientReport.findOne({
            'appointments.appointmentId': appointmentId
        });

        if (!report) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: "Report not found",
                    details: "No report found for the given appointment ID"
                },
                { status: 404 }
            );
        }

        // Find the specific appointment in the appointments array
        const appointment = report.appointments.find(
            (apt: any) => apt.appointmentId === appointmentId
        );

        // Log the appointment and doctor data
        console.log('Report and Appointment Data:', {
            reportId: report._id,
            appointmentId: appointmentId,
            appointmentData: appointment,
            doctorId: appointment?.doctorId,
            timeSlot: appointment?.dateRange?.timeSlot
        });

        // Fetch doctor details from the doctor database using the doctor ID
        const doctor = await Doctor.findById(appointment?.doctorId);

        // Log the doctor data
        console.log('Doctor Data:', {
            doctorId: appointment?.doctorId,
            doctorFromDatabase: doctor,
            doctorName: doctor?.name
        });

        return NextResponse.json({
            success: true,
            report: {
                _id: report._id,
                description: report.description,
                mammograms: report.mammograms,
                medications: report.medications,
                updatedAt: report.updatedAt,
                appointment: {
                    appointmentId: appointment.appointmentId,
                    dateRange: appointment.dateRange,
                    timeSlot: appointment.dateRange.timeSlot,
                    appointmentType: appointment.appointmentType,
                    doctorId: appointment.doctorId,
                    doctor: doctor || appointment.doctor
                }
            },
            message: "Report retrieved successfully"
        });

    } catch (error) {
        console.error('Error fetching report:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: "Failed to fetch report",
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}