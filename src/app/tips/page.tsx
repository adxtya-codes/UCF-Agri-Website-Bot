"use client";

import { useState, useEffect } from "react";
import { Tip } from "@/types";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Loader2, Calendar, Upload } from "lucide-react";
import { BulkImportDialog } from "@/components/BulkImportDialog";

export default function TipsPage() {
    const [tips, setTips] = useState<Tip[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [bulkImportOpen, setBulkImportOpen] = useState(false);
    const [editingTip, setEditingTip] = useState<Tip | null>(null);
    const [formData, setFormData] = useState<Partial<Tip>>({});

    useEffect(() => {
        fetchTips();
    }, []);

    const fetchTips = async () => {
        setLoading(true);
        const res = await fetch("/api/tips");
        const data = await res.json();
        setTips(data);
        setLoading(false);
    };

    const handleAdd = () => {
        setEditingTip(null);
        setFormData({
            title: "",
            content: "",
            image_url: "",
            send_date: new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString(),
        });
        setDialogOpen(true);
    };

    const handleEdit = (tip: Tip) => {
        setEditingTip(tip);
        setFormData(tip);
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.content) {
            alert("Title and content are required");
            return;
        }

        const method = editingTip ? "PUT" : "POST";
        await fetch("/api/tips", {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });

        setDialogOpen(false);
        fetchTips();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this tip?")) return;

        await fetch("/api/tips", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });

        fetchTips();
    };

    const handleBulkImport = async (data: any[], format: "csv" | "json") => {
        const response = await fetch("/api/tips/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data, format }),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || "Import failed");
        }

        await fetchTips();
    };

    const exampleCsv = `title,content,send_date,send_time,image_url
Best Time for Fertilizer,Apply fertilizer early morning or evening to reduce evaporation,2025-12-01,08:00,
Crop Rotation Tips,Rotate crops every season to maintain soil fertility,2025-12-02,10:00,https://example.com/image.jpg`;

    const exampleJson = `[
  {
    "title": "Best Time for Fertilizer",
    "content": "Apply fertilizer early morning or evening to reduce evaporation and improve absorption.",
    "send_date": "2025-12-01",
    "send_time": "08:00",
    "image_url": ""
  },
  {
    "title": "Crop Rotation Tips",
    "content": "Rotate crops every season to maintain soil fertility and prevent pest buildup.",
    "send_date": "2025-12-02",
    "send_time": "10:00",
    "image_url": "https://example.com/image.jpg"
  }
]`;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Farming Tips</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage daily farming tips and advisories
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setBulkImportOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Bulk Import
                    </Button>
                    <Button onClick={handleAdd}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Tip
                    </Button>
                </div>
            </div>

            {/* Tips Grid */}
            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : tips.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        No tips found. Create your first farming tip!
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tips.map((tip, idx) => (
                        <Card key={tip.id || `tip-${idx}`} className="relative">
                            <CardHeader>
                                <CardTitle className="text-lg">{tip.title}</CardTitle>
                                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        Created: {new Date(tip.created_at).toLocaleDateString()}
                                    </div>
                                    {tip.send_date && (
                                        <div className="flex items-center gap-1 text-green-600 font-medium">
                                            <Calendar className="h-3 w-3" />
                                            Send: {new Date(tip.send_date).toLocaleDateString()} at {tip.send_time || "10:00"}
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                    {tip.content}
                                </p>

                                {tip.image_url && (
                                    <div className="mb-4">
                                        <img
                                            src={tip.image_url}
                                            alt={tip.title}
                                            className="w-full h-32 object-cover rounded-md"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = "none";
                                            }}
                                        />
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(tip)}
                                        className="flex-1"
                                    >
                                        <Pencil className="h-4 w-4 mr-1" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                            if (!tip.id) {
                                                alert("Cannot delete: Tip ID is missing. Please refresh the page.");
                                                return;
                                            }
                                            handleDelete(tip.id);
                                        }}
                                        className="flex-1"
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Delete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingTip ? "Edit Tip" : "Add Tip"}</DialogTitle>
                        <DialogDescription>
                            {editingTip
                                ? "Update farming tip information"
                                : "Create a new farming tip or advisory"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title *</Label>
                            <Input
                                id="title"
                                value={formData.title || ""}
                                onChange={(e) =>
                                    setFormData({ ...formData, title: e.target.value })
                                }
                                placeholder="e.g., Best Time to Apply Fertilizer"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="content">Content *</Label>
                            <Textarea
                                id="content"
                                value={formData.content || ""}
                                onChange={(e) =>
                                    setFormData({ ...formData, content: e.target.value })
                                }
                                placeholder="Enter the farming tip or advisory content..."
                                rows={6}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="send_date">Send Date *</Label>
                            <Input
                                id="send_date"
                                type="date"
                                value={formData.send_date || ""}
                                onChange={(e) =>
                                    setFormData({ ...formData, send_date: e.target.value })
                                }
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="send_time">Send Time *</Label>
                            <Input
                                id="send_time"
                                type="time"
                                value={formData.send_time || "10:00"}
                                onChange={(e) =>
                                    setFormData({ ...formData, send_time: e.target.value })
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                This tip will be sent to all users at the specified time on the selected date
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="image_url">Image URL (optional)</Label>
                            <Input
                                id="image_url"
                                value={formData.image_url || ""}
                                onChange={(e) =>
                                    setFormData({ ...formData, image_url: e.target.value })
                                }
                                placeholder="https://example.com/image.jpg"
                            />
                            {formData.image_url && (
                                <div className="mt-2">
                                    <img
                                        src={formData.image_url}
                                        alt="Preview"
                                        className="w-full h-48 object-cover rounded-md"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = "none";
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            {editingTip ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Import Dialog */}
            <BulkImportDialog
                entityName="Tips"
                exampleCsv={exampleCsv}
                exampleJson={exampleJson}
                isOpen={bulkImportOpen}
                onClose={() => setBulkImportOpen(false)}
                onImport={handleBulkImport}
            />
        </div>
    );
}
