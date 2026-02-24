import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(req: Request) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user || user.role !== 'CENTER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const staff = await User.find({
            linkedCenterId: user.userId,
            role: 'CENTER_STAFF',
            status: { $ne: 'REJECTED' } // Don't show soft-deleted/rejected staff
        }).select('-passwordHash');

        return NextResponse.json({ staff });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user || user.role !== 'CENTER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { full_name, phone, password } = await req.json();

        if (!full_name || !phone || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return NextResponse.json({ error: 'User with this phone already exists' }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newStaff = await User.create({
            full_name,
            phone,
            passwordHash,
            role: 'CENTER_STAFF',
            linkedCenterId: user.userId,
            status: 'ACTIVE',
            email: `${phone}@ridezy.local` // Placeholder email if unique constraint requires it
        });

        const { passwordHash: _, ...staffData } = newStaff.toObject();

        return NextResponse.json({ staff: staffData }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
