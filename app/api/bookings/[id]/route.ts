import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import WashBooking from '@/models/WashBooking';
import { verifyToken } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const user = verifyToken(req);
    const { id } = await params;

    if (!user || user.role !== 'CENTER') {
        return NextResponse.json({ error: 'Unauthorized: Centers only' }, { status: 403 });
    }

    try {
        const { status } = await req.json();

        if (!['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        // Verify booking belongs to this center
        const booking = await WashBooking.findOne({ _id: id, centerId: user.userId });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        booking.status = status;
        await booking.save();

        return NextResponse.json({ message: 'Booking updated', booking });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
