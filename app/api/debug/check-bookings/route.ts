import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import WashBooking from '@/models/WashBooking';
import CarWashCenterProfile from '@/models/CarWashCenterProfile';

export async function GET(req: Request) {
    await dbConnect();
    try {
        const bookings = await WashBooking.find({})
            .populate('vehicleId')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        // Check if centerId matches a PROFILE ID or USER ID
        const debugBookings = await Promise.all(bookings.map(async (b) => {
            const asProfile = await CarWashCenterProfile.findOne({ _id: b.centerId });
            const asUser = await CarWashCenterProfile.findOne({ userId: b.centerId });

            return {
                id: b._id,
                status: b.status,
                vehicle: b.vehicleId?.plateNumber,
                centerId: b.centerId,
                isProfileId: !!asProfile, // If true, THIS IS THE BUG
                isUserId: !!asUser,       // determining if it matches a user's center
                createdAt: b.createdAt
            };
        }));

        return NextResponse.json({
            bookings: debugBookings
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
