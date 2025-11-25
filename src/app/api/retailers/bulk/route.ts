import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/utils/jsonHandler";

export interface Retailer {
    id: string;
    name: string;
    full_name: string;
    created_at: string;
}

export async function POST(request: NextRequest) {
    const { data, format } = await request.json();

    if (!data || !Array.isArray(data)) {
        return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    const retailers = await readJSON<Retailer>("retailers.json");

    // Process and add new retailers
    const newRetailers = data.map((item: any, index: number) => ({
        id: item.id || `ret_${Date.now()}_${index}`,
        name: item.name || "",
        full_name: item.full_name || item.name || "",
        created_at: item.created_at || new Date().toISOString(),
    }));

    // Append to existing retailers
    const updatedRetailers = [...retailers, ...newRetailers];
    await writeJSON("retailers.json", updatedRetailers);

    return NextResponse.json({
        success: true,
        imported: newRetailers.length
    });
}
