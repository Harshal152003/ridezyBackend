import mongoose from 'mongoose';

const CarOwnerProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    defaultAddress: { type: String },
}, { timestamps: true });

export default mongoose.models.CarOwnerProfile || mongoose.model('CarOwnerProfile', CarOwnerProfileSchema);
