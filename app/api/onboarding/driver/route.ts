import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import DriverProfile from '@/models/DriverProfile';
import Vehicle from '@/models/Vehicle';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
    await dbConnect();

    // Auth Check
    const user = verifyToken(req);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'DRIVER') {
        return NextResponse.json({ error: 'Forbidden: Only DRIVERS can onboard here' }, { status: 403 });
    }

    try {
        const body = await req.json();

        // Destructure all expected fields from the frontend
        const {
            // Personal Info
            dateOfBirth,
            address,
            emergencyContact, // Name
            emergencyPhone,

            // Driving Experience
            licenseNumber,
            licenseExpiry,
            yearsExperience,
            previousWork,

            // Vehicle Information
            vehicleType,
            vehicleMake,
            vehicleModel,
            vehicleYear,
            vehicleNumber,
            vehicleColor,

            // Bank Details
            bankName,
            accountNumber,
            ifscCode,
            panNumber,

            // Documents (URLs)
            documents
        } = body;

        // 1. Create Vehicle Record
        const vehicle = await Vehicle.create({
            ownerId: user.userId, // Driver owns the vehicle in this context
            make: vehicleMake,
            model: vehicleModel,
            year: vehicleYear,
            color: vehicleColor,
            type: vehicleType,
            plateNumber: vehicleNumber,
            rcDocumentUrl: documents?.vehicleRC || '',
            insuranceUrl: documents?.insurance || '',
            isApproved: false, // Default
        });

        // 2. Create Driver Profile
        const profile = await DriverProfile.create({
            userId: user.userId,
            dateOfBirth,
            address,
            emergencyContact: {
                name: emergencyContact,
                phone: emergencyPhone
            },
            licenseNumber,
            licenseExpiry,
            licenseUrl: documents?.drivingLicense || '',
            experienceYears: Number(yearsExperience),
            previousWork,

            // Store all document URLs
            documents: {
                aadharCard: documents?.aadharCard,
                panCard: documents?.panCard,
                vehicleRC: documents?.vehicleRC,
                insurance: documents?.insurance,
                photo: documents?.photo,
            },

            vehicleId: vehicle._id,

            bankDetails: {
                bankName,
                accountNumber,
                ifscCode,
                panNumber,
            },

            isAvailable: true,
        });

        // 3. Update User Status
        await User.findByIdAndUpdate(user.userId, { status: 'PENDING_APPROVAL' });

        return NextResponse.json({
            message: 'Driver onboarding submitted successfully',
            profile,
            vehicle
        }, { status: 201 });

    } catch (error: any) {
        console.error("Onboarding Error:", error);
        return NextResponse.json({ error: error.message || 'Error processing request' }, { status: 500 });
    }
}
