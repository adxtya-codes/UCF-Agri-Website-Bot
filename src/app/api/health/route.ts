import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Simple health check - just return 200 if the server is running
        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'UCF Agri-Bot Dashboard'
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({
            status: 'error',
            error: 'Health check failed'
        }, { status: 500 });
    }
}
