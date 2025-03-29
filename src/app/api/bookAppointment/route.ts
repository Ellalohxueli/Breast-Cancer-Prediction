import { connectToMongoDB } from "@/dbConfig/dbConfig";
import Booked from "@/models/bookedAppointmentModel";
import type { NextApiResponse } from "next";
import { NextResponse } from "next/server";

export async function POST(req: Request, res: NextApiResponse) {
    try {
        await connectToMongoDB();

        const data = await req.json();

        const { doctorId, patientId, dateRange, day, timeSlot, appointmentType } = data;

        if (!doctorId || !patientId || !dateRange || !day || !timeSlot || !appointmentType) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newAppointment = new Booked({
            doctorId,
            patientId,
            dateRange,
            day,
            timeSlot: {
                startTime: timeSlot.startTime,
                endTime: timeSlot.endTime,
            },
            appointmentType,
            status: "Booked",
        });

        await newAppointment.save();

        return NextResponse.json({ message: "Appointment booked successfully" }, { status: 201 });
    } catch (error) {
        console.error("Error booking appointment:", error);
        return NextResponse.json({ error: error || "An unexpected error occurred" }, { status: 500 });
    }
}
