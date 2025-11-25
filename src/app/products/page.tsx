"use client";

import { useState, useEffect } from "react";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2, Upload } from "lucide-react";
import { BulkImportDialog } from "@/components/BulkImportDialog";

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [bulkImportOpen, setBulkImportOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<Partial<Product>>({});

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        const res = await fetch("/api/products");
        const data = await res.json();
        setProducts(data);
        setLoading(false);
    };

    const handleAdd = () => {
        setEditingProduct(null);
        setFormData({
            name: "",
            composition: { N: 0, P: 0, K: 0 },
            description: "",
            function: [],
            crop_usage: [],
            benefits: [],
            soil_type: "",
            application_timing: "",
        });
        setDialogOpen(true);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData(product);
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name) {
            alert("Product name is required");
            return;
        }

        const method = editingProduct ? "PUT" : "POST";
        await fetch("/api/products", {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });

        setDialogOpen(false);
        fetchProducts();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;

        await fetch("/api/products", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });

        fetchProducts();
    };

    const handleBulkImport = async (data: any[], format: "csv" | "json") => {
        const response = await fetch("/api/products/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data, format }),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || "Import failed");
        }

        await fetchProducts();
    };

    const exampleCsv = `name,N,P,K,description,soil_type,application_timing
Urea,46,0,0,High nitrogen fertilizer,Neutral to acidic,Top dressing 2-6 weeks
Compound D,7,14,7,Starter fertilizer,Neutral to acidic,At planting`;

    const exampleJson = `[
  {
    "name": "Urea",
    "composition": { "N": 46, "P": 0, "K": 0 },
    "description": "High nitrogen fertilizer used to promote leafy green vegetative growth.",
    "function": ["Enhances chlorophyll production", "Stimulates rapid foliage development"],
    "crop_usage": ["Maize", "Wheat", "Rice"],
    "benefits": ["Fast-acting nitrogen source", "Boosts yield"],
    "soil_type": "Neutral to slightly acidic soils",
    "application_timing": "Top dressing during active growth (2–6 weeks after emergence)"
  }
]`;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Products</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage UCF fertilizer products and specifications
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setBulkImportOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Bulk Import
                    </Button>
                    <Button onClick={handleAdd}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Product
                    </Button>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>NPK Composition</TableHead>
                                <TableHead>Soil Type</TableHead>
                                <TableHead>Application Timing</TableHead>
                                <TableHead>Crop Usage</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                        No products found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                products.map((product, idx) => (
                                    <TableRow key={product.id || `product-${idx}`}>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>
                                            {product.composition.N}-{product.composition.P}-
                                            {product.composition.K}
                                        </TableCell>
                                        <TableCell>{product.soil_type}</TableCell>
                                        <TableCell>{product.application_timing}</TableCell>
                                        <TableCell>
                                            {product.crop_usage.slice(0, 2).join(", ")}
                                            {product.crop_usage.length > 2 && "..."}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(product)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (!product.id) {
                                                            alert("Cannot delete: Product ID is missing. Please refresh the page.");
                                                            return;
                                                        }
                                                        handleDelete(product.id);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingProduct ? "Edit Product" : "Add Product"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingProduct
                                ? "Update product information"
                                : "Create a new fertilizer product"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Product Name *</Label>
                            <Input
                                id="name"
                                value={formData.name || ""}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>NPK Composition</Label>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="n" className="text-xs">
                                        Nitrogen (N)
                                    </Label>
                                    <Input
                                        id="n"
                                        type="number"
                                        value={formData.composition?.N || 0}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                composition: {
                                                    ...formData.composition!,
                                                    N: parseFloat(e.target.value),
                                                },
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="p" className="text-xs">
                                        Phosphorus (P)
                                    </Label>
                                    <Input
                                        id="p"
                                        type="number"
                                        value={formData.composition?.P || 0}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                composition: {
                                                    ...formData.composition!,
                                                    P: parseFloat(e.target.value),
                                                },
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="k" className="text-xs">
                                        Potassium (K)
                                    </Label>
                                    <Input
                                        id="k"
                                        type="number"
                                        value={formData.composition?.K || 0}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                composition: {
                                                    ...formData.composition!,
                                                    K: parseFloat(e.target.value),
                                                },
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description || ""}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="function">Function (comma-separated)</Label>
                            <Textarea
                                id="function"
                                value={formData.function?.join(", ") || ""}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        function: e.target.value.split(",").map((s) => s.trim()),
                                    })
                                }
                                placeholder="e.g., Promotes growth, Increases yield"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="crop_usage">Crop Usage (comma-separated)</Label>
                            <Textarea
                                id="crop_usage"
                                value={formData.crop_usage?.join(", ") || ""}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        crop_usage: e.target.value.split(",").map((s) => s.trim()),
                                    })
                                }
                                placeholder="e.g., Rice, Wheat, Cotton"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="benefits">Benefits (comma-separated)</Label>
                            <Textarea
                                id="benefits"
                                value={formData.benefits?.join(", ") || ""}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        benefits: e.target.value.split(",").map((s) => s.trim()),
                                    })
                                }
                                placeholder="e.g., Better root development, Higher productivity"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="soil_type">Soil Type</Label>
                            <Input
                                id="soil_type"
                                value={formData.soil_type || ""}
                                onChange={(e) =>
                                    setFormData({ ...formData, soil_type: e.target.value })
                                }
                                placeholder="e.g., All soil types, Clay, Sandy"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="timing">Application Timing</Label>
                            <Input
                                id="timing"
                                value={formData.application_timing || ""}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        application_timing: e.target.value,
                                    })
                                }
                                placeholder="e.g., Before sowing, During flowering"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            {editingProduct ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Import Dialog */}
            <BulkImportDialog
                entityName="Products"
                exampleCsv={exampleCsv}
                exampleJson={exampleJson}
                isOpen={bulkImportOpen}
                onClose={() => setBulkImportOpen(false)}
                onImport={handleBulkImport}
            />
        </div>
    );
}
