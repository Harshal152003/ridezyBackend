import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CarWashCenterProfile from '@/models/CarWashCenterProfile';

export async function GET(req: Request) {
    await dbConnect();

    try {
        // Force creation of indexes defined in the schema
        await CarWashCenterProfile.ensureIndexes();

        // Explicitly create the 2dsphere index just in case
        await CarWashCenterProfile.collection.createIndex({ 'location.coordinates': '2dsphere' });

        return NextResponse.json({ message: 'Indexes created successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
