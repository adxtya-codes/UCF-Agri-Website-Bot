import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const settingsPath = path.join(process.cwd(), "src/data/settings.json");

function loadSettings() {
    try {
        const data = fs.readFileSync(settingsPath, "utf8");
        return JSON.parse(data);
    } catch {
        return { promo_code: "", promo_code_description: "" };
    }
}

function saveSettings(data: object) {
    fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2), "utf8");
}

export async function GET() {
    const settings = loadSettings();
    return NextResponse.json(settings);
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();

        if (!body.promo_code) {
            return NextResponse.json(
                { error: "promo_code is required" },
                { status: 400 }
            );
        }

        const current = loadSettings();
        const updated = {
            ...current,
            promo_code: String(body.promo_code).trim(),
            promo_code_description: body.promo_code_description
                ? String(body.promo_code_description).trim()
                : current.promo_code_description,
            tips_send_time: body.tips_send_time
                ? String(body.tips_send_time).trim()
                : (current.tips_send_time || "08:00"),
        };

        saveSettings(updated);
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to save settings" },
            { status: 500 }
        );
    }
}
