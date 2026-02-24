import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = Date.now() + '-' + file.name.replace(/\s/g, '-');

        // Ensure upload directory exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });

        const filepath = path.join(uploadDir, filename);

        await writeFile(filepath, buffer);

        // Construct public URL
        const fileUrl = `/uploads/${filename}`;

        return NextResponse.json({
            message: 'File uploaded successfully',
            url: fileUrl,
            fileUrl: fileUrl, // Redundant but consistent with frontend expectation
            secure_url: fileUrl // Redundant but consistent with frontend expectation
        }, { status: 201 });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
    }
}
