import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import TripRequest from '@/models/TripRequest';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user || user.role !== 'DRIVER') {
        return NextResponse.json({ error: 'Unauthorized: Drivers only' }, { status: 403 });
    }

    try {
        // Fetch OPEN trips, excluding ones the driver has declined
        const trips = await TripRequest.find({
            status: 'OPEN',
            ignoredBy: { $ne: user.userId }
        })
            .sort({ createdAt: -1 })
            .populate('ownerId', 'full_name phone'); // Populate owner details if needed

        const enriched = trips.map((t: any) => {
            // Mock Distance/Time for now until map API integration
            const distance = t.distance || Math.floor(Math.random() * 15) + 3; // 3 to 18 km
            const estimatedTime = t.estimatedTime || Math.floor(distance * 3); // ~3 min per km

            return {
                ...t.toObject(),
                distance,
                estimatedTime,
            };
        });

        return NextResponse.json({ trips: enriched });
    } catch (error: any) {
        console.error('Trip Feed Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
