import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/utils/jsonHandler";
import { ExclusivePDF } from "@/types";

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

        const pdfs = await readJSON<ExclusivePDF>("exclusivepdf.json");
        const newPDFs: ExclusivePDF[] = [];
        const errors: string[] = [];

        // Get max ID for auto-generation
        const maxId = pdfs.length > 0 ? Math.max(...pdfs.map(p => p.id)) : 0;

        data.forEach((item: any, index: number) => {
            try {
                // Validate required fields
                if (!item.title || !item.filename || !item.url) {
                    errors.push(`Row ${index + 1}: Title, filename, and URL are required`);
                    return;
                }

                const pdf: ExclusivePDF = {
                    id: item.id ? parseInt(item.id) : maxId + newPDFs.length + 1,
                    title: item.title,
                    description: item.description || "",
                    filename: item.filename,
                    url: item.url,
                    category: item.category || "General",
                    size: item.size || "Unknown",
                    pages: item.pages ? parseInt(item.pages) : 0,
                    created_date: item.created_date || new Date().toISOString().split('T')[0],
                };

                newPDFs.push(pdf);
            } catch (err: any) {
                errors.push(`Row ${index + 1}: ${err.message}`);
            }
        });

        if (errors.length > 0 && newPDFs.length === 0) {
            return NextResponse.json(
                { error: "All rows failed validation", details: errors },
                { status: 400 }
            );
        }

        // Append new PDFs to existing ones
        const updatedPDFs = [...pdfs, ...newPDFs];
        await writeJSON("exclusivepdf.json", updatedPDFs);

        return NextResponse.json({
            success: true,
            imported: newPDFs.length,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || "Import failed" },
            { status: 500 }
        );
    }
}
