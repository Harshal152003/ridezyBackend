import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import CarWashCenterProfile from '@/models/CarWashCenterProfile';
import WashBooking from '@/models/WashBooking';

export async function GET(req: Request) {
    await dbConnect();
    try {
        // 1. Identify valid user
        const correctUser = await User.findOne({ email: 'rohancarwashing@gmail.com' });
        if (!correctUser) return NextResponse.json({ error: 'User not found' });

        const correctUserId = correctUser._id;

        // 2. Identify target profile
        const targetProfile = await CarWashCenterProfile.findOne({ businessName: 'Rohan Car Washing' });
        if (!targetProfile) return NextResponse.json({ error: 'Profile not found' });

        const oldOwnerId = targetProfile.userId; // This is likely the orphan ID

        // 3. Cleanup existing profile for this user FIRST to avoid unique constraint error
        await CarWashCenterProfile.deleteOne({
            userId: correctUserId
        });

        // 4. Re-assign profile
        targetProfile.userId = correctUserId;
        await targetProfile.save();

        // 5. Move Bookings from old owner to new owner
        const updateResult = await WashBooking.updateMany(
            { centerId: oldOwnerId },
            { $set: { centerId: correctUserId } }
        );

        return NextResponse.json({
            message: 'Ownership Transferred',
            user: correctUser.full_name,
            profile: targetProfile.businessName,
            bookingsMoved: updateResult.modifiedCount
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
