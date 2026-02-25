import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Cloudinary is used when credentials are set in the environment.
// For local dev without Cloudinary credentials, files fall back to the local public/uploads/ folder.
let cloudinary: any = null;

async function getCloudinary() {
    if (cloudinary) return cloudinary;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
        const { v2: cld } = await import('cloudinary');
        cld.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
        cloudinary = cld;
    }

    return cloudinary;
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const cld = await getCloudinary();

        // ─── Cloudinary path (used on Vercel / production) ───────────────────
        if (cld) {
            const uploadResult: any = await new Promise((resolve, reject) => {
                const uploadStream = cld.uploader.upload_stream(
                    { folder: 'ridezy/uploads', resource_type: 'image' },
                    (error: any, result: any) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );
                uploadStream.end(buffer);
            });

            return NextResponse.json({
                message: 'File uploaded successfully',
                url: uploadResult.secure_url,
                fileUrl: uploadResult.secure_url,
                secure_url: uploadResult.secure_url,
            }, { status: 201 });
        }

        // ─── Local disk fallback (used in local dev without Cloudinary creds) ─
        const filename = Date.now() + '-' + (file.name || 'upload').replace(/\s/g, '-');
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, filename), buffer);

        const fileUrl = `/uploads/${filename}`;
        return NextResponse.json({
            message: 'File uploaded successfully (local)',
            url: fileUrl,
            fileUrl,
            secure_url: fileUrl,
        }, { status: 201 });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
    }
}
