import { connectToMongoDB } from "@/dbConfig/dbConfig";
import { NextResponse } from "next/server";
import BookedAppointment from "@/models/bookedAppointmentModel";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export async function GET(req: Request) {
    try {
        await connectToMongoDB();

        // Get user ID from token
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ 
                success: false, 
                error: "Unauthorized" 
            }, { status: 401 });
        }

        const decodedToken: any = jwt.verify(token, process.env.TOKEN_SECRET!);
        const userId = decodedToken.id;

        // Convert string IDs to ObjectIds for proper matching
        const appointments = await BookedAppointment.aggregate([
            {
                $match: {
                    patientId: userId
                }
            },
            {
                $lookup: {
                    from: "doctors",
                    let: { doctorId: "$doctorId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { 
                                    $eq: ["$_id", { $toObjectId: "$$doctorId" }] 
                                }
                            }
                        }
                    ],
                    as: "doctorInfo"
                }
            },
            {
                $addFields: {
                    doctor: {
                        $cond: {
                            if: { $gt: [{ $size: "$doctorInfo" }, 0] },
                            then: { $arrayElemAt: ["$doctorInfo", 0] },
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
                    reviews: 1,
                    doctor: {
                        _id: "$doctor._id",
                        name: "$doctor.name",
                        specialization: "$doctor.specialization",
                        image: "$doctor.image"
                    }
                }
            },
            {
                $sort: {
                    "dateRange.startDate": 1
                }
            }
        ]);

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
