import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Vehicle from '@/models/Vehicle';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
    await dbConnect();

    const user = verifyToken(req);
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized: Admin only' }, { status: 403 });
    }

    try {
        const { type, id, action } = await req.json();

        if (!id || !type || !action) {
            return NextResponse.json({ error: 'Missing type, id, or action' }, { status: 400 });
        }

        if (!['APPROVE', 'REJECT'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        let result;

        if (type === 'DRIVER' || type === 'CENTER') {
            // For Users (Drivers/Centers), we update the User status
            const newStatus = action === 'APPROVE' ? 'ACTIVE' : 'REJECTED';
            result = await User.findByIdAndUpdate(id, { status: newStatus }, { new: true });

            if (!result) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        } else if (type === 'VEHICLE') {
            // For Vehicles, we update isApproved flag
            if (action === 'APPROVE') {
                result = await Vehicle.findByIdAndUpdate(id, { isApproved: true }, { new: true });

                // If the vehicle owner is an 'OWNER' (not a driver with a vehicle), 
                // and they were pending approval, verify them now.
                if (result) {
                    const owner = await User.findById(result.ownerId);
                    if (owner && owner.role === 'OWNER' && owner.status !== 'ACTIVE') {
                        await User.findByIdAndUpdate(owner._id, { status: 'ACTIVE' });
                        console.log(`Auto-activated OWNER ${owner._id} upon vehicle approval`);
                    }
                }
            } else {
                // If rejected, maybe we just leave it unapproved or delete it? 
                // For now, let's keep it unapproved but you might want a 'status' field on Vehicle too in future.
                // Or we can delete it. Let's just return success without changing to true.
                result = await Vehicle.findById(id);
            }

            if (!result) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
        } else {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        return NextResponse.json({ message: `Successfully ${action}D ${type}`, data: result });

    } catch (error: any) {
        console.error('Admin Action Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
