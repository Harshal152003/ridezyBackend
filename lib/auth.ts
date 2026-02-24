import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_dev_only';

export interface DecodedToken {
    userId: string;
    role: string;
    status: string;
}

export function verifyToken(req: Request): DecodedToken | null {
    try {
        const authHeader = req.headers.get('Authorization');
        // console.log('Auth Header:', authHeader); // Uncomment to debug header existence

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('VerifyToken: Missing or invalid Authorization header');
            return null;
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

        // console.log('VerifyToken Decoded:', decoded); // Uncomment to see token payload

        return decoded;
    } catch (error) {
        console.log('VerifyToken Error:', error);
        return null;
    }
}
