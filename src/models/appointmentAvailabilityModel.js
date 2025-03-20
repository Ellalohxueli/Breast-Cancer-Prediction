import mongoose from 'mongoose';

// Schema for individual time slots
const timeSlotSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  }
});

// Schema for daily availability
const dailyAvailabilitySchema = new mongoose.Schema({
  isAvailable: {
    type: Boolean,
    default: false
  },
  timeSlots: [timeSlotSchema]
});

// Main appointment availability schema
const appointmentAvailabilitySchema = new mongoose.Schema({
  doctorName: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // Duration in minutes
    required: true,
    min: 1
  },
  dateRange: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  weeklySchedule: {
    SUN: dailyAvailabilitySchema,
    MON: dailyAvailabilitySchema,
    TUE: dailyAvailabilitySchema,
    WED: dailyAvailabilitySchema,
    THU: dailyAvailabilitySchema,
    FRI: dailyAvailabilitySchema,
    SAT: dailyAvailabilitySchema
  },
  excludedDates: [{
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      enum: ['single', 'range'],
      required: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
appointmentAvailabilitySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create the model if it doesn't exist, otherwise use the existing one
const AppointmentAvailability = mongoose.models.AppointmentAvailability || 
  mongoose.model('AppointmentAvailability', appointmentAvailabilitySchema);

export default AppointmentAvailability;