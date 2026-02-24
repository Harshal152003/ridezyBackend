import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import { verifyToken } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const user = verifyToken(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;
        console.log(`Debug Notification Read: id=${id}, userId=${user.userId}`);

        if (id === 'all') {
            await Notification.updateMany(
                { userId: user.userId, isRead: false },
                { isRead: true }
            );
            return NextResponse.json({ message: 'All marked as read' });
        }

        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId: user.userId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Marked as read', notification });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
