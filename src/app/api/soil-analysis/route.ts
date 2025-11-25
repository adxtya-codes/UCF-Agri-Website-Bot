import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/utils/jsonHandler";
import { SoilAnalysis } from "@/types";

export async function GET() {
    const analyses = await readJSON<SoilAnalysis>("soil_analysis.json");
    return NextResponse.json(analyses);
}

export async function POST(request: NextRequest) {
    const analyses = await readJSON<SoilAnalysis>("soil_analysis.json");
    const newAnalysis: SoilAnalysis = await request.json();

    // Generate ID if not provided
    if (!newAnalysis.id) {
        newAnalysis.id = Date.now().toString();
    }

    analyses.push(newAnalysis);
    await writeJSON("soil_analysis.json", analyses);

    return NextResponse.json(newAnalysis, { status: 201 });
}

export async function PUT(request: NextRequest) {
    const analyses = await readJSON<SoilAnalysis>("soil_analysis.json");
    const updatedAnalysis: SoilAnalysis = await request.json();

    const index = analyses.findIndex((a) => a.id === updatedAnalysis.id);
    if (index === -1) {
        return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    analyses[index] = updatedAnalysis;
    await writeJSON("soil_analysis.json", analyses);

    return NextResponse.json(updatedAnalysis);
}

export async function DELETE(request: NextRequest) {
    const analyses = await readJSON<SoilAnalysis>("soil_analysis.json");
    const { id } = await request.json();

    if (!id) {
        return NextResponse.json({ error: "Analysis ID is required" }, { status: 400 });
    }

    const filteredAnalyses = analyses.filter((a) => a.id !== id);
    await writeJSON("soil_analysis.json", filteredAnalyses);

    return NextResponse.json({ success: true });
}
