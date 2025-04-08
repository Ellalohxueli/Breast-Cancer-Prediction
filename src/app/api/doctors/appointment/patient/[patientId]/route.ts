import { connectToMongoDB } from "@/dbConfig/dbConfig";
import { NextResponse } from "next/server";
import BookedAppointment from "@/models/bookedAppointmentModel";
import PatientReport from "@/models/PatientReport";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET(req: Request, { params }: { params: { patientId: string } }) {
    try {
        console.log("Starting to fetch patient's completed appointments and reports...");
        await connectToMongoDB();

        // Get doctor ID from token
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            console.log("No token found in cookies");
            return NextResponse.json({ 
                success: false, 
                error: "Unauthorized" 
            }, { status: 401 });
        }

        const decodedToken: any = jwt.verify(token, process.env.TOKEN_SECRET!);
        const doctorId = decodedToken.id;
        console.log("Doctor ID from token:", doctorId);

        // Get the patient ID from the URL parameters
        const patientId = params.patientId;
        console.log("Patient ID from params:", patientId);

        // Fetch completed appointments for this patient with the current doctor
        console.log("Fetching completed appointments with match criteria:", {
            patientId,
            doctorId,
            status: "Completed"
        });

        const appointments = await BookedAppointment.aggregate([
            {
                $match: {
                    patientId: patientId,
                    doctorId: doctorId,
                    status: "Completed" // Only fetch completed appointments
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
                                image: 1,
                                dob: 1
                            }
                        }
                    ],
                    as: "patientInfo"
                }
            },
            {
                $unwind: {
                    path: "$patientInfo",
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
                                image: "$patientInfo.image",
                                dob: "$patientInfo.dob"
                            },
                            else: null
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    dateRange: 1,
                    day: 1,
                    timeSlot: 1,
                    status: 1,
                    appointmentType: 1,
                    patient: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            },
            {
                $sort: {
                    "dateRange.startDate": -1 // Sort by date, newest first
                }
            }
        ]);

        console.log("Completed Appointments Data:", JSON.stringify(appointments, null, 2));
        console.log("Number of completed appointments found:", appointments.length);

        // Fetch patient reports for each appointment
        const patientReports = await Promise.all(
            appointments.map(async (appointment) => {
                console.log(`Fetching report for appointment ID: ${appointment._id}`);
                const report = await PatientReport.findOne({
                    'appointments.appointmentId': appointment._id
                });
                console.log(`Report found for appointment ${appointment._id}:`, report);
                return {
                    appointmentId: appointment._id,
                    report: report
                };
            })
        );

        console.log("All Patient Reports Data:", JSON.stringify(patientReports, null, 2));

        if (!appointments.length) {
            console.log("No completed appointments found for this patient");
            return NextResponse.json({
                success: false,
                message: "No completed appointments found for this patient"
            });
        }

        return NextResponse.json({ 
            success: true, 
            appointments: appointments,
            patientReports: patientReports
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching patient data:", error);
        return NextResponse.json({ 
            success: false, 
            error: "Failed to fetch patient data" 
        }, { status: 500 });
    }
} 