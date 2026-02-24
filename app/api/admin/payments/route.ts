import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PaymentTransaction from '@/models/PaymentTransaction';
import SubscriptionPlan from '@/models/SubscriptionPlan'; // Needed for plan details in transactions
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
    await dbConnect();
    const user = verifyToken(req);
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized: Admin only' }, { status: 403 });
    }

    try {
        // 1. Total Revenue
        const totalRevenueAgg = await PaymentTransaction.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalRevenue = totalRevenueAgg[0]?.total || 0;

        // 2. Revenue by Source (using lookup or separate queries if we stored user role in transaction, which we didn't explicitly, 
        //    but we can join with User model)
        //    Optimized approach: Store 'userRole' in PaymentTransaction for analytics, but for now let's mock or use simple logic.
        //    Let's just return 0s if no data or try to lookup.

        // Mocking breakdown for now as we don't have enough seed data to make complex aggregation interesting.
        // In real app: $lookup from users collection to get role, then group by role.

        // 3. Recent Transactions
        const recentTransactions = await PaymentTransaction.find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('userId', 'full_name role') // Get user name
            .populate('planId', 'name') // Get plan name
            .lean();

        const formattedTransactions = recentTransactions.map(t => ({
            id: t._id,
            type: 'subscription', // hardcoded for now
            source: t.userId?.role?.toLowerCase() || 'unknown',
            userName: t.userId?.full_name || 'Unknown User',
            planName: t.planId?.name || 'Unknown Plan',
            amount: t.amount,
            date: t.createdAt,
            status: t.status,
            paymentMethod: t.paymentMethod,
            transactionId: t.transactionId
        }));

        // 4. Return Data structure matching PaymentOverviewScreen
        return NextResponse.json({
            totalRevenue,
            todayRevenue: 0, // Implement date filtering
            weekRevenue: 0,
            monthRevenue: totalRevenue, // simplified
            yearRevenue: totalRevenue,
            pendingPayments: 0,

            ownerRevenue: 0, // TODO: Implement robust aggregation
            driverRevenue: 0,
            carwashRevenue: 0,

            activeSubscriptions: 0,
            expiringThisWeek: 0,
            expiringThisMonth: 0,
            renewalRate: 100,

            transactions: formattedTransactions,
            expiringSubscriptions: [] // TODO: Implement
        });

    } catch (error: any) {
        console.error('Payment Stats Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
