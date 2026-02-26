import { NextResponse } from 'next/server';

export async function GET() {
    // Hardcoded global configuration for vehicle pricing & properties
    // In a fully dynamic app, this might come from a MongoDB 'Config' collection
    const pricingConfig = {
        vehicles: [
            {
                id: 'sedan',
                icon: '🚗',
                priceMultiplier: 1.0,
                pricePerKm: 15,
                capacity: '4 seats',
                features: ['AC', 'Comfortable', 'Standard Baggage']
            },
            {
                id: 'suv',
                icon: '🚙',
                priceMultiplier: 1.5,
                pricePerKm: 20,
                capacity: '6 seats',
                features: ['AC', 'Extra Legroom', 'Large Baggage']
            },
            {
                id: 'hatchback',
                icon: '🚕',
                priceMultiplier: 0.9,
                pricePerKm: 12,
                capacity: '4 seats',
                features: ['AC', 'Compact City Ride']
            },
            {
                id: 'luxury',
                icon: '🚘',
                priceMultiplier: 2.5,
                pricePerKm: 40,
                capacity: '4 seats',
                features: ['Premium Comfort', 'Top Rated Drivers', 'Water Bottle']
            }
        ]
    };

    return NextResponse.json(pricingConfig);
}
