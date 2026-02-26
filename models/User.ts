import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: String, // String to handle various formats
        unique: true,
    },
    full_name: {
        type: String,
    },
    avatar: {
        type: String,
    },
    address: {
        type: String,
    },
    linkedCenterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false, // Only for staff
    },
    passwordHash: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['ADMIN', 'OWNER', 'DRIVER', 'CENTER', 'CENTER_STAFF'],
        required: true,
    },
    status: {
        type: String,
        enum: ['PENDING_ONBOARDING', 'PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'SUSPENDED'],
        default: 'PENDING_ONBOARDING',
    },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
