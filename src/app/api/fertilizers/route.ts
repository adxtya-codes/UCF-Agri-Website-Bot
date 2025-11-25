import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/utils/jsonHandler";
import { FertilizerCalc } from "@/types";

export async function GET() {
    const fertilizers = await readJSON<FertilizerCalc>("fertilizercalc.json");
    return NextResponse.json(fertilizers);
}

export async function POST(request: NextRequest) {
    const fertilizers = await readJSON<FertilizerCalc>("fertilizercalc.json");
    const newFertilizer: FertilizerCalc = await request.json();

    fertilizers.push(newFertilizer);
    await writeJSON("fertilizercalc.json", fertilizers);

    return NextResponse.json(newFertilizer, { status: 201 });
}

export async function PUT(request: NextRequest) {
    const fertilizers = await readJSON<FertilizerCalc>("fertilizercalc.json");
    const updatedFertilizer: FertilizerCalc = await request.json();

    const index = fertilizers.findIndex((f) => f.crop === updatedFertilizer.crop);
    if (index === -1) {
        return NextResponse.json({ error: "Crop not found" }, { status: 404 });
    }

    fertilizers[index] = updatedFertilizer;
    await writeJSON("fertilizercalc.json", fertilizers);

    return NextResponse.json(updatedFertilizer);
}

export async function DELETE(request: NextRequest) {
    const fertilizers = await readJSON<FertilizerCalc>("fertilizercalc.json");
    const { crop } = await request.json();

    if (!crop) {
        return NextResponse.json({ error: "Crop name is required" }, { status: 400 });
    }

    const filteredFertilizers = fertilizers.filter((f) => f.crop !== crop);
    await writeJSON("fertilizercalc.json", filteredFertilizers);

    return NextResponse.json({ success: true });
}
