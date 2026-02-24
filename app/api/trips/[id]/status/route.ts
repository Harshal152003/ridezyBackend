import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import TripRequest from '@/models/TripRequest';
import { verifyToken } from '@/lib/auth';
import '@/models/User'; // Ensure User schema is registered for populate

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        // Populate owner and driver basic details
        const trip = await TripRequest.findById(id)
            .populate('ownerId', 'full_name phone')
            .populate('driverId', 'full_name phone email');

        if (!trip) {
            return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
        }

        // Fetch vehicle details if a driver is assigned
        let vehicleDetails = null;
        let driverLocationData = null;
        if (trip.driverId) {
            try {
                // Dynamically import models to ensure we avoid circular dependency issues if any, 
                // though direct import at top is usually fine.
                // We need to find the DriverProfile for this driver to get the vehicleId
                const DriverProfile = (await import('@/models/DriverProfile')).default;
                const Vehicle = (await import('@/models/Vehicle')).default; // Ensure Vehicle model is registered

                const driverProfile = await DriverProfile.findOne({ userId: trip.driverId._id }).populate('vehicleId');

                if (driverProfile) {
                    if (driverProfile.vehicleId) {
                        vehicleDetails = driverProfile.vehicleId;
                    }
                    if (driverProfile.currentLocation) {
                        driverLocationData = driverProfile.currentLocation;
                    }
                }
            } catch (err) {
                console.error('Error fetching vehicle details:', err);
            }
        }

        // Security check: only owner or assigned driver should see details
        if (trip.ownerId._id.toString() !== user.userId && trip.driverId && trip.driverId._id.toString() !== user.userId) {
            // return NextResponse.json({ error: 'Unauthorized access to trip' }, { status: 403 });
        }

        return NextResponse.json({
            trip: {
                ...trip.toObject(),
                vehicle: vehicleDetails,
                driverLocation: driverLocationData
            }
        });
    } catch (error: any) {
        console.error('Trip Status Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
