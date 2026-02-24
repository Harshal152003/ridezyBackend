import mongoose from 'mongoose';

const TripRequestSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    pickupLocation: { type: String, required: true },
    pickupCoords: {
        lat: Number,
        lng: Number,
    },
    dropLocation: { type: String, required: true },
    dropoffCoords: {
        lat: Number,
        lng: Number,
    },
    startTime: { type: Date, required: true },
    vehicleTypeRequested: {
        // enum: ['SEDAN', 'SUV', 'HATCHBACK', 'LUXURY'], // Relaxing enum for now or keeping it strict?
        // Let's keep it string to be safe with frontend case sensitivity, or normalize in API
        type: String,
        required: true,
    },
    tripType: {
        type: String,
        enum: ['oneway', 'roundtrip'],
        default: 'oneway',
    },
    passengers: { type: Number, default: 1 },
    specialInstructions: { type: String },

    status: {
        type: String,
        enum: ['OPEN', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
        default: 'OPEN',
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    price: { type: Number },
}, { timestamps: true });

export default mongoose.models.TripRequest || mongoose.model('TripRequest', TripRequestSchema);
