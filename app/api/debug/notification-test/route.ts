import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';

export async function GET(req: Request) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    try {
        console.log(`Debug DB: creating notification for ${userId}`);
        const notif = await Notification.create({
            userId: userId,
            type: 'booking',
            title: 'Debug Booking Notification',
            message: `New Booking Simulation at ${new Date().toLocaleTimeString()}`,
            isRead: false,
            priority: 'high',
            actionType: 'booking_details',
            data: { test: true }
        });
        console.log('Debug DB: created', notif);
        return NextResponse.json({ success: true, notification: notif });
    } catch (error: any) {
        console.error('Debug DB Error:', error);
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
