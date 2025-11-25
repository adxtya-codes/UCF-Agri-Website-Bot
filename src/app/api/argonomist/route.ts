import { NextResponse } from "next/server";
import { readJSON } from "@/utils/jsonHandler";

export async function GET() {
    try {
        const questions = await readJSON("argonomist.json");
        return NextResponse.json(questions);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }
}
