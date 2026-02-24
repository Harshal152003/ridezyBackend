import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import CarWashCenterProfile from '@/models/CarWashCenterProfile';

export async function GET(req: Request) {
    await dbConnect();
    try {
        const users = await User.find({ role: 'CENTER' }).lean();
        const profiles = await CarWashCenterProfile.find({}).lean();

        return NextResponse.json({
            users: users.map(u => ({ id: u._id, name: u.full_name, email: u.email })),
            profiles: profiles.map(p => ({
                id: p._id,
                userId: p.userId,
                name: p.businessName,
                location: p.location
            }))
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
