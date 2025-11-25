"use client";

import { useState, useEffect } from "react";
import { Receipt, Product, User } from "@/types";
import { formatPhoneNumber } from "@/utils/phoneFormatter";
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
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Pencil, Trash2, CheckCircle, XCircle, Loader2, Image } from "lucide-react";

export default function ReceiptsPage() {
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [viewMode, setViewMode] = useState(false);
    const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
    const [formData, setFormData] = useState<Partial<Receipt>>({});

    useEffect(() => {
        fetchReceipts();
    }, []);

    useEffect(() => {
        const filtered = receipts.filter(
            (receipt) =>
                receipt.phone.includes(searchQuery) ||
                receipt.retailer_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredReceipts(filtered);
    }, [searchQuery, receipts]);

    const fetchReceipts = async () => {
        setLoading(true);
        const [receiptsRes, usersRes] = await Promise.all([
            fetch("/api/receipts"),
            fetch("/api/users")
        ]);
        const receiptsData = await receiptsRes.json();
        const usersData = await usersRes.json();
        setReceipts(receiptsData);
        setUsers(usersData);
        setFilteredReceipts(receiptsData);
        setLoading(false);
    };

    const getUserName = (phone: string) => {
        const user = users.find(u => u.phone === phone);
        return user?.name || "Unknown";
    };

    const getUserPhone = (phone: string) => {
        const user = users.find(u => u.phone === phone);
        return user?.phone_numeric || formatPhoneNumber(phone);
    };

    const handleView = (receipt: Receipt) => {
        setEditingReceipt(receipt);
        setFormData(receipt);
        setViewMode(true);
        setDialogOpen(true);
    };

    const handleEdit = (receipt: Receipt) => {
        setEditingReceipt(receipt);
        setFormData(receipt);
        setViewMode(false);
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.phone || !formData.retailer_name) {
            alert("Phone and retailer name are required");
            return;
        }

        await fetch("/api/receipts", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });

        setDialogOpen(false);
        fetchReceipts();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this receipt?")) return;

        await fetch("/api/receipts", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });

        fetchReceipts();
    };

    const handleApprove = async (receipt: Receipt) => {
        const updated = {
            ...receipt,
            status: "approved" as const,
            verified_at: new Date().toISOString(),
            rejection_reason: undefined,
        };
        await fetch("/api/receipts", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updated),
        });
        fetchReceipts();
    };

    const handleReject = async (receipt: Receipt) => {
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;

        const updated = {
            ...receipt,
            status: "rejected" as const,
            rejection_reason: reason,
        };
        await fetch("/api/receipts", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updated),
        });
        fetchReceipts();
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Receipts</h1>
                <p className="text-muted-foreground mt-2">
                    Manage receipt submissions and premium verification
                </p>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by phone or retailer name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                />
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
                                <TableHead>User</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Retailer</TableHead>
                                <TableHead>Purchase Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Hash</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredReceipts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                                        No receipts found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredReceipts.map((receipt, idx) => (
                                    <TableRow key={receipt.id || `receipt-${idx}`}>
                                        <TableCell className="font-medium">{getUserName(receipt.phone)}</TableCell>
                                        <TableCell>{getUserPhone(receipt.phone)}</TableCell>
                                        <TableCell className="font-medium">
                                            {receipt.retailer_name}
                                        </TableCell>
                                        <TableCell>
                                            {receipt.purchase_date ? new Date(receipt.purchase_date).toLocaleDateString() : (
                                                <span className="text-muted-foreground italic">Unknown</span>
                                            )}
                                        </TableCell>
                                        <TableCell>${Number(receipt.total_amount).toFixed(2)}</TableCell>
                                        <TableCell>
                                            {receipt.status === "approved" ? (
                                                <Badge variant="default">Verified</Badge>
                                            ) : receipt.status === "rejected" ? (
                                                <Badge variant="destructive">Rejected</Badge>
                                            ) : receipt.status === "on_hold" ? (
                                                <Badge variant="outline" className="border-yellow-500 text-yellow-500">On Hold</Badge>
                                            ) : (
                                                <Badge variant="secondary">Pending</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {receipt.hash.substring(0, 8)}...
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {receipt.image && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => window.open(receipt.image, '_blank')}
                                                        title="View Receipt Image"
                                                    >
                                                        <Image className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleView(receipt)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {receipt.status === "pending" && (
                                                    <>
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            onClick={() => handleApprove(receipt)}
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleReject(receipt)}
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(receipt)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDelete(receipt.id!)}
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

            {/* View/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {viewMode ? "Receipt Details" : "Edit Receipt"}
                        </DialogTitle>
                        <DialogDescription>
                            {viewMode
                                ? "View receipt information and verification status"
                                : "Update receipt information"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Phone</Label>
                            <Input
                                value={formData.phone || ""}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                disabled={viewMode}
                                readOnly={viewMode}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Retailer Name</Label>
                            <Input
                                value={formData.retailer_name || ""}
                                onChange={(e) =>
                                    setFormData({ ...formData, retailer_name: e.target.value })
                                }
                                disabled={viewMode}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Purchase Date</Label>
                            <Input
                                type="date"
                                value={formData.purchase_date || ""}
                                onChange={(e) =>
                                    setFormData({ ...formData, purchase_date: e.target.value })
                                }
                                disabled={viewMode}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Total Amount ($)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.total_amount || 0}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        total_amount: parseFloat(e.target.value),
                                    })
                                }
                                disabled={viewMode}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>UCF Products (comma-separated)</Label>
                            <Textarea
                                value={formData.ucf_products?.join(", ") || ""}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        ucf_products: e.target.value.split(",").map((s) => s.trim()),
                                    })
                                }
                                disabled={viewMode}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Hash</Label>
                            <Input
                                value={formData.hash || ""}
                                disabled
                                className="font-mono text-xs"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <Badge
                                variant={
                                    formData.status === "approved"
                                        ? "default"
                                        : formData.status === "rejected"
                                            ? "destructive"
                                            : "secondary"
                                }
                            >
                                {formData.status === "approved"
                                    ? "Verified"
                                    : formData.status === "rejected"
                                        ? "Rejected"
                                        : "Pending"}
                            </Badge>
                        </div>

                        {formData.rejection_reason && (
                            <div className="grid gap-2">
                                <Label>Rejection Reason</Label>
                                <Textarea value={formData.rejection_reason} disabled />
                            </div>
                        )}

                        {formData.verified_at && (
                            <div className="grid gap-2">
                                <Label>Verified At</Label>
                                <Input
                                    value={new Date(formData.verified_at).toLocaleString()}
                                    disabled
                                />
                            </div>
                        )}

                        {formData.image && (
                            <div className="grid gap-2">
                                <Label>Receipt Image</Label>
                                <a
                                    href={formData.image}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary underline"
                                >
                                    View Image
                                </a>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            {viewMode ? "Close" : "Cancel"}
                        </Button>
                        {!viewMode && <Button onClick={handleSave}>Update</Button>}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
