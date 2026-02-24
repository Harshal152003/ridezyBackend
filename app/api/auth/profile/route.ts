import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

export async function PATCH(req: Request) {
    try {
        await dbConnect();
        const authUser = verifyToken(req);
        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, full_name, address, email } = body;

        // Map 'name' from frontend to 'full_name' in DB if provided
        const updateData: any = {};
        if (name) updateData.full_name = name;
        if (full_name) updateData.full_name = full_name;
        if (address) updateData.address = address;
        if (email) updateData.email = email; // Optional, might want to restrict email changes

        const updatedUser = await User.findByIdAndUpdate(
            authUser.userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-passwordHash');

        return NextResponse.json({ user: updatedUser });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
