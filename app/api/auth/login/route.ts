import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_dev_only';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        // Find User
        const user = await User.findOne({ email });
        console.log(`Login Attempt: ${email} | Found: ${!!user}`);

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Check Password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        console.log(`Login Password Match for ${email}: ${isMatch} | Role: ${user.role} | Status: ${user.status}`);

        if (!isMatch) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Generate Token
        const token = jwt.sign(
            { userId: user._id, role: user.role, status: user.status },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        const { passwordHash, ...userData } = user.toObject();
        const responseUser = { ...userData, name: user.full_name };

        return NextResponse.json({ message: 'Login successful', token, user: responseUser }, { status: 200 });
    } catch (error: any) {
        console.error('Login Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
