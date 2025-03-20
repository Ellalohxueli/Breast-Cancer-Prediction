import { connectToMongoDB } from "@/dbConfig/dbConfig";
import Doctor from "@/models/doctorModel";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";

// GET all doctors
export async function GET() {
    try {
        await connectToMongoDB();
        const doctors = await Doctor.find({}).select('-password'); // Exclude password from response
        return NextResponse.json(
            { message: "Doctors fetched successfully", data: doctors },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error fetching doctors:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// POST new doctor
export async function POST(request: NextRequest) {
    console.log('Starting doctor registration process...');
    
    try {
        const body = await request.json();
        console.log('Received request body:', {
            name: body.name,
            email: body.email,
            phone: body.phone,
            // Omit password from logging
        });

        // Validate required fields
        const requiredFields = ['name', 'email', 'phone', 'password'];
        for (const field of requiredFields) {
            if (!body[field]) {
                console.log(`Missing required field: ${field}`);
                return NextResponse.json(
                    { error: `${field.charAt(0).toUpperCase() + field.slice(1)} is required` },
                    { status: 400 }
                );
            }
        }

        try {
            // Connect to MongoDB
            console.log('Attempting to connect to MongoDB...');
            await connectToMongoDB();
            console.log('MongoDB connection successful');
        } catch (dbError: any) {
            console.error('MongoDB connection error:', dbError);
            return NextResponse.json(
                { error: "Database connection failed" },
                { status: 500 }
            );
        }

        // Check if doctor already exists
        console.log('Checking for existing doctor with email:', body.email);
        const existingDoctor = await Doctor.findOne({ email: body.email.toLowerCase() });
        if (existingDoctor) {
            console.log('Doctor with this email already exists');
            return NextResponse.json(
                { error: "A doctor with this email already exists" },
                { status: 400 }
            );
        }

        // Hash password
        console.log('Hashing password...');
        const hashedPassword = await bcryptjs.hash(body.password, 10);
        console.log('Password hashed successfully');

        // Create doctor data
        const doctorData = {
            name: body.name,
            email: body.email.toLowerCase(),
            password: hashedPassword,
            phone: body.phone,
            specialization: '',
            operatingHours: '',
            bio: '',
            image: '',
            status: 'Active'
        };

        console.log('Attempting to create new doctor...');
        const newDoctor = await Doctor.create(doctorData);
        console.log('Doctor created successfully with ID:', newDoctor._id);

        // Prepare response
        const doctorResponse = newDoctor.toObject();
        delete doctorResponse.password;

        return NextResponse.json(
            { 
                message: "Doctor registered successfully", 
                data: doctorResponse 
            },
            { status: 201 }
        );

    } catch (error: any) {
        console.error('Doctor registration error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code
        });
        
        if (error.code === 11000) {
            return NextResponse.json(
                { error: "A doctor with this email already exists" },
                { status: 400 }
            );
        }

        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map((err: any) => err.message);
            return NextResponse.json(
                { error: validationErrors.join(', ') },
                { status: 400 }
            );
        }

        // Send more detailed error message in development
        const errorMessage = process.env.NODE_ENV === 'development' 
            ? `Error: ${error.message}`
            : "Error registering doctor. Please try again.";

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

// PUT update doctor
export async function PUT(request: NextRequest) {
    try {
        await connectToMongoDB();
        const reqBody = await request.json();
        const { id, ...updateData } = reqBody;

        const doctor = await Doctor.findByIdAndUpdate(
            id,
            { ...updateData },
            { new: true, runValidators: true }
        );

        if (!doctor) {
            return NextResponse.json(
                { error: "Doctor not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Doctor updated successfully", data: doctor },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// DELETE doctor
export async function DELETE(request: NextRequest) {
    try {
        await connectToMongoDB();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: "Doctor ID is required" },
                { status: 400 }
            );
        }

        const doctor = await Doctor.findByIdAndDelete(id);

        if (!doctor) {
            return NextResponse.json(
                { error: "Doctor not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Doctor deleted successfully" },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
