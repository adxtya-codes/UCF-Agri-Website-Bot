import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/utils/jsonHandler";
import { Tip } from "@/types";

export async function GET() {
    const tips = await readJSON<Tip>("tips.json");
    return NextResponse.json(tips);
}

export async function POST(request: NextRequest) {
    const tips = await readJSON<Tip>("tips.json");
    const newTip: Tip = await request.json();

    // Generate ID if not provided
    if (!newTip.id) {
        newTip.id = Date.now().toString();
    }

    // Set created_at if not provided
    if (!newTip.created_at) {
        newTip.created_at = new Date().toISOString();
    }

    tips.push(newTip);
    await writeJSON("tips.json", tips);

    return NextResponse.json(newTip, { status: 201 });
}

export async function PUT(request: NextRequest) {
    const tips = await readJSON<Tip>("tips.json");
    const updatedTip: Tip = await request.json();

    const index = tips.findIndex((t) => t.id === updatedTip.id);
    if (index === -1) {
        return NextResponse.json({ error: "Tip not found" }, { status: 404 });
    }

    tips[index] = updatedTip;
    await writeJSON("tips.json", tips);

    return NextResponse.json(updatedTip);
}

export async function DELETE(request: NextRequest) {
    const tips = await readJSON<Tip>("tips.json");
    const { id } = await request.json();

    const filteredTips = tips.filter((t) => t.id !== id);
    await writeJSON("tips.json", filteredTips);

    return NextResponse.json({ success: true });
}
