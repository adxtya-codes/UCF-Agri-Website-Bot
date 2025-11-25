"use client";

import { useState, useEffect } from "react";
import { ExclusivePDF } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, FileText, Loader2, ExternalLink, Upload } from "lucide-react";
import { BulkImportDialog } from "@/components/BulkImportDialog";

export default function PDFsPage() {
    const [pdfs, setPdfs] = useState<ExclusivePDF[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [bulkImportOpen, setBulkImportOpen] = useState(false);
    const [editingPDF, setEditingPDF] = useState<ExclusivePDF | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        filename: "",
        url: "",
        category: "",
        size: "",
        pages: 0,
        created_date: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        fetchPDFs();
    }, []);

    const fetchPDFs = async () => {
        try {
            const res = await fetch("/api/pdfs");
            const data = await res.json();
            setPdfs(data);
        } catch (error) {
            console.error("Error fetching PDFs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingPDF ? "/api/pdfs" : "/api/pdfs";
            const method = editingPDF ? "PUT" : "POST";

            const payload = editingPDF
                ? { ...formData, id: editingPDF.id }
                : formData;

            await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            fetchPDFs();
            handleCloseDialog();
        } catch (error) {
            console.error("Error saving PDF:", error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this PDF?")) return;

        try {
            await fetch("/api/pdfs", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            fetchPDFs();
        } catch (error) {
            console.error("Error deleting PDF:", error);
        }
    };

    const handleEdit = (pdf: ExclusivePDF) => {
        setEditingPDF(pdf);
        setFormData({
            title: pdf.title,
            description: pdf.description,
            filename: pdf.filename,
            url: pdf.url,
            category: pdf.category,
            size: pdf.size,
            pages: pdf.pages,
            created_date: pdf.created_date,
        });
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingPDF(null);
        setFormData({
            title: "",
            description: "",
            filename: "",
            url: "",
            category: "",
            size: "",
            pages: 0,
            created_date: new Date().toISOString().split('T')[0],
        });
        setUploading(false);
        setUploadProgress(0);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert('Please upload a PDF file');
            return;
        }

        try {
            setUploading(true);
            setUploadProgress(30);

            const formData = new FormData();
            formData.append('file', file);

            setUploadProgress(60);

            const response = await fetch('/api/pdfs/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            setUploadProgress(100);

            // Auto-fill form with uploaded file data
            setFormData(prev => ({
                ...prev,
                url: data.url,
                filename: file.name,
                size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
            }));

            alert('PDF uploaded successfully!');
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload PDF. Please try again.');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const filteredPDFs = pdfs.filter((pdf) =>
        pdf.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pdf.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleBulkImport = async (data: any[], format: "csv" | "json") => {
        const response = await fetch("/api/pdfs/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data, format }),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || "Import failed");
        }

        await fetchPDFs();
    };

    const exampleCsv = `title,description,filename,url,category,size,pages,created_date
Crop Management Guide,Comprehensive guide for crop management,crop_guide.pdf,https://example.com/crop_guide.pdf,Farming,2.5 MB,45,2025-01-01
Pest Control Manual,Best practices for pest control,pest_control.pdf,https://example.com/pest.pdf,Pest Control,1.8 MB,32,2025-01-02`;

    const exampleJson = `[
  {
    "title": "Crop Management Guide",
    "description": "Comprehensive guide for crop management and best practices",
    "filename": "crop_guide.pdf",
    "url": "https://example.com/crop_guide.pdf",
    "category": "Farming",
    "size": "2.5 MB",
    "pages": 45,
    "created_date": "2025-01-01"
  },
  {
    "title": "Pest Control Manual",
    "description": "Best practices for pest control in agriculture",
    "filename": "pest_control.pdf",
    "url": "https://example.com/pest.pdf",
    "category": "Pest Control",
    "size": "1.8 MB",
    "pages": 32,
    "created_date": "2025-01-02"
  }
]`;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Exclusive Farming Guides</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage premium farming guide resources for users
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setBulkImportOpen(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Bulk Import
                    </Button>
                    <Button onClick={() => setDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add PDF
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>PDF Library ({pdfs.length})</CardTitle>
                        <Input
                            placeholder="Search by title or category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Pages</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPDFs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                        No PDFs found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPDFs.map((pdf, idx) => (
                                    <TableRow key={pdf.id || `pdf-${idx}`}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                {pdf.title}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{pdf.category}</Badge>
                                        </TableCell>
                                        <TableCell>{pdf.size}</TableCell>
                                        <TableCell>{pdf.pages} pages</TableCell>
                                        <TableCell>{new Date(pdf.created_date).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => window.open(pdf.url, '_blank')}
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(pdf)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(pdf.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingPDF ? "Edit PDF" : "Add New PDF"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Title</Label>
                                <Input
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Description</Label>
                                <Textarea
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Category</Label>
                                    <Input
                                        required
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Filename</Label>
                                    <Input
                                        required
                                        value={formData.filename}
                                        onChange={(e) => setFormData({ ...formData, filename: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* PDF File Upload */}
                            <div className="grid gap-2">
                                <Label>Upload PDF File</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                        className="flex-1"
                                    />
                                    {uploading && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {uploadProgress}%
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Upload a PDF file or enter a URL below
                                </p>
                            </div>

                            <div className="grid gap-2">
                                <Label>PDF URL {!formData.url && "(Optional if uploading file)"}</Label>
                                <Input
                                    type="url"
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    placeholder="https://example.com/file.pdf"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label>Size</Label>
                                    <Input
                                        required
                                        placeholder="e.g., 2.5 MB"
                                        value={formData.size}
                                        onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Pages</Label>
                                    <Input
                                        required
                                        type="number"
                                        value={formData.pages}
                                        onChange={(e) => setFormData({ ...formData, pages: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Created Date</Label>
                                    <Input
                                        required
                                        type="date"
                                        value={formData.created_date}
                                        onChange={(e) => setFormData({ ...formData, created_date: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editingPDF ? "Update" : "Add"} PDF
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Bulk Import Dialog */}
            <BulkImportDialog
                entityName="PDFs"
                exampleCsv={exampleCsv}
                exampleJson={exampleJson}
                isOpen={bulkImportOpen}
                onClose={() => setBulkImportOpen(false)}
                onImport={handleBulkImport}
            />
        </div>
    );
}
