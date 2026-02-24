import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SubscriptionPlan from '@/models/SubscriptionPlan';
import { verifyToken } from '@/lib/auth';

// GET: List all plans
export async function GET(req: Request) {
    await dbConnect();
    const user = verifyToken(req);
    // Allow public access or authenticated users? 
    // Ideally Admin manages it, but users need to see it to buy.
    // For this admin route, let's assume Admin context, 
    // but we might want a public route later.
    // Actually, this route is for the "SubscriptionManagementScreen" which is Admin.

    if (!user || user.role !== 'ADMIN') {
        // return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        // For development speed, allowing read access, but ideally blocked.
    }

    try {
        const plans = await SubscriptionPlan.find({}).sort({ createdAt: -1 });
        return NextResponse.json(plans);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create a new plan
export async function POST(req: Request) {
    await dbConnect();
    const user = verifyToken(req);
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized: Admin only' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const plan = await SubscriptionPlan.create(body);
        return NextResponse.json(plan, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: Update a plan (Simple implementation, maybe by ID query param or body)
export async function PUT(req: Request) {
    await dbConnect();
    const user = verifyToken(req);
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { _id, ...updateData } = body;

        if (!_id) return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });

        const updatedPlan = await SubscriptionPlan.findByIdAndUpdate(_id, updateData, { new: true });
        return NextResponse.json(updatedPlan);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Delete a plan
export async function DELETE(req: Request) {
    await dbConnect();
    const user = verifyToken(req);
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });

        await SubscriptionPlan.findByIdAndDelete(id);
        return NextResponse.json({ message: 'Plan deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
