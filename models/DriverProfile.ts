import mongoose from 'mongoose';

const DriverProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    dateOfBirth: { type: String },
    address: { type: String },
    emergencyContact: {
        name: String,
        phone: String,
    },
    licenseNumber: { type: String, required: true },
    licenseExpiry: { type: String },
    licenseUrl: { type: String, required: true }, // URL to stored file
    experienceYears: { type: Number, required: true },
    previousWork: { type: String },

    // Document URLs
    documents: {
        aadharCard: String,
        panCard: String,
        vehicleRC: String,
        insurance: String,
        photo: String,
    },

    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
    },

    isAvailable: { type: Boolean, default: false },
    currentLocation: {
        lat: Number,
        lng: Number,
        heading: Number,
    },
    bankDetails: {
        bankName: String,
        accountNumber: String,
        ifscCode: String,
        panNumber: String,
    },
}, { timestamps: true });

export default mongoose.models.DriverProfile || mongoose.model('DriverProfile', DriverProfileSchema);
