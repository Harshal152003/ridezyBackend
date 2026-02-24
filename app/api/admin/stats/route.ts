import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Vehicle from '@/models/Vehicle';
import CarWashCenterProfile from '@/models/CarWashCenterProfile';
import WashBooking from '@/models/WashBooking';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
    await dbConnect();

    const user = verifyToken(req);
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized: Admin only' }, { status: 403 });
    }

    try {
        const pendingDrivers = await User.countDocuments({ role: 'DRIVER', status: 'PENDING_APPROVAL' });
        // For Car Owners, the approval task is primarily about Vehicles.
        const pendingCarOwners = await Vehicle.countDocuments({ isApproved: false });
        const pendingCarWash = await CarWashCenterProfile.countDocuments({ isApproved: false });
        const activeCarWash = await CarWashCenterProfile.countDocuments({ isApproved: true });

        const activeUsers = await User.countDocuments({ status: 'ACTIVE' });
        const activeDrivers = await User.countDocuments({ role: 'DRIVER', status: 'ACTIVE' });

        // Count active subscriptions (assuming anything not 'Basic' is a subscription, or use expiry)
        const activeSubscriptions = await CarWashCenterProfile.countDocuments({
            subscriptionPlan: { $ne: 'Basic' }
        });

        // Calculate Revenue from WashBookings
        const totalRevenueResult = await WashBooking.aggregate([
            { $match: { status: 'COMPLETED' } },
            { $group: { _id: null, total: { $sum: "$price" } } }
        ]);
        const totalRevenue = totalRevenueResult[0]?.total || 0;

        // Calculate Today's Revenue
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const todayRevenueResult = await WashBooking.aggregate([
            {
                $match: {
                    status: 'COMPLETED',
                    updatedAt: { $gte: startOfDay }
                }
            },
            { $group: { _id: null, total: { $sum: "$price" } } }
        ]);
        const todayRevenue = todayRevenueResult[0]?.total || 0;

        return NextResponse.json({
            pendingDrivers,
            pendingCarOwners,
            pendingCarWash,
            activeSubscriptions,
            totalRevenue,
            todayRevenue,
            activeUsers,
            activeDrivers,
            activeCarWash,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
