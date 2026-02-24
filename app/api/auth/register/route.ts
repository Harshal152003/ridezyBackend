import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();
        const { email, password, phone, role, fullName } = body;

        // Basic Validation
        if (!email || !password || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!['ADMIN', 'OWNER', 'DRIVER', 'CENTER'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            return NextResponse.json({ error: 'User with this email or phone already exists' }, { status: 409 });
        }

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create User
        const newUser = await User.create({
            email,
            phone,
            passwordHash,
            role,
            status: 'PENDING_ONBOARDING',
            full_name: fullName,
        });

        // Remove password from response
        const { passwordHash: _, ...userWithoutPass } = newUser.toObject();

        return NextResponse.json({ message: 'User registered successfully', user: userWithoutPass }, { status: 201 });
    } catch (error: any) {
        console.error('Registration Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
