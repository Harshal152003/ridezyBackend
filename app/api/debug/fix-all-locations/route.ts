import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CarWashCenterProfile from '@/models/CarWashCenterProfile';

export async function GET(req: Request) {
    await dbConnect();
    try {
        const centers = await CarWashCenterProfile.collection.find({}).toArray();
        let fixedCount = 0;

        for (const center of centers) {
            // Check if it has legacy 'lat'/'lng' but no 'type: Point'
            if (center.location && (center.location.lat || center.location.lng) && center.location.type !== 'Point') {

                const newLocation = {
                    type: 'Point',
                    coordinates: [
                        center.location.lng || 0,
                        center.location.lat || 0
                    ],
                    address: center.location.address || ''
                };

                await CarWashCenterProfile.collection.updateOne(
                    { _id: center._id },
                    {
                        $set: {
                            location: newLocation,
                            isApproved: true, // Auto approve fixed centers
                            businessName: center.businessName === 'My Car Wash' ? 'Swastik Car Washing Center' : center.businessName // Try to fix name if generic
                        }
                    }
                );
                fixedCount++;
            }
            // Also ensure approved is true for testing if blocked
            else if (!center.isApproved) {
                await CarWashCenterProfile.collection.updateOne(
                    { _id: center._id },
                    { $set: { isApproved: true } }
                );
                fixedCount++;
            }
        }

        return NextResponse.json({ message: 'Bulk Fix Complete', fixedCount });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
