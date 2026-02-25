import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import TripRequest from '@/models/TripRequest';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

// GET: Returns all trips assigned to the current driver (their history: ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED)
export async function GET(req: Request) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user || user.role !== 'DRIVER') {
        return NextResponse.json({ error: 'Unauthorized: Drivers only' }, { status: 403 });
    }

    try {
        const trips = await TripRequest.find({ driverId: user.userId })
            .sort({ updatedAt: -1 })
            .lean();

        // Populate owner details for each trip
        const ownerIds = [...new Set(trips.map((t: any) => t.ownerId?.toString()).filter(Boolean))];
        const owners = await User.find({ _id: { $in: ownerIds } }).select('full_name phone').lean();
        const ownerMap = Object.fromEntries(owners.map((o: any) => [o._id.toString(), o]));

        const enriched = trips.map((t: any) => ({
            ...t,
            ownerId: {
                _id: t.ownerId,
                name: ownerMap[t.ownerId?.toString()]?.full_name || 'Owner',
                phone: ownerMap[t.ownerId?.toString()]?.phone || null,
            }
        }));

        return NextResponse.json({ trips: enriched });
    } catch (error: any) {
        console.error('Driver Trips History Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
