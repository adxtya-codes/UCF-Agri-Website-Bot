import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { uploadFileToUploadThing } from "@/helpers/uploadthing";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        if (file.type !== "application/pdf") {
            return NextResponse.json(
                { error: "Only PDF files are allowed" },
                { status: 400 }
            );
        }

        // Convert File to Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Save temporarily
        const tempDir = join(process.cwd(), "temp");
        const tempPath = join(tempDir, file.name);

        // Ensure temp directory exists
        const fs = require("fs");
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        await writeFile(tempPath, buffer);

        // Upload to UploadThing
        const url = await uploadFileToUploadThing(tempPath, {
            fileName: file.name,
            mimetype: file.type,
        });

        // Clean up temp file
        fs.unlinkSync(tempPath);

        return NextResponse.json({
            success: true,
            url,
            filename: file.name,
            size: file.size,
        });
    } catch (error: any) {
        console.error("PDF upload error:", error);
        return NextResponse.json(
            { error: error.message || "Upload failed" },
            { status: 500 }
        );
    }
}
