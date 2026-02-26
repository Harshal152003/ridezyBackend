import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import TripRequest from '@/models/TripRequest';
import User from '@/models/User';
import DriverProfile from '@/models/DriverProfile';
import Vehicle from '@/models/Vehicle';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const user = verifyToken(req);
    const { id } = await params;

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const trip = await TripRequest.findById(id).lean();

        if (!trip) {
            return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
        }

        // Check Access (Owner or Driver involved, or maybe any driver looking for feed)
        // For polling 'Find Driver', the owner is checking.
        if (user.role === 'OWNER' && trip.ownerId.toString() !== user.userId) {
            return NextResponse.json({ error: 'Unauthorized access to this trip' }, { status: 403 });
        }

        // If trip is accepted/assigned, populate driver details for the frontend
        if (trip.driverId) {
            // Fetch Driver User and Profile
            const driverUser = await User.findById(trip.driverId).lean();
            const driverProfile = await DriverProfile.findOne({ userId: trip.driverId }).populate('vehicleId').lean();

            if (driverUser && driverProfile) {
                // Construct the driver object expected by Frontend
                trip.driver = {
                    id: driverUser._id,
                    name: driverUser.full_name || 'Driver', // Fallback
                    avatar: driverUser.avatar || driverProfile.documents?.photo || '👨‍✈️',
                    rating: 4.8, // Mock or fetch from ratings model if exists
                    reviews: 120, // Mock
                    experience: `${driverProfile.experienceYears} years`,
                    vehicleModel: driverProfile.vehicleId?.model || 'Unknown Car',
                    vehicleNumber: driverProfile.vehicleId?.plateNumber || driverProfile.licenseNumber,
                    vehicleColor: driverProfile.vehicleId?.color || 'White',
                    documents: {
                        license: driverProfile?.licenseUrl || null,
                        aadhaar: driverProfile?.documents?.aadharCard || null,
                    },
                    eta: '5 min', // Real-time calculation or mock
                    phone: driverUser.phone,
                    features: ['AC', 'Music'], // Mock
                    fare: trip.price
                };
            }
        } else if (trip.status === 'OPEN' && trip.interestedDrivers && trip.interestedDrivers.length > 0) {
            // Fetch interested drivers array details
            const drivers = await User.find({ _id: { $in: trip.interestedDrivers } }).lean();
            const driverProfiles = await DriverProfile.find({ userId: { $in: trip.interestedDrivers } }).populate('vehicleId').lean();

            trip.interestedDriversDetails = drivers.map(dUser => {
                const dProfile = driverProfiles.find(p => p.userId.toString() === dUser._id.toString());
                return {
                    id: dUser._id,
                    name: dUser.full_name || 'Driver',
                    avatar: dUser.avatar || dProfile?.documents?.photo || '👨‍✈️',
                    rating: 4.8, // Mock
                    reviews: 120, // Mock
                    experience: `${dProfile?.experienceYears || 0} years`,
                    vehicleModel: dProfile?.vehicleId?.model || 'Unknown Car',
                    vehicleNumber: dProfile?.vehicleId?.plateNumber || dProfile?.licenseNumber,
                    vehicleColor: dProfile?.vehicleId?.color || 'White',
                    documents: {
                        license: dProfile?.licenseUrl || null,
                        aadhaar: dProfile?.documents?.aadharCard || null,
                    },
                    eta: '5 min', // Mock
                    phone: dUser.phone,
                    features: ['AC', 'Music'], // Mock
                    fare: trip.price
                };
            });
        }

        return NextResponse.json({ trip });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const user = verifyToken(req);
    const { id } = await params;

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { status } = body;

        const trip = await TripRequest.findById(id);
        if (!trip) {
            return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
        }

        // Only allowed roles should update
        // We assume driver or owner can update for now (Cancel/Start/Complete)
        // EXCEPTION: A driver can update an OPEN trip to ACCEPT or DECLINE it.
        const isRequestingDriver = user.role === 'DRIVER';
        const isTripOpen = trip.status === 'OPEN';

        if (
            trip.driverId?.toString() !== user.userId &&
            trip.ownerId?.toString() !== user.userId &&
            !(isRequestingDriver && isTripOpen)
        ) {
            return NextResponse.json({ error: 'Unauthorized to update this trip' }, { status: 403 });
        }

        if (status === 'DECLINED') {
            // Driver declined an open trip: Add to ignored array instead of cancelling globally
            if (!trip.ignoredBy) {
                trip.ignoredBy = [];
            }
            if (!trip.ignoredBy.includes(user.userId)) {
                trip.ignoredBy.push(user.userId);
            }
            // Do not actually change the status, keep it OPEN for others
            await trip.save();
            return NextResponse.json({ success: true, trip });
        }

        if (status) {
            console.log(`Updating trip ${id} status from ${trip.status} to ${status}`);
            trip.status = status;
        }

        await trip.save();
        console.log(`Trip ${id} updated successfully`);

        return NextResponse.json({ success: true, trip });
    } catch (error: any) {
        console.error("Trip Update Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
