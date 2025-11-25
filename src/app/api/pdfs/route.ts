import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/utils/jsonHandler";
import { ExclusivePDF } from "@/types";

export async function GET() {
    const pdfs = await readJSON<ExclusivePDF>("exclusivepdf.json");
    return NextResponse.json(pdfs);
}

export async function POST(request: NextRequest) {
    const pdfs = await readJSON<ExclusivePDF>("exclusivepdf.json");
    const newPDF: ExclusivePDF = await request.json();

    // Generate ID if not provided
    if (!newPDF.id) {
        const maxId = pdfs.length > 0 ? Math.max(...pdfs.map(p => p.id)) : 0;
        newPDF.id = maxId + 1;
    }

    pdfs.push(newPDF);
    await writeJSON("exclusivepdf.json", pdfs);

    return NextResponse.json(newPDF, { status: 201 });
}

export async function PUT(request: NextRequest) {
    const pdfs = await readJSON<ExclusivePDF>("exclusivepdf.json");
    const updatedPDF: ExclusivePDF = await request.json();

    const index = pdfs.findIndex((p) => p.id === updatedPDF.id);
    if (index === -1) {
        return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }

    pdfs[index] = updatedPDF;
    await writeJSON("exclusivepdf.json", pdfs);

    return NextResponse.json(updatedPDF);
}

export async function DELETE(request: NextRequest) {
    const pdfs = await readJSON<ExclusivePDF>("exclusivepdf.json");
    const { id } = await request.json();

    if (!id) {
        return NextResponse.json({ error: "PDF ID is required" }, { status: 400 });
    }

    const filteredPDFs = pdfs.filter((p) => p.id !== id);
    await writeJSON("exclusivepdf.json", filteredPDFs);

    return NextResponse.json({ success: true });
}
