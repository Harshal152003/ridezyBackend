import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SubscriptionPlan from '@/models/SubscriptionPlan';

export async function GET() {
    await dbConnect();

    const plans = [
        {
            name: 'Basic Center',
            price: 999,
            duration: 'monthly',
            description: 'Essential tools for your car wash business',
            features: ['Up to 100 bookings/month', 'Basic Dashboard', 'Email Support'],
            targetRole: 'CENTER',
            active: true,
            color: '#3B82F6',
            popular: false
        },
        {
            name: 'Pro Center',
            price: 1999,
            duration: 'monthly',
            description: 'Advanced features for growing centers',
            features: ['Unlimited Bookings', 'Advanced Analytics', 'Priority Support', 'Marketing Tools'],
            targetRole: 'CENTER',
            active: true,
            color: '#8B5CF6',
            popular: true
        }
    ];

    const results = [];
    for (const plan of plans) {
        const exists = await SubscriptionPlan.findOne({ name: plan.name, targetRole: plan.targetRole });
        if (!exists) {
            const newPlan = await SubscriptionPlan.create(plan);
            results.push({ name: plan.name, status: 'created', id: newPlan._id });
        } else {
            results.push({ name: plan.name, status: 'exists', id: exists._id });
        }
    }

    const allPlans = await SubscriptionPlan.find({});

    return NextResponse.json({
        message: 'Seeding complete',
        results: results,
        totalPlansInDB: allPlans
    });
}
