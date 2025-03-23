import { connectToMongoDB } from "@/dbConfig/dbConfig";
import Resource from "@/models/resourcesModel";
import { NextRequest, NextResponse } from "next/server";

// GET handler - Fetch resources with optional filters
export async function GET(request: NextRequest) {
    try {
        await connectToMongoDB();
        const searchParams = request.nextUrl.searchParams;
        
        // First, update any draft resources that should be published today
        const malaysiaOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        const today = new Date(new Date().getTime() + malaysiaOffset);
        today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

        // Find and update draft resources that should be published
        await Resource.updateMany(
            {
                status: 'draft',
                publishDate: { $lte: today },
                category: { $in: ['Tips & Guides', 'News & Articles'] }
            },
            {
                $set: { 
                    status: 'published',
                    updatedAt: new Date(new Date().getTime() + malaysiaOffset)
                }
            }
        );

        // Continue with existing query logic
        const query: any = {};
        
        // Filter by category if provided
        const category = searchParams.get('category');
        if (category && category !== 'All Resources') {
            query.category = category;
        }

        // Filter by status if provided
        const status = searchParams.get('status');
        if (status && status !== 'all') {
            query.status = status;
        }

        // Filter by date range if provided
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        if (startDate && endDate) {
            query.publishDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // Search by title if provided
        const search = searchParams.get('search');
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        const resources = await Resource.find(query)
            .sort({ publishDate: -1 }) // Sort by publish date descending
            .exec();

        return NextResponse.json({
            message: "Resources fetched successfully",
            success: true,
            data: resources
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST handler - Create new resource
export async function POST(request: NextRequest) {
    try {
        await connectToMongoDB();
        const reqBody = await request.json();

        // Create new resource
        const newResource = await Resource.create(reqBody);

        return NextResponse.json({
            message: "Resource created successfully",
            success: true,
            data: newResource
        }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

// PUT handler - Update existing resource
export async function PUT(request: NextRequest) {
    try {
        await connectToMongoDB();
        
        // Get ID from either URL path or search params
        const pathname = request.nextUrl.pathname;
        let id;
        
        if (pathname.includes('/resources/')) {
            // Handle /api/admin/resources/{id} format
            id = pathname.split('/resources/')[1];
        } else {
            // Handle /api/admin/resources?id={id} format
            id = request.nextUrl.searchParams.get('id');
        }
        
        if (!id) {
            return NextResponse.json(
                { error: "Resource ID is required" },
                { status: 400 }
            );
        }

        const reqBody = await request.json();

        // Ensure dates are properly formatted with Malaysia timezone
        const malaysiaOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        const updateData = {
            ...reqBody,
            updatedAt: new Date(new Date().getTime() + malaysiaOffset),
            publishDate: new Date(reqBody.publishDate),
            eventDate: reqBody.eventDate ? new Date(reqBody.eventDate) : undefined
        };

        // Update resource
        const updatedResource = await Resource.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedResource) {
            return NextResponse.json(
                { error: "Resource not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: "Resource updated successfully",
            success: true,
            data: updatedResource
        });

    } catch (error: any) {
        console.error('Update error:', error);
        return NextResponse.json({ 
            error: error.message || "Failed to update resource" 
        }, { status: 400 });
    }
}

// DELETE handler - Delete resource
export async function DELETE(request: NextRequest) {
    try {
        await connectToMongoDB();
        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: "Resource ID is required" },
                { status: 400 }
            );
        }

        const deletedResource = await Resource.findByIdAndDelete(id);

        if (!deletedResource) {
            return NextResponse.json(
                { error: "Resource not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: "Resource deleted successfully",
            success: true
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
