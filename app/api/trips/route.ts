import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import TripRequest from '@/models/TripRequest';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user || user.role !== 'OWNER') {
        return NextResponse.json({ error: 'Unauthorized: Owners only' }, { status: 403 });
    }

    // Check if Active?
    // if (user.status !== 'ACTIVE') {
    //    return NextResponse.json({ error: 'Account not active. Please complete onboarding.' }, { status: 403 });
    // }

    try {
        const body = await req.json();
        // Frontend sends: pickupLocation, dropoffLocation, date, time, vehicleType, tripType, passengers, specialInstructions, estimatedPrice
        const {
            pickupLocation, // Frontend sends location name
            pickupAddress, // Frontend sends detailed address
            pickupCoordinates,
            dropoffLocation,
            dropoffAddress,
            dropoffCoordinates,
            date,
            time,
            vehicleType,
            tripType,
            passengers,
            specialInstructions,
            estimatedPrice
        } = body;

        // Combine date and time to proper Date object if possible, 
        // or just use 'date' if it's a full ISO string (frontend sends .toISOString()).
        // For simplicity, using the 'date' field from frontend which is ISO.

        const trip = await TripRequest.create({
            ownerId: user.userId,
            pickupLocation,
            pickupCoords: pickupCoordinates, // Map frontend 'pickupCoordinates' to model 'pickupCoords'
            dropLocation: dropoffLocation,
            dropoffCoords: dropoffCoordinates, // Map frontend 'dropoffCoordinates' to model 'dropoffCoords'
            startTime: new Date(date),
            vehicleTypeRequested: vehicleType,
            tripType,
            passengers,
            specialInstructions,
            price: estimatedPrice,
            status: 'OPEN',
        });

        return NextResponse.json({ message: 'Trip requested', trip }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Get My Trips (Owner)
export async function GET(req: Request) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // If Owner, show their trips.
    if (user.role === 'OWNER') {
        const trips = await TripRequest.find({ ownerId: user.userId }).sort({ createdAt: -1 });
        return NextResponse.json({ trips });
    }

    return NextResponse.json({ error: 'Use /feed for drivers' }, { status: 400 });
}
