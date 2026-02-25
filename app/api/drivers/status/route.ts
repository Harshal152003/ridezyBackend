import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import DriverProfile from '@/models/DriverProfile';

export async function PATCH(req: Request) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user || user.role !== 'DRIVER') {
        return NextResponse.json({ error: 'Unauthorized: Drivers only' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { isAvailable } = body;

        if (typeof isAvailable !== 'boolean') {
            return NextResponse.json({ error: 'isAvailable boolean is required' }, { status: 400 });
        }

        const profile = await DriverProfile.findOneAndUpdate(
            { userId: user.userId },
            { isAvailable },
            { new: true }
        );

        if (!profile) {
            return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
        }

        return NextResponse.json({ isAvailable: profile.isAvailable, message: 'Status updated' });
    } catch (error: any) {
        console.error("Driver Status Update Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
