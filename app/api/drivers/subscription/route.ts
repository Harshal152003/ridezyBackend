import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import DriverProfile from '@/models/DriverProfile';
import { verifyToken } from '@/lib/auth';

// Hardcoded plans – in a real system these would be in a Plans MongoDB collection
const SUBSCRIPTION_PLANS = [
    {
        _id: 'basic',
        name: 'Basic',
        price: 0,
        duration: 'month',
        description: 'Free tier. Platform commission applies.',
        features: ['Access trip feed', 'Standard support', 'No priority listing'],
        color: '#6B7280',
        popular: false,
        commission: 20,
    },
    {
        _id: 'pro',
        name: 'Pro',
        price: 999,
        duration: 'month',
        description: 'Priority listing and lower commission.',
        features: ['Priority in trip feed', '10% platform commission', 'Dedicated support', 'Monthly earnings report'],
        color: '#3B82F6',
        popular: true,
        commission: 10,
    },
    {
        _id: 'elite',
        name: 'Elite',
        price: 2499,
        duration: 'month',
        description: 'Zero commission and top placement.',
        features: ['Top placement in feed', '0% platform commission', '24/7 priority support', 'Earnings badge on profile'],
        color: '#8B5CF6',
        popular: false,
        commission: 0,
    },
];

// GET: Fetch plans and current subscription for the driver
export async function GET(req: Request) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user || user.role !== 'DRIVER') {
        return NextResponse.json({ error: 'Unauthorized: Drivers only' }, { status: 403 });
    }

    try {
        const driverProfile = await DriverProfile.findOne({ userId: user.userId }).lean();

        const sub = (driverProfile as any)?.subscription;
        const activePlan = sub?.plan || 'Basic';
        const expiry = sub?.expiry || null;

        return NextResponse.json({
            plan: activePlan,
            expiry,
            availablePlans: SUBSCRIPTION_PLANS,
        });
    } catch (error: any) {
        console.error('Subscription GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Subscribe to a plan
export async function POST(req: Request) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user || user.role !== 'DRIVER') {
        return NextResponse.json({ error: 'Unauthorized: Drivers only' }, { status: 403 });
    }

    try {
        const { planId } = await req.json();

        const plan = SUBSCRIPTION_PLANS.find(p => p._id === planId);
        if (!plan) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 1); // 1 month from now

        await DriverProfile.findOneAndUpdate(
            { userId: user.userId },
            { 'subscription.plan': plan.name, 'subscription.expiry': expiry },
            { new: true }
        );

        return NextResponse.json({ plan: plan.name, expiry: expiry.toISOString() });
    } catch (error: any) {
        console.error('Subscription POST Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Cancel subscription (revert to Basic)
export async function DELETE(req: Request) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user || user.role !== 'DRIVER') {
        return NextResponse.json({ error: 'Unauthorized: Drivers only' }, { status: 403 });
    }

    try {
        await DriverProfile.findOneAndUpdate(
            { userId: user.userId },
            { 'subscription.plan': 'Basic', 'subscription.expiry': new Date() }
        );

        return NextResponse.json({ message: 'Subscription cancelled' });
    } catch (error: any) {
        console.error('Subscription DELETE Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
