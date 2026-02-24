import mongoose from 'mongoose';

const CarWashCenterProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    businessName: { type: String, required: true },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true,
        },
        address: { type: String },
    },
    registrationDocUrl: { type: String, required: true },
    logo: { type: String }, // URL to logo
    contactPhone: { type: String }, // Display phone
    description: { type: String }, // Short bio
    isApproved: { type: Boolean, default: false },
    subscriptionPlan: { type: String, default: 'Basic' },
    subscriptionExpiry: { type: Date },
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
}, { timestamps: true });

CarWashCenterProfileSchema.index({ 'location.coordinates': '2dsphere' });


export default mongoose.models.CarWashCenterProfile || mongoose.model('CarWashCenterProfile', CarWashCenterProfileSchema);
// Schema Updated for GeoJSON
