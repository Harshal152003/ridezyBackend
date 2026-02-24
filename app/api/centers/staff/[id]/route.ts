import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user || user.role !== 'CENTER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const staffId = id;

        // Ensure the staff belongs to this center
        const staff = await User.findOne({
            _id: staffId,
            linkedCenterId: user.userId,
            role: 'CENTER_STAFF'
        });

        if (!staff) {
            return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
        }

        // Hard delete or Soft delete? Using Hard delete for now as per simple requirement.
        // Or update status to REJECTED/SUSPENDED if we want to keep history.
        // Let's use hard delete for simplicity unless they have bookings history attached...
        // Actually, if they are staff, they might be assigned to bookings (future feature).
        // Safest is to set status to 'REJECTED' or 'SUSPENDED' and remove linkedCenterId?
        // Let's just delete for now, assuming no heavy relations yet.
        await User.findByIdAndDelete(staffId);

        return NextResponse.json({ message: 'Staff removed successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
