import { connectToMongoDB } from "@/dbConfig/dbConfig";
import { NextResponse } from "next/server";
import BookedAppointment from "@/models/bookedAppointmentModel";
import Doctor from "@/models/doctorModel";
import User from "@/models/userModel";
import PatientReport from "@/models/PatientReport";

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        console.log('Fetching appointments for patient ID:', params.id);
        await connectToMongoDB();
        const patientId = params.id;

        // Get all appointments for the specific patient
        const appointments = await BookedAppointment.find({ patientId })
            .sort({ 'dateRange.startDate': -1 }); // Sort by date, newest first
        console.log('Raw appointments data:', appointments);

        // Get appointments with doctor and patient names
        const appointmentsWithNames = await Promise.all(
            appointments.map(async (appointment) => {
                console.log('Processing appointment:', appointment._id);
                
                const doctor = await Doctor.findById(appointment.doctorId, 'name');
                console.log('Doctor data:', doctor);
                
                const patient = await User.findById(appointment.patientId, 'firstname lastname');
                console.log('Patient data:', patient);

                const appointmentData = {
                    _id: appointment._id,
                    patientName: patient ? `${patient.firstname} ${patient.lastname}` : 'Unknown Patient',
                    doctorName: doctor ? doctor.name : 'Unknown Doctor',
                    dateRange: appointment.dateRange,
                    timeSlot: appointment.timeSlot,
                    status: appointment.status,
                    reason: appointment.appointmentType,
                    notes: appointment.notes || ''
                };
                console.log('Formatted appointment data:', appointmentData);
                
                return appointmentData;
            })
        );

        console.log('Final appointments data:', appointmentsWithNames);

        return NextResponse.json({
            success: true,
            appointments: appointmentsWithNames
        }, { status: 200 });

    } catch (error: any) {
        console.error("Error fetching patient appointments:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch appointments" },
            { status: 500 }
        );
    }
}

// New function to get latest completed appointment
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        console.log('Fetching latest completed appointment for patient ID:', params.id);
        await connectToMongoDB();
        const patientId = params.id;

        // Get the latest completed appointment for the patient
        const latestCompletedAppointment = await BookedAppointment.findOne({
            patientId,
            status: 'completed'
        })
        .sort({ 'dateRange.startDate': -1 }); // Sort by date, newest first

        console.log('Raw latest completed appointment from DB:', latestCompletedAppointment);

        if (!latestCompletedAppointment) {
            console.log('No completed appointments found for patient:', patientId);
            return NextResponse.json({
                success: true,
                appointment: null
            }, { status: 200 });
        }

        // Get doctor and patient details
        const doctor = await Doctor.findById(latestCompletedAppointment.doctorId, 'name');
        console.log('Doctor details:', doctor);
        
        const patient = await User.findById(latestCompletedAppointment.patientId, 'firstname lastname');
        console.log('Patient details:', patient);

        const appointmentData = {
            _id: latestCompletedAppointment._id,
            patientName: patient ? `${patient.firstname} ${patient.lastname}` : 'Unknown Patient',
            doctorName: doctor ? doctor.name : 'Unknown Doctor',
            dateRange: latestCompletedAppointment.dateRange,
            timeSlot: latestCompletedAppointment.timeSlot,
            status: latestCompletedAppointment.status,
            reason: latestCompletedAppointment.appointmentType,
            notes: latestCompletedAppointment.notes || ''
        };

        console.log('Formatted latest completed appointment data:', {
            appointmentId: appointmentData._id,
            patientName: appointmentData.patientName,
            doctorName: appointmentData.doctorName,
            date: appointmentData.dateRange.startDate,
            time: `${appointmentData.timeSlot.startTime} - ${appointmentData.timeSlot.endTime}`,
            status: appointmentData.status,
            reason: appointmentData.reason
        });

        return NextResponse.json({
            success: true,
            appointment: appointmentData
        }, { status: 200 });

    } catch (error: any) {
        console.error("Error fetching latest completed appointment:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch latest completed appointment" },
            { status: 500 }
        );
    }
}

