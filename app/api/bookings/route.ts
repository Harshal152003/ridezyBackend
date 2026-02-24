import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import WashBooking from '@/models/WashBooking';
import Notification from '@/models/Notification';
import { verifyToken } from '@/lib/auth';

// Create Booking
export async function POST(req: Request) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user || user.role !== 'OWNER') {
        return NextResponse.json({ error: 'Unauthorized: Owners only' }, { status: 403 });
    }

    try {
        const { centerId, vehicleId, scheduledTime, packageType, price } = await req.json();

        const booking = await WashBooking.create({
            ownerId: user.userId,
            centerId,
            vehicleId,
            scheduledTime: new Date(scheduledTime),
            packageType,
            price,
            status: 'PENDING',
        });

        // Create Notification for the Center
        try {
            await Notification.create({
                userId: centerId, // centerId is the UserID of the center owner
                type: 'booking',
                title: 'New Booking Request',
                message: `New ${packageType} booking for ${new Date(scheduledTime).toLocaleDateString()} at ${new Date(scheduledTime).toLocaleTimeString()}`,
                isRead: false,
                priority: 'high',
                actionType: 'booking_details',
                data: { bookingId: booking._id }
            });
        } catch (notifError) {
            console.error('Failed to create notification:', notifError);
            // Don't fail the booking if notification fails
        }

        return NextResponse.json({ message: 'Booking created', booking }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Get Bookings (Owner or Center)
export async function GET(req: Request) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let query = {};
    if (user.role === 'OWNER') {
        query = { ownerId: user.userId };
    } else if (user.role === 'CENTER') {
        query = { centerId: user.userId }; // Assuming centerId in Booking is UserID
    } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const bookings = await WashBooking.find(query)
        .populate('vehicleId', 'plateNumber model')
        .sort({ scheduledTime: -1 });

    return NextResponse.json({ bookings });
}
