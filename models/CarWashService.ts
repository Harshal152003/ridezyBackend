import mongoose from 'mongoose';

const CarWashServiceSchema = new mongoose.Schema({
    centerId: { type: String, required: true, index: true }, // Stores userId of the center
    name: { type: String, required: true },
    type: { type: String, enum: ['CAR', 'BIKE'], required: true },
    category: { type: String, default: 'STANDARD' }, // e.g. SUV, SEDAN, HATCHBACK if needed later
    price: { type: Number, required: true },
    duration: { type: Number, required: true }, // in minutes
    description: { type: String },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.CarWashService || mongoose.model('CarWashService', CarWashServiceSchema);
