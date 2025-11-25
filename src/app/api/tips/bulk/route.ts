import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/utils/jsonHandler";
import { Tip } from "@/types";

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

        const tips = await readJSON<Tip>("tips.json");
        const newTips: Tip[] = [];
        const errors: string[] = [];

        data.forEach((item: any, index: number) => {
            try {
                // Validate required fields
                if (!item.title || !item.content) {
                    errors.push(`Row ${index + 1}: Title and content are required`);
                    return;
                }

                const tip: Tip = {
                    id: item.id || `${Date.now()}_${index}`,
                    title: item.title,
                    content: item.content,
                    created_at: item.created_at || new Date().toISOString(),
                    send_date: item.send_date || undefined,
                    send_time: item.send_time || undefined,
                    image_url: item.image_url || undefined,
                };

                newTips.push(tip);
            } catch (err: any) {
                errors.push(`Row ${index + 1}: ${err.message}`);
            }
        });

        if (errors.length > 0 && newTips.length === 0) {
            return NextResponse.json(
                { error: "All rows failed validation", details: errors },
                { status: 400 }
            );
        }

        // Append new tips to existing ones
        const updatedTips = [...tips, ...newTips];
        await writeJSON("tips.json", updatedTips);

        return NextResponse.json({
            success: true,
            imported: newTips.length,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || "Import failed" },
            { status: 500 }
        );
    }
}
