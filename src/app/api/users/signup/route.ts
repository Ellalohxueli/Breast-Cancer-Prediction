import { connectToMongoDB } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate required fields
        const requiredFields = ['firstname', 'lastname', 'email', 'phone', 'sex', 'dob', 'password'];
        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json(
                    { error: `${field.charAt(0).toUpperCase() + field.slice(1)} is required` },
                    { status: 400 }
                );
            }
        }

        // Connect to MongoDB
        await connectToMongoDB();

        // Check if user already exists
        const existingUser = await User.findOne({ email: body.email });
        if (existingUser) {
            return NextResponse.json(
                { error: "An account with this email already exists" },
                { status: 400 }
            );
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(body.password, 10);

        // Create new user
        const userData = {
            firstname: body.firstname,
            lastname: body.lastname,
            email: body.email.toLowerCase(), // Store email in lowercase
            phone: body.phone,
            sex: body.sex,
            dob: new Date(body.dob),
            password: hashedPassword,
            role: 'user'
        };

        const newUser = await User.create(userData);

        // Remove password from response
        const userResponse = newUser.toObject();
        delete userResponse.password;

        return NextResponse.json(
            { message: "User created successfully", user: userResponse },
            { status: 201 }
        );

    } catch (error: any) {
        console.error('Signup error:', error);
        
        // Handle mongoose validation errors
        if (error.code === 11000) {
            return NextResponse.json(
                { error: "An account with this email already exists" },
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

        return NextResponse.json(
            { error: "Error creating user. Please try again." },
            { status: 500 }
        );
    }
}