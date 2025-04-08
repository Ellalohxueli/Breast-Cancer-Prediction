import { connectToMongoDB } from "@/dbConfig/dbConfig";
import { NextResponse } from "next/server";
import BookedAppointment from "@/models/bookedAppointmentModel";
import PatientReport from "@/models/PatientReport";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
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
        console.log('Doctor ID:', doctorId);

        // Fetch all appointments with patient info and reports
        const appointments = await BookedAppointment.aggregate([
            {
                $match: {
                    doctorId: doctorId
                }
            },
            {
                $lookup: {
                    from: "users",
                    let: { patientId: "$patientId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", { $toObjectId: "$$patientId" }]
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                firstname: 1,
                                lastname: 1,
                                email: 1,
                                phone: 1
                            }
                        }
                    ],
                    as: "patientInfo"
                }
            },
            {
                $lookup: {
                    from: "patientreports",
                    let: { 
                        appointmentId: { $toString: "$_id" }
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $gt: [
                                        {
                                            $size: {
                                                $filter: {
                                                    input: "$appointments",
                                                    as: "appt",
                                                    cond: { 
                                                        $eq: ["$$appt.appointmentId", "$$appointmentId"]
                                                    }
                                                }
                                            }
                                        },
                                        0
                                    ]
                                }
                            }
                        },
                        {
                            $addFields: {
                                matchedAppointment: {
                                    $filter: {
                                        input: "$appointments",
                                        as: "appt",
                                        cond: { 
                                            $eq: ["$$appt.appointmentId", "$$appointmentId"]
                                        }
                                    }
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                patientId: 1,
                                matchedAppointment: { $arrayElemAt: ["$matchedAppointment", 0] },
                                mammograms: 1,
                                medications: 1,
                                description: 1,
                                createdAt: 1,
                                updatedAt: 1
                            }
                        }
                    ],
                    as: "patientReport"
                }
            },
            {
                $unwind: {
                    path: "$patientInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: "$patientReport",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    patient: {
                        $cond: {
                            if: "$patientInfo",
                            then: {
                                _id: { $toString: "$patientInfo._id" },
                                firstname: "$patientInfo.firstname",
                                lastname: "$patientInfo.lastname",
                                email: "$patientInfo.email",
                                phone: "$patientInfo.phone"
                            },
                            else: null
                        }
                    },
                    report: {
                        $cond: {
                            if: "$patientReport",
                            then: {
                                _id: { $toString: "$patientReport._id" },
                                patientId: "$patientReport.patientId",
                                appointment: "$patientReport.matchedAppointment",
                                mammograms: "$patientReport.mammograms",
                                medications: "$patientReport.medications",
                                description: "$patientReport.description",
                                createdAt: "$patientReport.createdAt",
                                updatedAt: "$patientReport.updatedAt"
                            },
                            else: null
                        }
                    },
                    reviews: {
                        $cond: {
                            if: { $isArray: "$reviews" },
                            then: "$reviews",
                            else: []
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    dateRange: 1,
                    timeSlot: 1,
                    status: 1,
                    appointmentType: 1,
                    reviews: 1,
                    patient: 1,
                    report: 1
                }
            },
            {
                $sort: {
                    appointmentDate: 1,
                    "timeSlot.startTime": 1
                }
            }
        ]);

        // Add detailed logging for each appointment and its patient report
        appointments.forEach((appointment, index) => {
            console.log(`\n=== Appointment ${index + 1} ===`);
            console.log('Appointment ID:', appointment._id);
            console.log('Patient ID:', appointment.patient?._id);
            
            if (appointment.report) {
                console.log('\nPatient Report Details:');
                console.log('Report ID:', appointment.report._id);
                console.log('Report Patient ID:', appointment.report.patientId);
                console.log('\nMatched Appointment Details:');
                console.log('Appointment ID in Report:', appointment.report.appointment?.appointmentId);
                console.log('Full Appointment Data:', JSON.stringify(appointment.report.appointment, null, 2));
                console.log('\nMammograms:', JSON.stringify(appointment.report.mammograms, null, 2));
                console.log('\nMedications:', appointment.report.medications);
                console.log('\nReport Timestamps:');
                console.log('Created:', appointment.report.createdAt);
                console.log('Updated:', appointment.report.updatedAt);
            } else {
                console.log('\nNo patient report found for this appointment');
            }
            console.log('===============================\n');
        });

        console.log('Total Appointments Found:', appointments.length);

        if (!appointments.length) {
            return NextResponse.json({
                success: false,
                message: "No appointments found"
            });
        }

        return NextResponse.json({ 
            success: true, 
            data: appointments,
            totalAppointments: appointments.length
        });

    } catch (error) {
        console.error("Error fetching appointments:", error);
        return NextResponse.json({ 
            success: false, 
            error: "Failed to fetch appointments" 
        }, { status: 500 });
    }
} 