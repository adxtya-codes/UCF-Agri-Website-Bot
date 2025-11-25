import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/utils/jsonHandler";
import { CropDiagnosis } from "@/types";

export async function GET() {
    const diagnoses = await readJSON<CropDiagnosis>("crop_diagnosis.json");
    return NextResponse.json(diagnoses);
}

export async function POST(request: NextRequest) {
    const diagnoses = await readJSON<CropDiagnosis>("crop_diagnosis.json");
    const newDiagnosis: CropDiagnosis = await request.json();

    // Generate ID if not provided
    if (!newDiagnosis.id) {
        newDiagnosis.id = Date.now().toString();
    }

    diagnoses.push(newDiagnosis);
    await writeJSON("crop_diagnosis.json", diagnoses);

    return NextResponse.json(newDiagnosis, { status: 201 });
}

export async function PUT(request: NextRequest) {
    const diagnoses = await readJSON<CropDiagnosis>("crop_diagnosis.json");
    const updatedDiagnosis: CropDiagnosis = await request.json();

    const index = diagnoses.findIndex((d) => d.id === updatedDiagnosis.id);
    if (index === -1) {
        return NextResponse.json({ error: "Diagnosis not found" }, { status: 404 });
    }

    diagnoses[index] = updatedDiagnosis;
    await writeJSON("crop_diagnosis.json", diagnoses);

    return NextResponse.json(updatedDiagnosis);
}

export async function DELETE(request: NextRequest) {
    const diagnoses = await readJSON<CropDiagnosis>("crop_diagnosis.json");
    const { id } = await request.json();

    if (!id) {
        return NextResponse.json({ error: "Diagnosis ID is required" }, { status: 400 });
    }

    const filteredDiagnoses = diagnoses.filter((d) => d.id !== id);
    await writeJSON("crop_diagnosis.json", filteredDiagnoses);

    return NextResponse.json({ success: true });
}
