import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import TripRequest from '@/models/TripRequest';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user || user.role !== 'DRIVER') {
        return NextResponse.json({ error: 'Unauthorized: Drivers only' }, { status: 403 });
    }

    const { id } = await params;

    try {
        const trip = await TripRequest.findById(id);

        if (!trip) {
            return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
        }

        if (trip.status !== 'OPEN') {
            return NextResponse.json({ error: 'Trip is no longer open' }, { status: 400 });
        }

        // Initialize array if undefined
        if (!trip.interestedDrivers) {
            trip.interestedDrivers = [];
        }

        // Check if driver is already interested
        if (trip.interestedDrivers.includes(user.userId)) {
            return NextResponse.json({ message: 'Interest already sent' });
        }

        trip.interestedDrivers.push(user.userId);
        await trip.save();

        return NextResponse.json({ message: 'Interest sent successfully', trip });
    } catch (error: any) {
        console.error('Trip Interest Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
