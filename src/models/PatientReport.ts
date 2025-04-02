import mongoose, { Schema, Document } from 'mongoose';

// Interface for Appointment Info
interface IAppointmentInfo {
    doctorId: string;
    appointmentId: string;
    dateRange: {
        startDate: Date;
        day: string;
        timeSlot: {
            startTime: string;
        };
    };
    appointmentType: string;
}

// Interface for Mammogram Info
interface IMammogramInfo {
    image: string;
    predictionResult: string;
}

// Interface for Patient Report
export interface IPatientReport extends Document {
    patientId: string;
    appointments: IAppointmentInfo[];
    mammograms: IMammogramInfo[];
    description: string;
    medications: string[];
    createdAt: Date;
    updatedAt: Date;
}

// Create the schema
const PatientReportSchema: Schema = new Schema({
    patientId: {
        type: String,
        required: true,
        index: true
    },
    appointments: [{
        doctorId: {
            type: String,
            required: true
        },
        appointmentId: {
            type: String,
            required: true
        },
        dateRange: {
            startDate: {
                type: Date,
                required: true
            },
            day: {
                type: String,
                required: true
            },
            timeSlot: {
                startTime: {
                    type: String,
                    required: true
                }
            }
        },
        appointmentType: {
            type: String,
            required: true
        }
    }],
    mammograms: [{
        image: {
            type: String,
            required: true
        },
        predictionResult: {
            type: String,
            required: true
        }
    }],
    description: {
        type: String,
        required: true
    },
    medications: [{
        type: String,
        required: true
    }]
}, {
    timestamps: true // Automatically add createdAt and updatedAt fields
});

// Create and export the model
export default mongoose.models.PatientReport || mongoose.model<IPatientReport>('PatientReport', PatientReportSchema); 