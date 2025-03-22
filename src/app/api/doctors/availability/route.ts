import { NextRequest, NextResponse } from "next/server";
import { connectToMongoDB } from "@/dbConfig/dbConfig";
import AppointmentAvailability from '@/models/appointmentAvailabilityModel';

export async function POST(req: NextRequest) {
    try {
        await connectToMongoDB();

        const { doctorName, duration, dateRange, weeklySchedule, excludedDates } = await req.json();

        // Validate the input data
        if (!doctorName || !duration || !dateRange || !weeklySchedule) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create the appointment availability
        const availability = await AppointmentAvailability.create(
            {
                doctorName,
                duration,
                dateRange,
                weeklySchedule,
                excludedDates
            },
        );

        return NextResponse.json({ success: true, availability });
    } catch (error) {
        console.error('Error saving appointment availability:', error);
        return NextResponse.json({ error: 'Internal Server Error' + error}, { status: 500 });
    }
}
