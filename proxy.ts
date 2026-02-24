import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js 16 Proxy (formerly middleware)
 * Handles CORS for the Expo frontend
 */
export function proxy(request: NextRequest) {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
        const response = new NextResponse(null, { status: 204 });
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        response.headers.set('Access-Control-Max-Age', '86400');
        return response;
    }

    const response = NextResponse.next();

    // Set CORS headers for all other requests
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
}

// Only apply to /api paths
export const config = {
    matcher: '/api/:path*',
};
