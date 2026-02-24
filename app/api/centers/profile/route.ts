import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CarWashCenterProfile from '@/models/CarWashCenterProfile';
import { verifyToken } from '@/lib/auth';

export async function PATCH(req: Request) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user || user.role !== 'CENTER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { businessName, location, subscriptionPlan, logo, contactPhone, description } = body;
        console.log('PATCH Profile Request:', { userId: user.userId, location });

        // Find and update, or create if missing (upsert option not ideal if validation needed, but okay here)
        // We'll try to find first.
        let profile = await CarWashCenterProfile.findOne({ userId: user.userId });

        if (!profile) {
            // Create new if missing (migrating old user)
            // validation: need name and doc. If doc missing, use placeholder or require it.
            // For now, allow partial update / creation with defaults if criticals are mostly there
            profile = new CarWashCenterProfile({
                userId: user.userId,
                businessName: businessName || 'My Car Wash',
                location: location || { address: 'Not Set' },
                registrationDocUrl: 'pending_upload', // Placeholder for legacy migration
                isApproved: false
            });
        } else {
            // Update fields
            if (businessName) profile.businessName = businessName;
            if (location) {
                profile.location = {
                    type: 'Point',
                    coordinates: [location.lng || 0, location.lat || 0],
                    address: location.address
                };
            }
            if (subscriptionPlan) profile.subscriptionPlan = subscriptionPlan;
            if (logo !== undefined) profile.logo = logo;
            if (contactPhone !== undefined) profile.contactPhone = contactPhone;
            if (description !== undefined) profile.description = description;
        }

        await profile.save();

        return NextResponse.json({ message: 'Profile updated', profile });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
