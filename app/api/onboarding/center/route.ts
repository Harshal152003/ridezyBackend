import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CarWashCenterProfile from '@/models/CarWashCenterProfile';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
    await dbConnect();

    const user = verifyToken(req);
    if (!user || user.role !== 'CENTER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { businessName, location, registrationDocUrl } = body;
        console.log('Center Onboarding Request:', { businessName, location });

        const center = await CarWashCenterProfile.create({
            userId: user.userId,
            businessName,
            location: {
                type: 'Point',
                coordinates: [location.lng || 0, location.lat || 0],
                address: location.address
            },
            registrationDocUrl,
            isApproved: true, // Auto-approve for dev
        });
        console.log('Center Profile Created:', center);

        await User.findByIdAndUpdate(user.userId, { status: 'APPROVED' });

        return NextResponse.json({ message: 'Center onboarding submitted', center }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
