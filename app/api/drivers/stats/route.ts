import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import TripRequest from '@/models/TripRequest';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        await connectToDatabase();
        const user = await verifyToken(req);

        if (!user || user.role !== 'DRIVER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const driverId = user.userId;

        // 1. Fetch Completed Trips for Stats
        const completedTrips = await TripRequest.find({
            driverId: driverId,
            status: 'COMPLETED'
        }).sort({ updatedAt: -1 });

        // Calculate Totals
        const totalTrips = completedTrips.length;
        const totalEarnings = completedTrips.reduce((sum, trip) => sum + (trip.price || 0), 0);

        // Mocking 'Online Hours' and 'Distance' for now as we don't track them yet
        const totalDistance = Math.floor(totalTrips * 12.5); // Avg 12.5 km per trip
        const totalHours = Math.floor(totalTrips * 0.8); // Avg 48 mins per trip

        // 2. Performance Data (Mocked breakdown for demo, can be refined with date filtering)
        const performanceData = {
            today: {
                earnings: totalEarnings * 0.1, // Mock 10% today
                trips: Math.ceil(totalTrips * 0.1),
                distance: Math.ceil(totalDistance * 0.1),
                hours: Math.ceil(totalHours * 0.1),
                acceptanceRate: 95,
                cancellationRate: 2,
                avgRating: 4.8,
                completionRate: 98,
            },
            week: {
                earnings: totalEarnings * 0.4,
                trips: Math.ceil(totalTrips * 0.4),
                distance: Math.ceil(totalDistance * 0.4),
                hours: Math.ceil(totalHours * 0.4),
                acceptanceRate: 92,
                cancellationRate: 3,
                avgRating: 4.8,
                completionRate: 96,
            },
            month: { // Assuming 'All Time' roughly equals month for new app
                earnings: totalEarnings,
                trips: totalTrips,
                distance: totalDistance,
                hours: totalHours,
                acceptanceRate: 90,
                cancellationRate: 5,
                avgRating: 4.7,
                completionRate: 95,
            },
        };

        // 3. fetch driver profile for extra details if needed
        const userDoc = await User.findById(driverId).select('name full_name email avatar phone vehicle');

        // Fetch DriverProfile to get documents
        const DriverProfileModel = require('@/models/DriverProfile').default;
        const driverProfileDoc = await DriverProfileModel.findOne({ userId: driverId }).lean();

        // 4. Recent Activities (from actual trips)
        const recentActivities = completedTrips.slice(0, 5).map(trip => ({
            id: trip._id,
            type: 'trip_completed',
            title: 'Trip Completed',
            subtitle: `${trip.pickupLocation.split(',')[0]} to ${trip.dropLocation.split(',')[0]}`,
            time: new Date(trip.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            icon: 'checkmark-circle',
            iconBg: '#00C851',
            amount: trip.price
        }));

        return NextResponse.json({
            success: true,
            driverProfile: {
                ...userDoc?.toObject(),
                ...driverProfileDoc, // Merge driver profile to include documents, licenseUrl, etc
                rating: 4.8, // Default or fetch from profile if added
                totalTrips
            },
            performanceData,
            recentActivities
        });

    } catch (error) {
        console.error('Error fetching driver stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
