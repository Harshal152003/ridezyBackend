import User from '@/models/User';

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import WashBooking from '@/models/WashBooking';
import CarWashCenterProfile from '@/models/CarWashCenterProfile';
import '@/models/Vehicle'; // Register Vehicle schema
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user || user.role !== 'CENTER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const centerId = user.userId;
        console.log(`fetching dashboard for centerId: ${centerId}`);

        // 0. Fetch User Details for Name Fallback
        const userRecord = await User.findById(centerId);

        // 1. Fetch Center Profile
        let centerProfile = await CarWashCenterProfile.findOne({ userId: centerId });
        console.log(`centerProfile found: ${centerProfile ? 'YES' : 'NO'}`);
        if (centerProfile) console.log(`Center Name: ${centerProfile.businessName}`);

        if (!centerProfile) {
            // Fallback for users without a profile document
            centerProfile = {
                businessName: userRecord?.full_name || 'My Car Wash',
                location: { address: 'Address not set' },
                rating: 0,
                totalReviews: 0,
                subscriptionPlan: 'Basic',
                subscriptionExpiry: null,
            };
        }

        // 2. Date Ranges
        const now = new Date();

        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);

        const endOfYesterday = new Date(startOfToday); // 00:00 today is end of yesterday

        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // 3. Parallel Queries
        const [
            todayStats,
            yesterdayStats,
            weekStats,
            monthStatistics,
            totalRevenueResult,
            totalBookingsCount,
            pendingBookingsCount,
            recentBookings
        ] = await Promise.all([
            // Today
            WashBooking.aggregate([
                { $match: { centerId, scheduledTime: { $gte: startOfToday } } },
                {
                    $group: {
                        _id: null,
                        bookings: { $sum: 1 },
                        revenue: {
                            $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, "$price", 0] }
                        },
                        completedServices: {
                            $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] }
                        },
                        newCustomers: { $addToSet: "$ownerId" } // Will count size later
                    }
                }
            ]),

            // Yesterday (For comparison)
            WashBooking.aggregate([
                { $match: { centerId, scheduledTime: { $gte: startOfYesterday, $lt: endOfYesterday } } },
                {
                    $group: {
                        _id: null,
                        bookings: { $sum: 1 },
                        revenue: {
                            $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, "$price", 0] }
                        }
                    }
                }
            ]),

            // Week
            WashBooking.aggregate([
                { $match: { centerId, scheduledTime: { $gte: startOfWeek } } },
                {
                    $group: {
                        _id: null,
                        bookings: { $sum: 1 },
                        revenue: {
                            $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, "$price", 0] }
                        },
                        completedServices: {
                            $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] }
                        },
                        pendingBookings: {
                            $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] }
                        },
                        newCustomers: { $addToSet: "$ownerId" }
                    }
                }
            ]),

            // Month
            WashBooking.aggregate([
                { $match: { centerId, scheduledTime: { $gte: startOfMonth } } },
                {
                    $group: {
                        _id: null,
                        bookings: { $sum: 1 },
                        revenue: {
                            $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, "$price", 0] }
                        },
                        completedServices: {
                            $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] }
                        },
                        pendingBookings: {
                            $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] }
                        },
                        newCustomers: { $addToSet: "$ownerId" }
                    }
                }
            ]),

            WashBooking.aggregate([
                { $match: { centerId, status: 'COMPLETED' } },
                { $group: { _id: null, total: { $sum: '$price' }, count: { $sum: 1 } } }
            ]),

            // Total Lifetime Bookings
            WashBooking.countDocuments({ centerId }),

            // Pending Bookings (Total outstanding)
            WashBooking.countDocuments({ centerId, status: 'PENDING' }),

            // Recent Activities
            WashBooking.find({ centerId })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('vehicleId', 'plateNumber model')
        ]);

        const todayData = todayStats[0] || { bookings: 0, revenue: 0, completedServices: 0, pendingBookings: 0, newCustomers: [] };
        const weekData = weekStats[0] || { bookings: 0, revenue: 0, completedServices: 0, pendingBookings: 0, newCustomers: [] };
        const monthData = monthStatistics[0] || { bookings: 0, revenue: 0, completedServices: 0, pendingBookings: 0, newCustomers: [] };
        const yesterdayData = yesterdayStats[0] || { bookings: 0, revenue: 0 };

        // Helper to calc change
        const calcChange = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? '+100%' : '0%';
            const percent = ((current - previous) / previous) * 100;
            return (percent > 0 ? '+' : '') + percent.toFixed(1) + '%';
        };

        const dashboardData = {
            profile: {
                name: userRecord?.full_name || centerProfile.businessName || 'My Car Wash',
                address: centerProfile.location?.address || 'Location setup needed',
                rating: centerProfile.rating || 0,
                totalReviews: centerProfile.totalReviews || 0,
                subscriptionPlan: centerProfile.subscriptionPlan || 'Basic',
                subscriptionExpiry: centerProfile.subscriptionExpiry
            },
            today: {
                revenue: todayData.revenue,
                bookings: todayData.bookings,
                completedServices: todayData.completedServices,
                pendingBookings: pendingBookingsCount,
                newCustomers: (todayData.newCustomers as any[]).length,
                // Comparisons
                revenueChange: calcChange(todayData.revenue, yesterdayData.revenue),
                bookingsChange: calcChange(todayData.bookings, yesterdayData.bookings),
            },
            week: {
                revenue: weekData.revenue,
                bookings: weekData.bookings,
                completedServices: weekData.completedServices,
                pendingBookings: weekData.pendingBookings,
                newCustomers: (weekData.newCustomers || []).length,
            },
            month: {
                revenue: monthData.revenue,
                bookings: monthData.bookings,
                completedServices: monthData.completedServices,
                pendingBookings: monthData.pendingBookings,
                newCustomers: (monthData.newCustomers || []).length,
            },
            total: {
                revenue: totalRevenueResult[0]?.total || 0,
                bookings: totalBookingsCount,
                completedServices: totalRevenueResult[0]?.count || 0,
                pendingBookings: pendingBookingsCount,
            },
            recentActivities: recentBookings.map(b => ({
                id: b._id,
                type: 'booking',
                title: 'New Booking',
                subtitle: `${b.packageType} - ${b.vehicleId?.model || 'Vehicle'} (${b.vehicleId?.plateNumber || 'N/A'})`,
                time: new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: b.status
            }))
        };

        return NextResponse.json({ dashboardData });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
