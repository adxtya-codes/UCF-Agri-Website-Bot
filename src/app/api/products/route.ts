import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/utils/jsonHandler";
import { Product } from "@/types";

export async function GET() {
    const products = await readJSON<Product>("products.json");
    return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
    const products = await readJSON<Product>("products.json");
    const newProduct: Product = await request.json();

    // Always generate a unique ID for new products
    newProduct.id = `prod_${Date.now()}`;

    products.push(newProduct);
    await writeJSON("products.json", products);

    return NextResponse.json(newProduct, { status: 201 });
}

export async function PUT(request: NextRequest) {
    const products = await readJSON<Product>("products.json");
    const updatedProduct: Product = await request.json();

    // Match by id first; fall back to name for legacy products without an id
    let index = updatedProduct.id
        ? products.findIndex((p) => p.id === updatedProduct.id)
        : -1;

    if (index === -1 && updatedProduct.name) {
        index = products.findIndex((p) => p.name === updatedProduct.name);
    }

    if (index === -1) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Preserve the original id if the updated payload doesn't have one
    if (!updatedProduct.id && products[index].id) {
        updatedProduct.id = products[index].id;
    }

    products[index] = updatedProduct;
    await writeJSON("products.json", products);

    return NextResponse.json(updatedProduct);
}

export async function DELETE(request: NextRequest) {
    const products = await readJSON<Product>("products.json");
    const { id } = await request.json();

    const filteredProducts = products.filter((p) => p.id !== id);
    await writeJSON("products.json", filteredProducts);

    return NextResponse.json({ success: true });
}
