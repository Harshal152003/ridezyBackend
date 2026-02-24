import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Vehicle from '@/models/Vehicle';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const vehicles = await Vehicle.find({ ownerId: user.userId }).sort({ createdAt: -1 });
        return NextResponse.json({ vehicles });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
