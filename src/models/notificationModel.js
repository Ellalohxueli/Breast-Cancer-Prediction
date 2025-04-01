import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    appointmentDate: {
      type: Date,
      required: true
    },
    appointmentDay: {
      type: String,
      required: true
    },
    appointmentTime: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['cancelled', 'rescheduled'],
      default: 'pending'
    },
    isRead: {
      type: Boolean,
      default: false // notifications will be unread by default
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
  },
  {
    timestamps: true // This will automatically add createdAt and updatedAt fields
  }
);

// Add pre-save middleware for Malaysia timezone offset
notificationSchema.pre('save', function(next) {
    const malaysiaOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    this.updatedAt = new Date(this.updatedAt.getTime() + malaysiaOffset);
    if (this.isNew) {
        this.createdAt = new Date(this.createdAt.getTime() + malaysiaOffset);
    }
    next();
});

// Check if the model exists before creating it
const Notification = mongoose.models.notifications || mongoose.model("notifications", notificationSchema);

export default Notification;
