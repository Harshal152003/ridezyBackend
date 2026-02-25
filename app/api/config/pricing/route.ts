import { NextResponse } from 'next/server';

export async function GET() {
    // Hardcoded global configuration for vehicle pricing & properties
    // In a fully dynamic app, this might come from a MongoDB 'Config' collection
    const pricingConfig = {
        vehicles: [
            {
                id: 'sedan',
                icon: '🚗',
                pricePerKm: 15,
                capacity: '4 seats',
                features: ['AC', 'Comfortable', 'Standard Baggage']
            },
            {
                id: 'suv',
                icon: '🚙',
                pricePerKm: 20,
                capacity: '6 seats',
                features: ['AC', 'Extra Legroom', 'Large Baggage']
            },
            {
                id: 'hatchback',
                icon: '🚕',
                pricePerKm: 12,
                capacity: '4 seats',
                features: ['AC', 'Compact City Ride']
            },
            {
                id: 'luxury',
                icon: '🚘',
                pricePerKm: 40,
                capacity: '4 seats',
                features: ['Premium Comfort', 'Top Rated Drivers', 'Water Bottle']
            }
        ]
    };

    return NextResponse.json(pricingConfig);
}
