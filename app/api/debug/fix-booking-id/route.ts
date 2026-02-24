import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import WashBooking from '@/models/WashBooking';
import CarWashCenterProfile from '@/models/CarWashCenterProfile';

export async function GET(req: Request) {
    await dbConnect();
    try {
        const bookings = await WashBooking.find({});
        let fixedCount = 0;

        for (const booking of bookings) {
            // Check if centerId is actually a Profile ID
            const profile = await CarWashCenterProfile.findOne({ _id: booking.centerId });

            if (profile) {
                // If found by _id, it means we stored the Profile ID! 
                // We should store profile.userId
                booking.centerId = profile.userId;
                await booking.save();
                fixedCount++;
            }
        }

        return NextResponse.json({ message: 'Fixed Bookings', fixedCount });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
