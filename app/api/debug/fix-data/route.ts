import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CarWashCenterProfile from '@/models/CarWashCenterProfile';

export async function GET(req: Request) {
    await dbConnect();
    try {
        // Force update using dot notation to ensure fields are written
        const result = await CarWashCenterProfile.collection.updateMany(
            {},
            {
                $set: {
                    "businessName": "Rohan Car Washing",
                    "location": {
                        "type": "Point",
                        "coordinates": [73.8228155, 18.4450962],
                        "address": "Dhayari, Haveli, Pune, Maharashtra, 411041, India"
                    },
                    "isApproved": true
                }
            }
        );

        return NextResponse.json({
            message: 'Data fixed via Native Driver (Retry)',
            acknowledged: result.acknowledged,
            modifiedCount: result.modifiedCount
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
