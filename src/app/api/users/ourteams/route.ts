import { connectToMongoDB } from "@/dbConfig/dbConfig";
import Doctor from "@/models/doctorModel";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        await connectToMongoDB();
        const searchParams = request.nextUrl.searchParams;
        const specialty = searchParams.get('specialty');
        const searchTerm = searchParams.get('search');

        // Get unique specializations
        const specializations = await Doctor.distinct('specialization');
        
        // Build filter object
        let filter: any = {};
        
        if (specialty && specialty !== 'all') {
            filter.specialization = specialty;
        }

        if (searchTerm) {
            filter.$or = [
                { name: { $regex: searchTerm, $options: 'i' } },
                { specialization: { $regex: searchTerm, $options: 'i' } }
            ];
        }

        const doctors = await Doctor.find(filter, {
            name: 1,
            specialization: 1,
            bio: 1,
            image: 1,
            operatingHours: 1,
            status: 1
        });

        return NextResponse.json({
            message: "Doctors found successfully",
            data: doctors,
            specializations: specializations
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
