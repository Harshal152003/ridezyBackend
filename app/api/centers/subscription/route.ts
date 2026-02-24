import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CarWashCenterProfile from '@/models/CarWashCenterProfile';
import SubscriptionPlan from '@/models/SubscriptionPlan';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user || user.role !== 'CENTER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const profile = await CarWashCenterProfile.findOne({ userId: user.userId });
        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

        // Fetch available plans for Centers
        const availablePlans = await SubscriptionPlan.find({ targetRole: 'CENTER', active: true }).sort({ price: 1 });

        return NextResponse.json({
            plan: profile.subscriptionPlan || 'Basic',
            expiry: profile.subscriptionExpiry,
            availablePlans: availablePlans,
            // Mocking billing history for now or could be empty
            billingHistory: [
                {
                    id: 'mock-1',
                    date: new Date().toISOString(),
                    amount: 0,
                    plan: 'Free Trial',
                    status: 'Paid',
                    method: 'System'
                }
            ]
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user || user.role !== 'CENTER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { planId, billingCycle } = await req.json(); // planId: 'basic', 'premium', 'enterprise'

        const profile = await CarWashCenterProfile.findOne({ userId: user.userId });
        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

        // Update Subscription
        // In real app, verify payment here.
        profile.subscriptionPlan = planId.charAt(0).toUpperCase() + planId.slice(1); // Capitalize

        // Set expiry (1 month or 1 year)
        const now = new Date();
        if (billingCycle === 'yearly') {
            now.setFullYear(now.getFullYear() + 1);
        } else {
            now.setMonth(now.getMonth() + 1);
        }
        profile.subscriptionExpiry = now;

        await profile.save();

        return NextResponse.json({
            message: 'Subscription updated',
            plan: profile.subscriptionPlan,
            expiry: profile.subscriptionExpiry
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
