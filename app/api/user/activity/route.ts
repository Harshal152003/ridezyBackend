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
        let activities: any[] = [];

        // Fetch recent trips as activity
        if (user.role === 'OWNER') {
            const trips = await TripRequest.find({ ownerId: user.userId })
                .sort({ createdAt: -1 })
                .limit(5)
                .lean();

            activities = trips.map(t => ({
                id: t._id,
                type: 'TRIP',
                title: `Trip to ${t.dropLocation}`,
                status: t.status,
                date: t.createdAt,
                amount: t.price
            }));
        } else if (user.role === 'DRIVER') {
            const trips = await TripRequest.find({ driverId: user.userId })
                .sort({ createdAt: -1 })
                .limit(5)
                .lean();

            activities = trips.map(t => ({
                id: t._id,
                type: 'EARNING',
                title: `Trip to ${t.dropLocation}`,
                status: t.status,
                date: t.createdAt,
                amount: t.price
            }));
        }

        return NextResponse.json({ activities });
    } catch (error: any) {
        console.error("Activity Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
