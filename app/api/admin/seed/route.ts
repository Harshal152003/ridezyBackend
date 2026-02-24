import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET(req: Request) {
    try {
        await dbConnect();
        const email = 'admin@ridezy.com';
        const password = 'admin@123';

        await User.findOneAndDelete({ email }); // Clear existing

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = await User.create({
            email,
            phone: '+919999999999',
            full_name: 'Super Admin',
            passwordHash,
            role: 'ADMIN',
            status: 'ACTIVE'
        });

        return NextResponse.json({ message: 'Admin reset done', user });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
