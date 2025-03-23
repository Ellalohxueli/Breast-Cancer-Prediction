import { connectToMongoDB } from "@/dbConfig/dbConfig";
import Doctor from "@/models/doctorModel";
import Appointment from "@/models/appointmentAvailabilityModel";
import { NextResponse } from "next/server";
import BookedAppointment from "@/models/bookedAppointmentModel";

export async function GET(req: Request) {
    try {
        const doctorId = req.url.split("/")[req.url.split("/").length - 1];

        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
        }

        const appointments = await Appointment.find({ doctorName: doctor.name });

        if (!appointments) {
            return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
        }

        const bookedAppointments = (await BookedAppointment.find({})).filter((appointment: any) => appointment.doctorId === doctorId);

        if (!bookedAppointments) {
            return NextResponse.json({ error: "Failed to fetch booked appointments" }, { status: 500 });
        }

        const bookedIds = bookedAppointments.map((appointment: any) => {
            return appointment.timeSlot.id;
        });

        const availableAppointments = appointments.filter((appointment: any) => {
            let hasBookedSlot = false;

            Object.keys(appointment.weeklySchedule).forEach((day: string) => {
                const schedule = appointment.weeklySchedule[day];
                if (schedule && Array.isArray(schedule.timeSlots)) {
                    if (schedule.timeSlots.some((slot: any) => bookedIds.includes(slot._id.toString()))) {
                        hasBookedSlot = true;
                    }
                }
            });

            return !hasBookedSlot;
        });

        return NextResponse.json({ doctor, appointments: availableAppointments }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}
