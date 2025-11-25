import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/utils/jsonHandler";

export interface Retailer {
    id: string;
    name: string;
    full_name: string;
    created_at: string;
}

export async function GET() {
    const retailers = await readJSON<Retailer>("retailers.json");
    return NextResponse.json(retailers);
}

export async function POST(request: NextRequest) {
    const retailers = await readJSON<Retailer>("retailers.json");
    const newRetailer: Retailer = await request.json();

    // Generate ID if not provided
    if (!newRetailer.id) {
        newRetailer.id = `ret_${Date.now()}`;
    }

    // Set created_at if not provided
    if (!newRetailer.created_at) {
        newRetailer.created_at = new Date().toISOString();
    }

    retailers.push(newRetailer);
    await writeJSON("retailers.json", retailers);

    return NextResponse.json(newRetailer, { status: 201 });
}

export async function PUT(request: NextRequest) {
    const retailers = await readJSON<Retailer>("retailers.json");
    const updatedRetailer: Retailer = await request.json();

    const index = retailers.findIndex((r) => r.id === updatedRetailer.id);
    if (index === -1) {
        return NextResponse.json({ error: "Retailer not found" }, { status: 404 });
    }

    retailers[index] = updatedRetailer;
    await writeJSON("retailers.json", retailers);

    return NextResponse.json(updatedRetailer);
}

export async function DELETE(request: NextRequest) {
    const retailers = await readJSON<Retailer>("retailers.json");
    const { id } = await request.json();

    if (!id) {
        return NextResponse.json({ error: "Retailer ID is required" }, { status: 400 });
    }

    const filteredRetailers = retailers.filter((r) => r.id !== id);
    await writeJSON("retailers.json", filteredRetailers);

    return NextResponse.json({ success: true });
}
