import { NextRequest, NextResponse } from "next/server";
// Users API Route
import { readJSON, writeJSON } from "@/utils/jsonHandler";
import { User } from "@/types";

export async function GET() {
    const users = await readJSON<User>("users.json");
    return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
    const users = await readJSON<User>("users.json");
    const newUser: User = await request.json();

    users.push(newUser);
    await writeJSON("users.json", users);

    return NextResponse.json(newUser, { status: 201 });
}

export async function PUT(request: NextRequest) {
    const users = await readJSON<User>("users.json");
    const updatedUser: User = await request.json();

    const index = users.findIndex((u) => u.phone === updatedUser.phone);
    if (index === -1) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    users[index] = updatedUser;
    await writeJSON("users.json", users);

    return NextResponse.json(updatedUser);
}

export async function DELETE(request: NextRequest) {
    const users = await readJSON<User>("users.json");
    const { phone } = await request.json();

    const filteredUsers = users.filter((u) => u.phone !== phone);
    await writeJSON("users.json", filteredUsers);

    return NextResponse.json({ success: true });
}
