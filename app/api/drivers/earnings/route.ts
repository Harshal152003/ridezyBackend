import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import TripRequest from '@/models/TripRequest';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user || user.role !== 'DRIVER') {
        return NextResponse.json({ error: 'Unauthorized: Drivers only' }, { status: 403 });
    }

    try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Fetch all completed trips for this driver
        const allCompletedTrips = await TripRequest.find({
            driverId: user.userId,
            status: 'COMPLETED'
        }).sort({ createdAt: -1 }).lean();

        const sumEarnings = (trips: any[]) => trips.reduce((acc, t) => acc + (t.price || 0), 0);

        const todayTrips = allCompletedTrips.filter(t => new Date(t.createdAt) >= startOfToday);
        const weekTrips = allCompletedTrips.filter(t => new Date(t.createdAt) >= startOfWeek);
        const monthTrips = allCompletedTrips.filter(t => new Date(t.createdAt) >= startOfMonth);

        // Build recent transactions list
        const transactions = allCompletedTrips.slice(0, 10).map(t => ({
            id: t._id,
            type: 'Trip Earnings',
            date: new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            amount: t.price || 0,
        }));

        const totalEarnings = sumEarnings(allCompletedTrips);

        return NextResponse.json({
            balance: totalEarnings,
            performance: {
                today: { earnings: sumEarnings(todayTrips), trips: todayTrips.length, hours: 0 },
                week: { earnings: sumEarnings(weekTrips), trips: weekTrips.length, hours: 0 },
                month: { earnings: sumEarnings(monthTrips), trips: monthTrips.length, hours: 0 },
            },
            transactions,
        });
    } catch (error: any) {
        console.error('Driver Earnings Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
