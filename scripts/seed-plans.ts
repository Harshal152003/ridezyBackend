import dbConnect from "@/lib/db";
import SubscriptionPlan from "@/models/SubscriptionPlan";

async function seedPlans() {
    await dbConnect();
    console.log("Seeding Subscription Plans...");

    const plans = [
        // CENTER Plans
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
        },
        // DRIVER Plans
        {
            name: 'Starter Driver',
            price: 199,
            duration: 'monthly',
            description: 'Get started with ride requests',
            features: ['50 Trips/month', 'Standard Support'],
            targetRole: 'DRIVER',
            active: true,
            color: '#10B981'
        },
        // OWNER Plans
        {
            name: 'Basic Wash',
            price: 299,
            duration: 'monthly',
            description: 'Keep your car clean',
            features: ['2 Washes/month', 'Exterior Only'],
            targetRole: 'OWNER',
            active: true,
            color: '#F59E0B'
        }
    ];

    for (const plan of plans) {
        const exists = await SubscriptionPlan.findOne({ name: plan.name, targetRole: plan.targetRole });
        if (!exists) {
            await SubscriptionPlan.create(plan);
            console.log(`Created plan: ${plan.name}`);
        } else {
            console.log(`Plan already exists: ${plan.name}`);
        }
    }
}

seedPlans().then(() => process.exit());
