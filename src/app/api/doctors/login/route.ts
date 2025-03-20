import { connectToMongoDB } from "@/dbConfig/dbConfig";
import Doctor from "@/models/doctorModel";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

connectToMongoDB();

export async function POST(request: NextRequest) {
    try {
        const reqBody = await request.json();
        const { email, password } = reqBody;

        // Check if doctor exists
        const doctor = await Doctor.findOne({ email });
        if (!doctor) {
            return NextResponse.json(
                { error: "Doctor account not found" },
                { status: 400 }
            );
        }

        // Check if password is correct
        const validPassword = await bcryptjs.compare(password, doctor.password);
        if (!validPassword) {
            return NextResponse.json(
                { error: "Invalid password" },
                { status: 400 }
            );
        }

        // Create token data
        const tokenData = {
            id: doctor._id,
            email: doctor.email,
            role: 'doctor',
            firstname: doctor.firstname
        };

        // Create token
        const token = jwt.sign(tokenData, process.env.TOKEN_SECRET!, {
            expiresIn: "1d"
        });

        const response = NextResponse.json({
            message: "Login successful",
            success: true,
            role: 'doctor',
            name: doctor.name,
            image: doctor.image || '',
            token: token
        });

        response.cookies.set("token", token, {
            httpOnly: true
        });

        return response;

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 