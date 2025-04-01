import { connectToMongoDB } from "@/dbConfig/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import Doctor from "@/models/doctorModel";
import BookedAppointment from "@/models/bookedAppointmentModel";
import User from "@/models/userModel";

export async function GET(request: NextRequest) {
    try {
        await connectToMongoDB();

        // Get all active doctors
        const doctors = await Doctor.find(
            { status: 'Active' },
            'name specialization'
        ).sort({ name: 1 });

        // Get all booked appointments with populated doctor and patient data
        const appointments = await BookedAppointment.find()
            .sort({ 'dateRange.startDate': -1 }); // Sort by date, newest first

        // Get all appointments with doctor and patient names
        const appointmentsWithNames = await Promise.all(
            appointments.map(async (appointment) => {
                const doctor = await Doctor.findById(appointment.doctorId, 'name');
                const patient = await User.findById(appointment.patientId, 'firstname lastname');

                return {
                    _id: appointment._id,
                    patientName: patient ? `${patient.firstname} ${patient.lastname}` : 'Unknown Patient',
                    doctorName: doctor ? doctor.name : 'Unknown Doctor',
                    dateRange: appointment.dateRange,
                    timeSlot: appointment.timeSlot,
                    status: appointment.status,
                    reason: appointment.appointmentType
                };
            })
        );

        return NextResponse.json({
            success: true,
            doctors: doctors,
            appointments: appointmentsWithNames
        }, { status: 200 });

    } catch (error: any) {
        console.error('Error fetching data:', error);
        return NextResponse.json(
            { error: "Failed to fetch data" },
            { status: 500 }
        );
    }
}

// ... keep any existing appointment-related routes ...
