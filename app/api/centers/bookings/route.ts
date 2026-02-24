import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import WashBooking from '@/models/WashBooking';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
    await dbConnect();

    const user = verifyToken(req);
    if (!user || user.role !== 'CENTER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const centerId = user.userId;

        // Fetch all bookings for this center
        const bookings = await WashBooking.find({ centerId })
            .populate('vehicleId') // Provide details about vehicle
            .populate('ownerId', 'full_name phone avatar') // Provide details about customer
            .sort({ createdAt: -1 });

        return NextResponse.json({ bookings });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
