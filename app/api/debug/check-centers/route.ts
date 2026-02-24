import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CarWashCenterProfile from '@/models/CarWashCenterProfile';

export async function GET(req: Request) {
    await dbConnect();
    try {
        // Native find to see raw data
        const centers = await CarWashCenterProfile.collection.find({}).toArray();
        return NextResponse.json({
            count: centers.length,
            centers: centers
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
