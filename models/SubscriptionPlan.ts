import mongoose from 'mongoose';

const SubscriptionPlanSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: String, enum: ['monthly', 'quarterly', 'yearly'], default: 'monthly' },
    description: { type: String },
    features: [{ type: String }],
    targetRole: { type: String, enum: ['OWNER', 'DRIVER', 'CENTER'], required: true },
    active: { type: Boolean, default: true },
    popular: { type: Boolean, default: false },
    color: { type: String, default: '#3B82F6' } // UI color helper
}, { timestamps: true });

export default mongoose.models.SubscriptionPlan || mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);
