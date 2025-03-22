import { NextResponse } from "next/server";

export async function GET() {
    const response = NextResponse.json({ message: "Logout successful" });

    // Remove the 'token' cookie
    response.cookies.delete({ name: "token", path: "/" });

    return response;
}
