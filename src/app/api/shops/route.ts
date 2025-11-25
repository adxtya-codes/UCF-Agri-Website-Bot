import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/utils/jsonHandler";
import { Shop } from "@/types";

export async function GET() {
    const shops = await readJSON<Shop>("shops.json");
    return NextResponse.json(shops);
}

export async function POST(request: NextRequest) {
    const shops = await readJSON<Shop>("shops.json");
    const newShop: Shop = await request.json();

    // Generate ID if not provided
    if (!newShop.id) {
        newShop.id = Date.now().toString();
    }

    shops.push(newShop);
    await writeJSON("shops.json", shops);

    return NextResponse.json(newShop, { status: 201 });
}

export async function PUT(request: NextRequest) {
    const shops = await readJSON<Shop>("shops.json");
    const updatedShop: Shop = await request.json();

    const index = shops.findIndex((s) => s.id === updatedShop.id);
    if (index === -1) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    shops[index] = updatedShop;
    await writeJSON("shops.json", shops);

    return NextResponse.json(updatedShop);
}

export async function DELETE(request: NextRequest) {
    const shops = await readJSON<Shop>("shops.json");
    const { id } = await request.json();

    const filteredShops = shops.filter((s) => s.id !== id);
    await writeJSON("shops.json", filteredShops);

    return NextResponse.json({ success: true });
}
