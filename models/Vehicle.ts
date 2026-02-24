import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: String },
    color: { type: String },
    type: { type: String }, // hatchback, sedan, suv, etc.
    plateNumber: { type: String, required: true },
    rcDocumentUrl: { type: String, required: true },
    insuranceUrl: { type: String },
    isApproved: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.Vehicle || mongoose.model('Vehicle', VehicleSchema);
