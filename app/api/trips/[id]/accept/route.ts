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

    // Additional check: Is driver ACTIVE?
    // if (user.status !== 'ACTIVE') ...

    const { id } = await params;

    try {
        // Atomic update to prevent race conditions
        const trip = await TripRequest.findOneAndUpdate(
            { _id: id, status: 'OPEN' }, // Condition
            {
                status: 'ACCEPTED',
                driverId: user.userId,
            },
            { new: true }
        );

        if (!trip) {
            return NextResponse.json({ error: 'Trip not found or already accepted' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Trip accepted successfully', trip });
    } catch (error: any) {
        console.error('Trip Accept Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
