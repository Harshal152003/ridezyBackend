import mongoose from 'mongoose';

const PaymentTransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    paymentMethod: { type: String, enum: ['UPI', 'Card', 'NetBanking', 'Wallet'], default: 'UPI' },
    transactionId: { type: String, unique: true }, // External gateway ID
    metadata: { type: Object }
}, { timestamps: true });

export default mongoose.models.PaymentTransaction || mongoose.model('PaymentTransaction', PaymentTransactionSchema);
