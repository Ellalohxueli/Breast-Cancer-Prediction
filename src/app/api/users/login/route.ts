import { connectToMongoDB  } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

connectToMongoDB ();

export async function POST(request: NextRequest) {
    try {
        const reqBody = await request.json();
        const { email, password } = reqBody;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json(
                { error: "User does not exist" },
                { status: 400 }
            );
        }

        // Check if password is correct
        const validPassword = await bcryptjs.compare(password, user.password);
        if (!validPassword) {
            return NextResponse.json(
                { error: "Invalid password" },
                { status: 400 }
            );
        }

        // Create token data
        const tokenData = {
            id: user._id,
            email: user.email,
            role: user.role,
            firstname: user.firstname
        };

        // Create token
        const token = jwt.sign(tokenData, process.env.TOKEN_SECRET!, {
            expiresIn: "1d"
        });

        const response = NextResponse.json({
            message: "Login successful",
            success: true,
            role: user.role,
            firstname: user.firstname,
            userId: user._id,
            token: token
        });

        response.cookies.set("token", token, {
            httpOnly: true, 
            secure: process.env.NODE_ENV === "production", 
            sameSite: "strict", 
            path: '/' 
        });

        return response;

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
