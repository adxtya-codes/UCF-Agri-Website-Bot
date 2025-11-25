import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/utils/jsonHandler";
import { User } from "@/types";

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

        const users = await readJSON<User>("users.json");
        const newUsers: User[] = [];
        const updatedUsers: User[] = [];
        const errors: string[] = [];

        data.forEach((item: any, index: number) => {
            try {
                // Validate required fields
                if (!item.phone || !item.name) {
                    errors.push(`Row ${index + 1}: Phone and name are required`);
                    return;
                }

                const user: User = {
                    phone: item.phone,
                    name: item.name,
                    email: item.email || undefined,
                    is_premium: item.is_premium === true || item.is_premium === "true",
                    premium_expiry_date: item.premium_expiry_date || undefined,
                    conversation_state: item.conversation_state || undefined,
                    location: item.latitude && item.longitude ? {
                        latitude: parseFloat(item.latitude),
                        longitude: parseFloat(item.longitude),
                    } : undefined,
                    last_interaction: item.last_interaction || new Date().toISOString(),
                };

                // Check if user already exists (by phone)
                const existingIndex = users.findIndex(u => u.phone === user.phone);
                if (existingIndex !== -1) {
                    users[existingIndex] = user;
                    updatedUsers.push(user);
                } else {
                    newUsers.push(user);
                }
            } catch (err: any) {
                errors.push(`Row ${index + 1}: ${err.message}`);
            }
        });

        if (errors.length > 0 && newUsers.length === 0 && updatedUsers.length === 0) {
            return NextResponse.json(
                { error: "All rows failed validation", details: errors },
                { status: 400 }
            );
        }

        // Merge new users with existing ones
        const finalUsers = [...users, ...newUsers];
        await writeJSON("users.json", finalUsers);

        return NextResponse.json({
            success: true,
            imported: newUsers.length,
            updated: updatedUsers.length,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || "Import failed" },
            { status: 500 }
        );
    }
}
