import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CarWashCenterProfile from '@/models/CarWashCenterProfile';

export async function GET(req: Request) {
    await dbConnect();

    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('query');
        const filter = searchParams.get('filter');
        const lat = parseFloat(searchParams.get('lat') || '0');
        const lng = parseFloat(searchParams.get('lng') || '0');
        const radius = parseInt(searchParams.get('radius') || '500000'); // Increased to 500km for testing

        console.log(`Search Query: lat=${lat}, lng=${lng}, radius=${radius}`);

        let centers;

        // 1. Geospatial Search (if coordinates provided)
        if (lat && lng) {
            const pipeline: any[] = [
                {
                    $geoNear: {
                        near: { type: 'Point', coordinates: [lng, lat] },
                        distanceField: 'dist.calculated',
                        maxDistance: radius,
                        spherical: true,
                        query: { /* isApproved: true */ } // Temporarily commented
                    }
                }
            ];

            if (query) {
                const regex = new RegExp(query, 'i');
                pipeline.push({
                    $match: {
                        $or: [
                            { businessName: regex },
                            { 'location.address': regex }
                        ]
                    }
                });
            }

            if (filter === 'subscribed') {
                pipeline.push({ $match: { subscriptionStatus: 'ACTIVE' } });
            }

            centers = await CarWashCenterProfile.aggregate(pipeline);
        } else {
            // 2. Fallback to Text Search
            let dbQuery: any = { /* isApproved: true */ };

            if (query) {
                const regex = new RegExp(query, 'i');
                dbQuery.$or = [
                    { businessName: regex },
                    { 'location.address': regex }
                ];
            }

            if (filter === 'subscribed') {
                dbQuery.subscriptionStatus = 'ACTIVE';
            }

            centers = await CarWashCenterProfile.find(dbQuery);
        }

        const mappedCenters = centers.map((center: any) => ({
            id: center.userId,
            name: center.businessName,
            address: center.location?.address || 'Address not available',
            rating: center.rating || 4.5,
            reviews: center.totalReviews || 0,
            image: center.coverImage || '🚗',
            isOpen: true,
            subscribed: center.subscriptionStatus === 'ACTIVE',
            services: ['Full Wash', 'Interior Clean'], // Placeholder
            price: 299,
            distance: center.dist?.calculated
                ? `${(center.dist.calculated / 1000).toFixed(1)} km`
                : 'Distance unknown',
            coordinates: {
                latitude: center.location?.coordinates?.[1] || 0,
                longitude: center.location?.coordinates?.[0] || 0
            }
        }));

        return NextResponse.json({ centers: mappedCenters });
    } catch (error: any) {
        console.error('Search API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
