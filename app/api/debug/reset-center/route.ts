import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CarWashCenterProfile from '@/models/CarWashCenterProfile';
import mongoose from 'mongoose';

export async function GET(req: Request) {
    await dbConnect();
    try {
        // 1. Delete all existing centers
        await CarWashCenterProfile.collection.deleteMany({});

        // 2. Create fresh one with correct user link (I need the userId)
        // I will fetch the FIRST user found or specific one. 
        // For now, I'll assume the user logged in is the one we want, but I don't have auth here.
        // I will query User collection to find the user named 'Rohan' or similar if possible.
        // OR just leave userId as a valid ObjectId placeholder if exact link isn't strictly required for Search (it is not).
        // But for dashboard to work, userId must match.
        // Let's Find the user who owns the "My Car Wash" or "Rohan Car Washing" before deleting.

        // BETTER: Find the `userId` from the existing record BEFORE deleting.
        const existing = await CarWashCenterProfile.collection.findOne({});
        const userId = existing ? existing.userId : new mongoose.Types.ObjectId(); // Fallback

        const newCenter = {
            userId: userId,
            businessName: "Rohan Car Washing",
            location: {
                type: 'Point',
                coordinates: [73.8228155, 18.4450962],
                address: "Dhayari, Haveli, Pune, Maharashtra, 411041, India"
            },
            registrationDocUrl: "https://via.placeholder.com/150",
            isApproved: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            __v: 0
        };

        await CarWashCenterProfile.collection.insertOne(newCenter);

        // 3. Ensure Index again
        await CarWashCenterProfile.collection.createIndex({ 'location.coordinates': '2dsphere' });

        return NextResponse.json({ message: 'Hard Reset Complete', newCenter });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
