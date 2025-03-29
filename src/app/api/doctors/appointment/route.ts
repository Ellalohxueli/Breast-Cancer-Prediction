import { connectToMongoDB } from "@/dbConfig/dbConfig";
import { NextResponse } from "next/server";
import BookedAppointment from "@/models/bookedAppointmentModel";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

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

        // Get today's date range (start of day to end of day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Fetch today's appointments
        const appointments = await BookedAppointment.aggregate([
            {
                $match: {
                    doctorId: doctorId,
                    "dateRange.startDate": {
                        $gte: today,
                        $lt: tomorrow
                    }
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
                                image: "$patientInfo.image"
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
                    "timeSlot.startTime": 1
                }
            }
        ]);

        // Log the appointments for debugging
        console.log('Fetched appointments:', JSON.stringify(appointments, null, 2));

        return NextResponse.json({ 
            success: true, 
            appointments 
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching appointments:", error);
        return NextResponse.json({ 
            success: false, 
            error: "Failed to fetch appointments" 
        }, { status: 500 });
    }
}
