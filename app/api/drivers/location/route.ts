import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import DriverProfile from '@/models/DriverProfile';
import { verifyToken } from '@/lib/auth';

export async function PATCH(req: Request) {
    try {
        await dbConnect();

        // 1. Verify Driver
        const user = await verifyToken(req);
        if (!user || user.role !== 'DRIVER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse Body
        const { latitude, longitude, heading } = await req.json();

        if (!latitude || !longitude) {
            return NextResponse.json({ error: 'Invalid location data' }, { status: 400 });
        }

        // 3. Update Driver Profile
        const updatedProfile = await DriverProfile.findOneAndUpdate(
            { userId: user.userId },
            {
                $set: {
                    currentLocation: {
                        lat: latitude,
                        lng: longitude,
                        heading: heading || 0
                    },
                    lastLocationUpdate: new Date()
                }
            },
            { new: true }
        );

        if (!updatedProfile) {
            return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error updating driver location:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    return PATCH(req);
}
