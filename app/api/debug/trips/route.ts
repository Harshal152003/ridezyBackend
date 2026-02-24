import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import TripRequest from '@/models/TripRequest';

export async function GET(req: Request) {
    try {
        await dbConnect();
        const trips = await TripRequest.find({}).sort({ createdAt: -1 }).limit(10);
        return NextResponse.json({ count: trips.length, trips });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
