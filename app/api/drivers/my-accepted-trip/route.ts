import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import TripRequest from '@/models/TripRequest';
import User from '@/models/User';
import DriverProfile from '@/models/DriverProfile';
import { verifyToken } from '@/lib/auth';

// GET: Returns the most recent ACCEPTED or IN_PROGRESS trip assigned to this driver.
// The Driver Dashboard polls this every 5 seconds to know when an owner selected them.
export async function GET(req: Request) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user || user.role !== 'DRIVER') {
        return NextResponse.json({ error: 'Unauthorized: Drivers only' }, { status: 403 });
    }

    try {
        const trip = await TripRequest.findOne({
            driverId: user.userId,
            status: { $in: ['ACCEPTED', 'IN_PROGRESS'] }
        })
            .sort({ updatedAt: -1 })
            .lean();

        if (!trip) {
            return NextResponse.json({ trip: null });
        }

        // Populate owner details so driver can see who/where they're going
        const owner = await User.findById(trip.ownerId).select('full_name phone').lean();

        return NextResponse.json({
            trip: {
                ...trip,
                ownerName: (owner as any)?.full_name || 'Owner',
                ownerPhone: (owner as any)?.phone || null,
            }
        });
    } catch (error: any) {
        console.error('My Accepted Trip Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
