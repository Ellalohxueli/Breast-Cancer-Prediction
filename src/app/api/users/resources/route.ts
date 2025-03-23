import { connectToMongoDB } from "@/dbConfig/dbConfig";
import Resource from "@/models/resourcesModel";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        await connectToMongoDB();
        
        const { searchParams } = new URL(request.url);
        const showAll = searchParams.get('showAll') === 'true';
        const category = searchParams.get('category');

        // If category is provided, fetch resources for that category
        if (category) {
            let query: any = {
                status: 'published'
            };

            // Handle different category selections
            if (category === 'Tips & Guides') {
                query.category = 'Tips & Guides';
            } else if (category === 'Latest News & Articles') {
                query.category = 'News & Articles';
            } else if (category === 'All Resources') {
                query.$or = [
                    { category: 'Tips & Guides' },
                    { category: 'News & Articles' }
                ];
            }

            console.log('Resource query:', query); // Debug log

            const resources = await Resource.find(query);
            console.log('Found resources:', resources); // Debug log

            return NextResponse.json({
                success: true,
                resources,
                message: `Found ${resources.length} resources`
            });
        }

        // Handle events query (existing code)
        const currentDate = new Date();
        const eventsQuery = {
            category: 'Events & Support Groups',
            eventDate: { $gte: currentDate }
        };

        let events = await Resource.find(eventsQuery)
            .sort({ eventDate: -1 });

        if (!showAll) {
            events = events.slice(0, 3);
        }

        return NextResponse.json({
            success: true,
            events,
            message: `Found ${events.length} events`
        });

    } catch (error) {
        console.error('Error fetching resources:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: "Failed to fetch resources",
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
