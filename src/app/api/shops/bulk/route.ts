import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/utils/jsonHandler";
import { Shop } from "@/types";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { data, format } = body;

        if (!data || !Array.isArray(data)) {
            return NextResponse.json(
                { error: "Data must be an array" },
                { status: 400 }
            );
        }

        const shops = await readJSON<Shop>("shops.json");
        const newShops: Shop[] = [];
        const errors: string[] = [];

        data.forEach((item: any, index: number) => {
            try {
                // Validate required fields
                if (!item.name || !item.address) {
                    errors.push(`Row ${index + 1}: Name and address are required`);
                    return;
                }

                // Generate ID if not provided
                const shop: Shop = {
                    id: item.id || `${Date.now()}_${index}`,
                    name: item.name,
                    address: item.address,
                    phone: item.phone || "",
                    email: item.email || "",
                    owner: item.owner || "",
                    timing: item.timing || "",
                    latitude: parseFloat(item.latitude) || 0,
                    longitude: parseFloat(item.longitude) || 0,
                };

                newShops.push(shop);
            } catch (err: any) {
                errors.push(`Row ${index + 1}: ${err.message}`);
            }
        });

        if (errors.length > 0 && newShops.length === 0) {
            return NextResponse.json(
                { error: "All rows failed validation", details: errors },
                { status: 400 }
            );
        }

        // Append new shops to existing ones
        const updatedShops = [...shops, ...newShops];
        await writeJSON("shops.json", updatedShops);

        return NextResponse.json({
            success: true,
            imported: newShops.length,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || "Import failed" },
            { status: 500 }
        );
    }
}
