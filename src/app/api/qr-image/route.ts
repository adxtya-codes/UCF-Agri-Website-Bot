import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
    try {
        // Path to the QR code image
        const qrImagePath = path.join(process.cwd(), 'temp', 'qrcode.png');

        // Check if the file exists
        if (!fs.existsSync(qrImagePath)) {
            return NextResponse.json(
                { error: 'QR code not available. Please ensure the bot is running and generating a QR code.' },
                { status: 404 }
            );
        }

        // Read the file
        const imageBuffer = fs.readFileSync(qrImagePath);

        // Return the image with proper headers
        return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });
    } catch (error) {
        console.error('Error serving QR code:', error);
        return NextResponse.json(
            { error: 'Failed to load QR code image' },
            { status: 500 }
        );
    }
}
