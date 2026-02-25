import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import TripRequest from '@/models/TripRequest';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user || user.role !== 'OWNER') {
        return NextResponse.json({ error: 'Unauthorized: Owners only' }, { status: 403 });
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const { driverId } = body;

        if (!driverId) {
            return NextResponse.json({ error: 'Driver ID is required' }, { status: 400 });
        }

        const trip = await TripRequest.findById(id);

        if (!trip) {
            return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
        }

        // Only the creator of the trip can select a driver
        if (trip.ownerId.toString() !== user.userId) {
            return NextResponse.json({ error: 'Unauthorized: Not your trip' }, { status: 403 });
        }

        if (trip.status !== 'OPEN') {
            return NextResponse.json({ error: 'Trip is no longer open for driver selection' }, { status: 400 });
        }

        // Ensure the selected driver is actually in the interested list
        const interestedStr = (trip.interestedDrivers || []).map(id => id.toString());
        if (!interestedStr.includes(driverId.toString())) {
            return NextResponse.json({ error: 'Driver is not in the interested list' }, { status: 400 });
        }

        // Update the trip with the selected driver and change status
        trip.driverId = driverId;
        trip.status = 'ACCEPTED';

        // Optional: clear out interestedDrivers to save space since one is chosen
        trip.interestedDrivers = [];

        await trip.save();

        // Push Notification to the driver could be triggered here in a real app

        return NextResponse.json({ message: 'Driver selected successfully', trip });
    } catch (error: any) {
        console.error("Select Driver Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
