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

        // Find all appointments for this doctor
        const allAppointments = await BookedAppointment.find({
            doctorId: doctorId
        }).sort({ 'dateRange.startDate': 1 });

        if (!allAppointments) {
            return NextResponse.json({
                success: false,
                message: "No appointments found"
            });
        }

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
                    "timeSlot.startTime": 1
                }
            }
        ]);

        // Calculate included and excluded patients counts
        const includedPatientsCount = allAppointments.filter(apt => 
            apt.status !== 'Cancelled' && apt.status !== 'Rescheduled'
        ).length;

        const excludedPatientsCount = allAppointments.filter(apt => 
            apt.status === 'Cancelled' || apt.status === 'Rescheduled'
        ).length;

        return NextResponse.json({ 
            success: true, 
            appointments,
            totalPatientsCount: allAppointments.length,
            includedPatientsCount,
            excludedPatientsCount
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching appointments:", error);
        return NextResponse.json({ 
            success: false, 
            error: "Failed to fetch appointments" 
        }, { status: 500 });
    }
}