// New function to get patient report by appointment ID
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        console.log('Fetching patient report for patient ID:', params.id);
        await connectToMongoDB();
        const patientId = params.id;
        
        // Get the appointmentId from the request body
        const body = await request.json();
        const appointmentId = body.appointmentId;
        
        console.log('Requested appointment ID:', appointmentId);
        console.log('Patient ID from params:', patientId);
        console.log('Are they the same?', appointmentId === patientId);

        if (!appointmentId) {
            console.log('No appointment ID provided in request');
            return NextResponse.json({
                success: false,
                message: "Appointment ID is required"
            }, { status: 400 });
        }

        // First, try to find the report directly by patientId
        let patientReport = await PatientReport.findOne({ patientId });
        
        console.log('Patient report found by patientId:', patientReport ? 'Yes' : 'No');
        if (patientReport) {
            console.log('Report patientId:', patientReport.patientId);
            console.log('Report appointments:', patientReport.appointments.map((appt: any) => appt.appointmentId));
        }

        // If no report found by patientId, try to find by appointmentId in the appointments array
        if (!patientReport) {
            patientReport = await PatientReport.findOne({
                'appointments.appointmentId': appointmentId
            });
            console.log('Patient report found by appointmentId in appointments array:', patientReport ? 'Yes' : 'No');
            if (patientReport) {
                console.log('Report patientId:', patientReport.patientId);
                console.log('Report appointments:', patientReport.appointments.map((appt: any) => appt.appointmentId));
            }
        }

        // If still no report found, try to find by patientId and appointmentId
        if (!patientReport) {
            patientReport = await PatientReport.findOne({
                patientId,
                'appointments.appointmentId': appointmentId
            });
            console.log('Patient report found by patientId and appointmentId:', patientReport ? 'Yes' : 'No');
            if (patientReport) {
                console.log('Report patientId:', patientReport.patientId);
                console.log('Report appointments:', patientReport.appointments.map((appt: any) => appt.appointmentId));
            }
        }

        // If still no report found, try to find by appointmentId only (as a last resort)
        if (!patientReport) {
            patientReport = await PatientReport.findOne({
                'appointments.appointmentId': appointmentId
            });
            console.log('Patient report found by appointmentId only:', patientReport ? 'Yes' : 'No');
            if (patientReport) {
                console.log('Report patientId:', patientReport.patientId);
                console.log('Report appointments:', patientReport.appointments.map((appt: any) => appt.appointmentId));
            }
        }

        // If still no report found, try to find by patientId only (as a last resort)
        if (!patientReport) {
            patientReport = await PatientReport.findOne({
                patientId: appointmentId
            });
            console.log('Patient report found by patientId only (using appointmentId as patientId):', patientReport ? 'Yes' : 'No');
            if (patientReport) {
                console.log('Report patientId:', patientReport.patientId);
                console.log('Report appointments:', patientReport.appointments.map((appt: any) => appt.appointmentId));
            }
        }

        console.log('Raw patient report data:', patientReport);

        if (!patientReport) {
            console.log('No report found for appointment:', appointmentId);
            return NextResponse.json({
                success: true,
                report: null
            }, { status: 200 });
        }

        // Format the report data
        const reportData = {
            _id: patientReport._id,
            patientId: patientReport.patientId,
            appointments: patientReport.appointments,
            description: patientReport.description,
            medications: patientReport.medications,
            mammograms: patientReport.mammograms.map((mammo: any) => ({
                image: mammo.image,
                predictionResult: mammo.predictionResult
            })),
            createdAt: patientReport.createdAt,
            updatedAt: patientReport.updatedAt
        };

        console.log('Formatted patient report data:', reportData);

        return NextResponse.json({
            success: true,
            report: reportData
        }, { status: 200 });

    } catch (error: any) {
        console.error("Error fetching patient report:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch patient report" },
            { status: 500 }
        );
    }
} 