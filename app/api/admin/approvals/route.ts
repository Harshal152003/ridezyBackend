import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Vehicle from '@/models/Vehicle';
import DriverProfile from '@/models/DriverProfile';
import CarWashCenterProfile from '@/models/CarWashCenterProfile'; // Ensure this model exists
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
    await dbConnect();

    const user = verifyToken(req);
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized: Admin only' }, { status: 403 });
    }

    try {
        const approvalItems: any[] = [];

        // 1. Drivers (All relevant statuses)
        const driverUsers = await User.find({
            role: 'DRIVER',
            status: { $in: ['PENDING_APPROVAL', 'ACTIVE', 'REJECTED'] }
        }).lean();

        // Enrich with Profile Data and their Vehicle
        if (driverUsers.length > 0) {
            const driverUserIds = driverUsers.map(u => u._id);
            const driverProfiles = await DriverProfile.find({ userId: { $in: driverUserIds } })
                .populate('vehicleId')
                .lean();

            driverUsers.forEach(u => {
                const profile = driverProfiles.find(p => p.userId.toString() === u._id.toString());
                if (profile) {
                    approvalItems.push({
                        type: 'DRIVER',
                        id: u._id,
                        name: u.full_name,
                        email: u.email,
                        phone: u.phone,
                        status: u.status,
                        registeredDate: u.createdAt,
                        photo: '👨‍✈️',

                        // Flattened details
                        licenseNumber: profile.licenseNumber,
                        licenseExpiry: profile.licenseExpiry,
                        experience: `${profile.experienceYears} years`,
                        address: profile.address,
                        emergencyContact: profile.emergencyContact,
                        gender: 'Male',

                        // Vehicle details
                        vehicleType: profile.vehicleId?.type || 'Unknown',
                        vehicleModel: profile.vehicleId?.model ? `${profile.vehicleId.make} ${profile.vehicleId.model}` : 'Unknown',
                        vehicleNumber: profile.vehicleId?.plateNumber || profile.licenseNumber,
                        vehicleColor: profile.vehicleId?.color || 'Unknown',
                        vehicleYear: profile.vehicleId?.year || '',

                        documents: profile.documents || {}
                    });
                }
            });
        }

        // 2. Vehicles (Car Owners) - Already fetching ALL
        const allVehicles = await Vehicle.find({}).populate('ownerId', 'full_name phone email').lean();

        allVehicles.forEach((v: any) => {
            const status = v.isApproved ? 'APPROVED' : 'PENDING';
            approvalItems.push({
                type: 'VEHICLE',
                id: v._id,
                ownerName: v.ownerId?.full_name || 'Unknown Owner',
                ownerPhone: v.ownerId?.phone,
                vehicleMake: v.make,
                vehicleModel: v.model,
                vehicleNumber: v.plateNumber,
                registeredDate: v.createdAt,
                rcDocumentUrl: v.rcDocumentUrl,
                insuranceUrl: v.insuranceUrl,
                status: status,
                year: v.year,
                color: v.color,
                vehicleType: v.type,
            });
        });


        // 3. Centers (Car Wash Centers - All relevant statuses)
        const centerUsers = await User.find({
            role: 'CENTER',
            status: { $in: ['PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'PENDING_ONBOARDING'] }
        }).lean();

        if (centerUsers.length > 0) {
            const centerUserIds = centerUsers.map(u => u._id);
            const centerProfiles = await CarWashCenterProfile.find({ userId: { $in: centerUserIds } }).lean();

            centerUsers.forEach(u => {
                const profile = centerProfiles.find(p => p.userId.toString() === u._id.toString());
                if (profile) {
                    approvalItems.push({
                        type: 'CENTER',
                        id: u._id,
                        name: profile.businessName || u.full_name,
                        ownerName: u.full_name,
                        email: u.email,
                        phone: u.phone,
                        status: u.status,
                        registeredDate: u.createdAt,
                        address: profile.address,

                        // Business Details
                        businessLicense: profile.businessLicense,
                        gstNumber: profile.gstNumber,
                        operatingHours: profile.operatingHours || '09:00 AM - 06:00 PM',
                        services: profile.services || ['Car Wash'],
                        documents: { license: profile.registrationDocUrl }
                    });
                }
            });
        }

        return NextResponse.json(approvalItems);

    } catch (error: any) {
        console.error('Admin Approvals Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
