import { connectToMongoDB } from "@/dbConfig/dbConfig";
import { NextResponse } from "next/server";
import BookedAppointment from "@/models/bookedAppointmentModel";
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

        // Fetch all appointments with patient info
        const allAppointments = await BookedAppointment.aggregate([
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
                    patient: 1
                }
            },
            {
                $sort: {
                    "dateRange.startDate": 1,
                    "timeSlot.startTime": 1
                }
            }
        ]);

        if (!allAppointments.length) {
            return NextResponse.json({
                success: false,
                message: "No appointments found"
            });
        }

        return NextResponse.json({ 
            success: true, 
            appointments: allAppointments,
            totalAppointments: allAppointments.length
        });

    } catch (error) {
        console.error("Error fetching all appointments:", error);
        return NextResponse.json({ 
            success: false, 
            error: "Failed to fetch appointments" 
        }, { status: 500 });
    }
} 