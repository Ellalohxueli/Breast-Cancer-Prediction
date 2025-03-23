import { connectToMongoDB } from "@/dbConfig/dbConfig";
import Service from "@/models/servicesModel";
import { NextRequest, NextResponse } from "next/server";

// POST - Create new service
export async function POST(request: NextRequest) {
    try {
        await connectToMongoDB();
        const body = await request.json();

        // Create a new service
        const newService = await Service.create({
            name: body.name,
            icon: body.icon,
            contents: body.contents.map((content: any) => ({
                subheader: content.subheader,
                description: content.description
            })),
            status: body.status
        });

        return NextResponse.json({
            message: "Service created successfully",
            success: true,
            service: newService
        });

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// GET - Fetch all services
export async function GET(request: NextRequest) {
    try {
        await connectToMongoDB();
        
        const id = request.nextUrl.searchParams.get('id');
        const searchQuery = request.nextUrl.searchParams.get('search');
        const status = request.nextUrl.searchParams.get('status');
        
        if (id) {
            const service = await Service.findById(id);
            if (!service) {
                return NextResponse.json(
                    { error: "Service not found" },
                    { status: 404 }
                );
            }
            return NextResponse.json({
                success: true,
                service
            });
        }
        
        // Build query for search and status
        let query: any = {};
        if (searchQuery) {
            query.name = { $regex: searchQuery, $options: 'i' };
        }
        if (status) {
            query.status = status;
        }
        
        const services = await Service.find(query)
            .sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            services
        });

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Delete a service
export async function DELETE(request: NextRequest) {
    try {
        await connectToMongoDB();
        
        // Get ID from search params
        const id = request.nextUrl.searchParams.get('id');
        
        if (!id) {
            return NextResponse.json(
                { error: "Service ID is required" },
                { status: 400 }
            );
        }

        const deletedService = await Service.findByIdAndDelete(id);

        if (!deletedService) {
            return NextResponse.json(
                { error: "Service not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: "Service deleted successfully",
            success: true
        });

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// Add PUT method for updating services
export async function PUT(request: NextRequest) {
    try {
        await connectToMongoDB();
        
        // Get ID from search params
        const id = request.nextUrl.searchParams.get('id');
        const body = await request.json();
        
        if (!id) {
            return NextResponse.json(
                { error: "Service ID is required" },
                { status: 400 }
            );
        }

        // Get current time in Malaysia timezone
        const malaysiaOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        const updatedAt = new Date(Date.now() + malaysiaOffset);

        // Update the service
        const updatedService = await Service.findByIdAndUpdate(
            id,
            {
                name: body.name,
                icon: body.icon,
                contents: body.contents.map((content: any) => ({
                    subheader: content.subheader,
                    description: content.description
                })),
                status: body.status,
                updatedAt: updatedAt // Add the updated timestamp
            },
            { new: true } // Return the updated document
        );

        if (!updatedService) {
            return NextResponse.json(
                { error: "Service not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: "Service updated successfully",
            success: true,
            service: updatedService
        });

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
