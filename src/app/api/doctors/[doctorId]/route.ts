import { connectToMongoDB } from "@/dbConfig/dbConfig";
import Doctor from "@/models/doctorModel";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const doctorId = url.pathname.split("/").pop();

        await connectToMongoDB();

        const doctor = await Doctor.where({ _id: doctorId });

        if (!doctor) {
            return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
        }

        return NextResponse.json(
            {
                doctorData: doctor,
            },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch doctor data" }, { status: 500 });
    }
}
