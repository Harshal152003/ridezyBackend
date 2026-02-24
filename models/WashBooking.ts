import mongoose from 'mongoose';

const WashBookingSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    centerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Linking to the Center's User ID (or Profile ID, but User ID is cleaner for auth)
        required: true,
    },
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true,
    },
    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
        default: 'PENDING',
    },
    scheduledTime: { type: Date, required: true },
    packageType: { type: String }, // e.g., 'BASIC', 'PREMIUM'
    price: { type: Number },
}, { timestamps: true });

export default mongoose.models.WashBooking || mongoose.model('WashBooking', WashBookingSchema);
