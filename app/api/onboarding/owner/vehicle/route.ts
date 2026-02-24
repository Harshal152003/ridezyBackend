import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Vehicle from '@/models/Vehicle';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
    await dbConnect();

    const user = verifyToken(req);
    if (!user || user.role !== 'OWNER') {
        return NextResponse.json({ error: 'Unauthorized or invalid role' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { make, model, plateNumber, rcDocumentUrl, insuranceUrl, year, color, type } = body;

        const vehicle = await Vehicle.create({
            ownerId: user.userId,
            make,
            model,
            plateNumber,
            rcDocumentUrl,
            insuranceUrl,
            year,
            color,
            type,
            isApproved: false,
        });

        // Optionally update status if this is the first step, but usually Owners can add multiple cars.
        // We might want to trigger PENDING_APPROVAL if this is their first car.
        await User.findByIdAndUpdate(user.userId, { status: 'PENDING_APPROVAL' });

        return NextResponse.json({ message: 'Vehicle added successfully', vehicle }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
