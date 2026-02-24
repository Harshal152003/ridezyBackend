import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CarWashService from '@/models/CarWashService';
import { verifyToken } from '@/lib/auth';

// GET: Fetch all services for the logged-in center
// GET: Fetch services (Public with centerId, or Private for logged-in Center)
export async function GET(req: Request) {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const centerId = searchParams.get('centerId');

    // Case 1: Public Fetch by Center ID
    if (centerId) {
        try {
            const services = await CarWashService.find({ centerId, isActive: true }).sort({ price: 1 });
            return NextResponse.json(services);
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    }

    // Case 2: Center Admin Config (Requires Auth)
    const user = verifyToken(req);

    if (!user || user.role !== 'CENTER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const services = await CarWashService.find({ centerId: user.userId }).sort({ createdAt: -1 });
        return NextResponse.json(services);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create a new service
export async function POST(req: Request) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user || user.role !== 'CENTER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const body = await req.json();

        // Basic validation
        if (!body.name || !body.price || !body.type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newService = await CarWashService.create({
            ...body,
            centerId: user.userId,
            isActive: true
        });

        return NextResponse.json(newService, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: Update a service
export async function PUT(req: Request) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user || user.role !== 'CENTER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { _id, ...updateData } = body;

        if (!_id) {
            return NextResponse.json({ error: 'Service ID required' }, { status: 400 });
        }

        const service = await CarWashService.findOne({ _id, centerId: user.userId });
        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }

        Object.assign(service, updateData);
        await service.save();

        return NextResponse.json(service);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Remove a service
export async function DELETE(req: Request) {
    await dbConnect();
    const user = verifyToken(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!user || user.role !== 'CENTER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!id) {
        return NextResponse.json({ error: 'Service ID required' }, { status: 400 });
    }

    try {
        const deleted = await CarWashService.findOneAndDelete({ _id: id, centerId: user.userId });
        if (!deleted) {
            return NextResponse.json({ error: 'Service not found or already deleted' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Service deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
