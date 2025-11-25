import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/utils/jsonHandler";
import { Product } from "@/types";

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

        const products = await readJSON<Product>("products.json");
        const newProducts: Product[] = [];
        const errors: string[] = [];

        // Get max ID for auto-generation
        const maxId = products.reduce((max, p) => {
            const idNum = parseInt(p.id.replace("prod_", ""));
            return idNum > max ? idNum : max;
        }, 0);

        data.forEach((item: any, index: number) => {
            try {
                if (!item.name) {
                    errors.push(`Row ${index + 1}: Product name is required`);
                    return;
                }

                const product: Product = {
                    id: item.id || `prod_${String(maxId + index + 1).padStart(3, "0")}`,
                    name: item.name,
                    composition: {
                        N: parseFloat(item.N || item.composition?.N || 0),
                        P: parseFloat(item.P || item.composition?.P || 0),
                        K: parseFloat(item.K || item.composition?.K || 0),
                    },
                    description: item.description || "",
                    function: Array.isArray(item.function)
                        ? item.function
                        : typeof item.function === "string"
                            ? item.function.split(",").map((s: string) => s.trim())
                            : [],
                    crop_usage: Array.isArray(item.crop_usage)
                        ? item.crop_usage
                        : typeof item.crop_usage === "string"
                            ? item.crop_usage.split(",").map((s: string) => s.trim())
                            : [],
                    benefits: Array.isArray(item.benefits)
                        ? item.benefits
                        : typeof item.benefits === "string"
                            ? item.benefits.split(",").map((s: string) => s.trim())
                            : [],
                    soil_type: item.soil_type || "",
                    application_timing: item.application_timing || "",
                };
                newProducts.push(product);
            } catch (err: any) {
                errors.push(`Row ${index + 1}: ${err.message}`);
            }
        });

        const updatedProducts = [...products, ...newProducts];
        await writeJSON("products.json", updatedProducts);

        return NextResponse.json({
            success: true,
            imported: newProducts.length,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || "Import failed" },
            { status: 500 }
        );
    }
}
