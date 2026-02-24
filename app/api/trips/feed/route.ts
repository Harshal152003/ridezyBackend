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
        // Fetch OPEN trips
        // TODO: Filter by location/radius in future
        const trips = await TripRequest.find({ status: 'OPEN' })
            .sort({ createdAt: -1 })
            .populate('ownerId', 'full_name phone'); // Populate owner details if needed

        return NextResponse.json({ trips });
    } catch (error: any) {
        console.error('Trip Feed Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
