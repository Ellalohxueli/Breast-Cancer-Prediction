import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const token = request.cookies.get("token");

    if (!token) {
        return NextResponse.json({ message: "No token cookie found" }, { status: 401 });
    }

    return NextResponse.json({ message: "Token cookie is valid", status: 200 });
}
