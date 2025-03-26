import mongoose from "mongoose";

const BookedAppointmentSchema = new mongoose.Schema(
    {
        doctorId: {
            type: String,
            required: true,
        },
        patientId: {
            type: String,
            required: true,
        },
        dateRange: {
            startDate: {
                type: Date,
                required: true,
            },
            endDate: {
                type: Date,
                required: true,
            },
        },
        day: {
            type: String,
            required: true,
        },
        timeSlot: {
            startTime: {
                type: String,
                required: true,
            },
            endTime: {
                type: String,
                required: true,
            },
        },
        status: {
            type: String,
            enum: ["Booked", "Pending", "Completed", "Cancelled"],
            default: "Pending",
        },
    },
    { timestamps: true }
);

const BookedAppointment = mongoose.models.BookedAppointment || mongoose.model("BookedAppointment", BookedAppointmentSchema);

export default BookedAppointment;
