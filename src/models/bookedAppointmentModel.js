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
            enum: ["Booked", "Upcoming", "Completed", "Cancelled", "Rescheduled", "Ongoing"],
            default: "Pending",
        },
        appointmentType: {
            type: String,
            enum: ["Consultation", "Follow-up"],
            required: true
        },
        reviews: [{
            rating: {
                type: Number,
                min: 1,
                max: 5,
                required: true
            },
            review: {
                type: String,
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        }
    },
    { timestamps: true }
);

// Update the pre-save middleware to use Malaysia offset
BookedAppointmentSchema.pre('save', function(next) {
    const malaysiaOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    this.updatedAt = new Date(this.updatedAt.getTime() + malaysiaOffset);
    if (this.isNew) {
        this.createdAt = new Date(this.createdAt.getTime() + malaysiaOffset);
    }
    next();
});

const BookedAppointment = mongoose.models.BookedAppointment || mongoose.model("BookedAppointment", BookedAppointmentSchema);

export default BookedAppointment;
