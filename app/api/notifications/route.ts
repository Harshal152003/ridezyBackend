import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import { verifyToken } from '@/lib/auth';

// GET: Fetch all notifications for the user
export async function GET(req: Request) {
    await dbConnect();
    const user = verifyToken(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const notifications = await Notification.find({ userId: user.userId })
            .sort({ createdAt: -1 }) // Newest first
            .limit(50); // Limit to last 50 for performance

        return NextResponse.json({ notifications });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create a notification (Internal use or admin)
export async function POST(req: Request) {
    await dbConnect();
    // In real app, restrict this to Admin or internal services
    const user = verifyToken(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const notification = await Notification.create({
            ...body,
            userId: body.userId || user.userId // Allow sending to others if admin, else self
        });
        return NextResponse.json({ message: 'Notification created', notification }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
