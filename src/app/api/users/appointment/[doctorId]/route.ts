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

        function timeStrToMinutes(time: string): number {
            const [hours, minutes] = time.split(":").map(Number);
            return hours * 60 + minutes;
        }

        function minutesToTimeStr(totalMinutes: number): string {
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
        }

        const availableAppointments = appointments
            .map((appointment: any) => {
                Object.keys(appointment.weeklySchedule).forEach((day: string) => {
                    const schedule = appointment.weeklySchedule[day];

                    // Separate time slots with duration
                    if (schedule && Array.isArray(schedule.timeSlots)) {
                        schedule.timeSlots = schedule.timeSlots.flatMap((slot: any) => {
                            const slotStartTime = timeStrToMinutes(slot.startTime);
                            const slotEndTime = timeStrToMinutes(slot.endTime);

                            const availableSlots = [];

                            // Create available slots
                            for (let i = slotStartTime; i < slotEndTime; i += appointment.duration) {
                                const newSlot = {
                                    startTime: minutesToTimeStr(i),
                                    endTime: minutesToTimeStr(i + appointment.duration),
                                };

                                availableSlots.push(newSlot);
                            }

                            return availableSlots;
                        });
                    }
                });

                // Return the appointment only if it has available time slots left
                return Object.keys(appointment.weeklySchedule).some((day) => {
                    const schedule = appointment.weeklySchedule[day];
                    return schedule && Array.isArray(schedule.timeSlots) && schedule.timeSlots.length > 0;
                })
                    ? appointment
                    : null;
            })
            .filter(Boolean); // filter out appointments that have no available slots

        return NextResponse.json({ doctor, appointments: availableAppointments, bookedAppointments }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}

function getDates(startDate: any, endDate: any) {
    return `${startDate.getDate()}-${startDate.getMonth() + 1}-${startDate.getFullYear()} - ${endDate.getDate()}-${endDate.getMonth() + 1}-${endDate.getFullYear()} `;
}
