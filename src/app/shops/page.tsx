"use client";

import { useState, useEffect } from "react";
import { Shop } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Pencil, Trash2, MapPin, Loader2, Upload } from "lucide-react";
import { BulkImportDialog } from "@/components/BulkImportDialog";

export default function ShopsPage() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [bulkImportOpen, setBulkImportOpen] = useState(false);
    const [mapDialogOpen, setMapDialogOpen] = useState(false);
    const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
    const [editingShop, setEditingShop] = useState<Shop | null>(null);
    const [formData, setFormData] = useState<Partial<Shop>>({});

    useEffect(() => {
        fetchShops();
    }, []);

    const fetchShops = async () => {
        setLoading(true);
        const res = await fetch("/api/shops");
        const data = await res.json();
        setShops(data);
        setLoading(false);
    };

    const handleAdd = () => {
        setEditingShop(null);
        setFormData({
            name: "",
            address: "",
            phone: "",
            email: "",
            owner: "",
            timing: "",
            latitude: 0,
            longitude: 0,
        });
        setDialogOpen(true);
    };

    const handleEdit = (shop: Shop) => {
        setEditingShop(shop);
        setFormData(shop);
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.address) {
            alert("Name and address are required");
            return;
        }

        const method = editingShop ? "PUT" : "POST";
        await fetch("/api/shops", {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });

        setDialogOpen(false);
        fetchShops();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this shop?")) return;

        await fetch("/api/shops", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });

        fetchShops();
    };

    const showMap = (shop: Shop) => {
        setSelectedShop(shop);
        setMapDialogOpen(true);
    };

    const handleBulkImport = async (data: any[], format: "csv" | "json") => {
        const response = await fetch("/api/shops/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data, format }),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || "Import failed");
        }

        await fetchShops();
    };

    const exampleCsv = `name,address,phone,email,owner,timing,latitude,longitude
FarmBiz Example,123 Main St,+263123456789,example@farmbiz.com,John Doe,9AM-5PM,-17.8292,31.0522
Agro Shop,456 Market Rd,+263987654321,shop@agro.com,Jane Smith,8AM-6PM,-18.9667,32.6333`;

    const exampleJson = `[
  {
    "name": "FarmBiz Example",
    "address": "123 Main St, Harare",
    "phone": "+263123456789",
    "email": "example@farmbiz.com",
    "owner": "John Doe",
    "timing": "9AM-5PM",
    "latitude": -17.8292,
    "longitude": 31.0522
  },
  {
    "name": "Agro Shop",
    "address": "456 Market Rd, Bulawayo",
    "phone": "+263987654321",
    "email": "shop@agro.com",
    "owner": "Jane Smith",
    "timing": "8AM-6PM",
    "latitude": -18.9667,
    "longitude": 32.6333
  }
]`;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">UCF Authorised Retailers</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage UCF authorised retailer locations and contact information
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setBulkImportOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Bulk Import
                    </Button>
                    <Button onClick={handleAdd}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Shop
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
                                <TableHead>Address</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Contact Person</TableHead>
                                <TableHead>Timing</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shops.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                                        No shops found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                shops.map((shop) => (
                                    <TableRow key={shop.id}>
                                        <TableCell className="font-medium">{shop.name}</TableCell>
                                        <TableCell>{shop.address}</TableCell>
                                        <TableCell>{shop.phone}</TableCell>
                                        <TableCell>{shop.owner}</TableCell>
                                        <TableCell>{shop.timing}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => showMap(shop)}
                                            >
                                                <MapPin className="h-4 w-4 mr-1" />
                                                View Map
                                            </Button>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(shop)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (!shop.id) {
                                                            alert("Cannot delete: Shop ID is missing. Please refresh the page.");
                                                            return;
                                                        }
                                                        handleDelete(shop.id);
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
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingShop ? "Edit Shop" : "Add Shop"}</DialogTitle>
                        <DialogDescription>
                            {editingShop
                                ? "Update shop information"
                                : "Create a new retail shop entry"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Shop Name *</Label>
                            <Input
                                id="name"
                                value={formData.name || ""}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="address">Address *</Label>
                            <Input
                                id="address"
                                value={formData.address || ""}
                                onChange={(e) =>
                                    setFormData({ ...formData, address: e.target.value })
                                }
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, phone: e.target.value })
                                    }
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="owner">Contact Person</Label>
                            <Input
                                id="owner"
                                value={formData.owner || ""}
                                onChange={(e) =>
                                    setFormData({ ...formData, owner: e.target.value })
                                }
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="timing">Business Hours</Label>
                            <Input
                                id="timing"
                                value={formData.timing || ""}
                                onChange={(e) =>
                                    setFormData({ ...formData, timing: e.target.value })
                                }
                                placeholder="e.g., 9:00 AM - 6:00 PM"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="lat">Latitude</Label>
                                <Input
                                    id="lat"
                                    type="number"
                                    step="0.000001"
                                    value={formData.latitude || 0}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            latitude: parseFloat(e.target.value),
                                        })
                                    }
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="lng">Longitude</Label>
                                <Input
                                    id="lng"
                                    type="number"
                                    step="0.000001"
                                    value={formData.longitude || 0}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            longitude: parseFloat(e.target.value),
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            {editingShop ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Map Preview Dialog */}
            <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{selectedShop?.name}</DialogTitle>
                        <DialogDescription>{selectedShop?.address}</DialogDescription>
                    </DialogHeader>

                    <div className="aspect-video w-full">
                        {selectedShop && (
                            <iframe
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                src={`https://www.google.com/maps?q=${selectedShop.latitude},${selectedShop.longitude}&output=embed`}
                            ></iframe>
                        )}
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setMapDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Import Dialog */}
            <BulkImportDialog
                entityName="Shops"
                exampleCsv={exampleCsv}
                exampleJson={exampleJson}
                isOpen={bulkImportOpen}
                onClose={() => setBulkImportOpen(false)}
                onImport={handleBulkImport}
            />
        </div>
    );
}
