import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/utils/jsonHandler";
import { Receipt, User } from "@/types";

export async function GET() {
    const receipts = await readJSON<Receipt>("receipts.json");
    return NextResponse.json(receipts);
}

export async function POST(request: NextRequest) {
    const receipts = await readJSON<Receipt>("receipts.json");
    const newReceipt: Receipt = await request.json();

    // Generate ID if not provided
    if (!newReceipt.id) {
        newReceipt.id = Date.now().toString();
    }

    receipts.push(newReceipt);
    await writeJSON("receipts.json", receipts);

    return NextResponse.json(newReceipt, { status: 201 });
}

export async function PUT(request: NextRequest) {
    const receipts = await readJSON<Receipt>("receipts.json");
    const updatedReceipt: Receipt = await request.json();

    const index = receipts.findIndex((r) => r.id === updatedReceipt.id);
    if (index === -1) {
        return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    const currentReceipt = receipts[index];
    const isApproving = currentReceipt.status !== 'approved' && updatedReceipt.status === 'approved';

    receipts[index] = updatedReceipt;
    await writeJSON("receipts.json", receipts);

    // Update user premium status if receipt is newly approved
    if (isApproving) {
        const users = await readJSON<User>("users.json");
        const userIndex = users.findIndex(u => u.phone === updatedReceipt.phone);

        if (userIndex !== -1) {
            const now = new Date();
            const expiryDate = new Date(now.setDate(now.getDate() + 30)).toISOString(); // 30 days premium

            users[userIndex].is_premium = true;
            users[userIndex].premium_expiry_date = expiryDate;

            await writeJSON("users.json", users);
        }
    }

    return NextResponse.json(updatedReceipt);
}

export async function DELETE(request: NextRequest) {
    const receipts = await readJSON<Receipt>("receipts.json");
    const { id } = await request.json();

    // Don't delete if id is undefined or null
    if (!id) {
        return NextResponse.json({ error: "Receipt ID is required" }, { status: 400 });
    }

    const filteredReceipts = receipts.filter((r) => r.id !== id);
    await writeJSON("receipts.json", filteredReceipts);

    return NextResponse.json({ success: true });
}
