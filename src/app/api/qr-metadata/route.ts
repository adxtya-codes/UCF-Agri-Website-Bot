import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        // Path to the QR metadata file
        const metadataPath = path.join(process.cwd(), 'temp', 'qr_metadata.json');

        // Check if the file exists
        if (!fs.existsSync(metadataPath)) {
            return NextResponse.json(
                {
                    error: 'QR metadata not available',
                    message: 'Bot may not have generated a QR code yet'
                },
                { status: 404 }
            );
        }

        // Read the metadata
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

        return NextResponse.json({
            ...metadata,
            age_seconds: Math.floor((Date.now() - new Date(metadata.generated_at).getTime()) / 1000)
        });
    } catch (error) {
        console.error('Error reading QR metadata:', error);
        return NextResponse.json(
            { error: 'Failed to load QR metadata' },
            { status: 500 }
        );
    }
}
