import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/utils/jsonHandler";
import { FertilizerCalc } from "@/types";

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

        const fertilizers = await readJSON<FertilizerCalc>("fertilizercalc.json");
        const newFertilizers: FertilizerCalc[] = [];
        const updatedFertilizers: FertilizerCalc[] = [];
        const errors: string[] = [];

        data.forEach((item: any, index: number) => {
            try {
                // Validate required fields
                if (!item.crop) {
                    errors.push(`Row ${index + 1}: Crop name is required`);
                    return;
                }

                const fertilizer: FertilizerCalc = {
                    crop: item.crop,
                    compound_at_planting: item.compound_at_planting || "",
                    rate_at_planting: item.rate_at_planting || "",
                    compound_top_dressing: item.compound_top_dressing || null,
                    rate_top_dressing: item.rate_top_dressing || "",
                    timing: item.timing || "",
                    remarks: item.remarks || "",
                };

                // Check if fertilizer already exists (by crop name)
                const existingIndex = fertilizers.findIndex(f => f.crop === fertilizer.crop);
                if (existingIndex !== -1) {
                    fertilizers[existingIndex] = fertilizer;
                    updatedFertilizers.push(fertilizer);
                } else {
                    newFertilizers.push(fertilizer);
                }
            } catch (err: any) {
                errors.push(`Row ${index + 1}: ${err.message}`);
            }
        });

        if (errors.length > 0 && newFertilizers.length === 0 && updatedFertilizers.length === 0) {
            return NextResponse.json(
                { error: "All rows failed validation", details: errors },
                { status: 400 }
            );
        }

        // Merge new fertilizers with existing ones
        const finalFertilizers = [...fertilizers, ...newFertilizers];
        await writeJSON("fertilizercalc.json", finalFertilizers);

        return NextResponse.json({
            success: true,
            imported: newFertilizers.length,
            updated: updatedFertilizers.length,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || "Import failed" },
            { status: 500 }
        );
    }
}
