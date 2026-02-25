import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import TripRequest from '@/models/TripRequest';

export async function GET(req: Request) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        let stats = {
            totalTrips: 0,
            recentActivityCount: 0,
            spending: 0,
        };

        if (user.role === 'OWNER') {
            const trips = await TripRequest.find({ ownerId: user.userId });
            stats.totalTrips = trips.length;
            stats.recentActivityCount = trips.filter(t => t.status === 'IN_PROGRESS' || t.status === 'ACCEPTED').length;
            stats.spending = trips.reduce((acc, curr) => acc + (curr.price || 0), 0);
        } else if (user.role === 'DRIVER') {
            const trips = await TripRequest.find({ driverId: user.userId });
            stats.totalTrips = trips.length;
            stats.recentActivityCount = trips.filter(t => t.status === 'IN_PROGRESS' || t.status === 'ACCEPTED').length;
            stats.spending = trips.reduce((acc, curr) => acc + (curr.price || 0), 0); // earnings
        }

        return NextResponse.json(stats);
    } catch (error: any) {
        console.error("Stats Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
