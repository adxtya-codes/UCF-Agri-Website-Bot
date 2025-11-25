"use client";

import { useState, useEffect } from "react";
import { FertilizerCalc } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2, Upload, Calculator } from "lucide-react";
import { BulkImportDialog } from "@/components/BulkImportDialog";
import { Badge } from "@/components/ui/badge";

// Yield-Based Calculator Component
function YieldCalculator() {
    const [crop, setCrop] = useState("");
    const [targetYield, setTargetYield] = useState("");
    const [recommendation, setRecommendation] = useState<{
        rate: string;
        message: string;
        soilAnalysis?: boolean;
    } | null>(null);

    const calculateRecommendation = () => {
        if (!crop || !targetYield) {
            alert("Please enter both crop name and target yield");
            return;
        }

        const yield_value = parseFloat(targetYield);

        if (isNaN(yield_value) || yield_value <= 0) {
            alert("Please enter a valid yield amount");
            return;
        }

        if (yield_value <= 2) {
            setRecommendation({
                rate: "150kg/ha",
                message: "This application rate is suitable for your target yield."
            });
        } else if (yield_value > 2 && yield_value <= 5) {
            setRecommendation({
                rate: "300kg/ha",
                message: "We recommend soil analysis to maximise performance of UCF fertilizer for your target yield.",
                soilAnalysis: true
            });
        } else {
            setRecommendation({
                rate: "Contact Agronomist",
                message: "For yields above 5 tonnes, we highly recommend soil analysis and consultation with our agronomist for personalized recommendations.",
                soilAnalysis: true
            });
        }
    };

    const resetCalculator = () => {
        setCrop("");
        setTargetYield("");
        setRecommendation(null);
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="crop">Crop/Plant Type</Label>
                    <Input
                        id="crop"
                        placeholder="e.g., Maize, Cotton, Cabbage"
                        value={crop}
                        onChange={(e) => setCrop(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="yield">Target Yield (tonnes)</Label>
                    <Input
                        id="yield"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="e.g., 3.5"
                        value={targetYield}
                        onChange={(e) => setTargetYield(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex gap-2">
                <Button onClick={calculateRecommendation} className="flex-1">
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate Recommendation
                </Button>
                {recommendation && (
                    <Button variant="outline" onClick={resetCalculator}>
                        Reset
                    </Button>
                )}
            </div>

            {recommendation && (
                <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="text-lg">Recommendation for {crop}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <p className="text-sm text-muted-foreground">Target Yield</p>
                            <p className="text-2xl font-bold">{targetYield} tonnes</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Recommended Application Rate</p>
                            <p className="text-2xl font-bold text-primary">{recommendation.rate}</p>
                        </div>
                        <div className="pt-2 border-t">
                            <p className="text-sm">{recommendation.message}</p>
                            {recommendation.soilAnalysis && (
                                <Badge variant="outline" className="mt-2 border-yellow-500 text-yellow-600">
                                    Soil Analysis Recommended
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default function FertilizersPage() {
    const [fertilizers, setFertilizers] = useState<FertilizerCalc[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [bulkImportOpen, setBulkImportOpen] = useState(false);
    const [editingFertilizer, setEditingFertilizer] = useState<FertilizerCalc | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const [formData, setFormData] = useState({
        crop: "",
        compound_at_planting: "",
        rate_at_planting: "",
        compound_top_dressing: "",
        rate_top_dressing: "",
        timing: "",
        remarks: "",
    });

    useEffect(() => {
        fetchFertilizers();
    }, []);

    const fetchFertilizers = async () => {
        try {
            const res = await fetch("/api/fertilizers");
            const data = await res.json();
            setFertilizers(data);
        } catch (error) {
            console.error("Error fetching fertilizers:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = "/api/fertilizers";
            const method = editingFertilizer ? "PUT" : "POST";

            const payload = {
                ...formData,
                compound_top_dressing: formData.compound_top_dressing || null,
            };

            await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            fetchFertilizers();
            handleCloseDialog();
        } catch (error) {
            console.error("Error saving fertilizer:", error);
        }
    };

    const handleDelete = async (crop: string) => {
        if (!confirm(`Are you sure you want to delete fertilizer data for ${crop}?`)) return;

        try {
            await fetch("/api/fertilizers", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ crop }),
            });
            fetchFertilizers();
        } catch (error) {
            console.error("Error deleting fertilizer:", error);
        }
    };

    const handleEdit = (fertilizer: FertilizerCalc) => {
        setEditingFertilizer(fertilizer);
        setFormData({
            crop: fertilizer.crop,
            compound_at_planting: fertilizer.compound_at_planting,
            rate_at_planting: fertilizer.rate_at_planting,
            compound_top_dressing: fertilizer.compound_top_dressing || "",
            rate_top_dressing: fertilizer.rate_top_dressing,
            timing: fertilizer.timing,
            remarks: fertilizer.remarks,
        });
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingFertilizer(null);
        setFormData({
            crop: "",
            compound_at_planting: "",
            rate_at_planting: "",
            compound_top_dressing: "",
            rate_top_dressing: "",
            timing: "",
            remarks: "",
        });
    };

    const filteredFertilizers = fertilizers.filter((f) =>
        f.crop.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleBulkImport = async (data: any[], format: "csv" | "json") => {
        const response = await fetch("/api/fertilizers/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data, format }),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || "Import failed");
        }

        await fetchFertilizers();
    };

    const exampleCsv = `crop,compound_at_planting,rate_at_planting,compound_top_dressing,rate_top_dressing,timing,remarks
Maize,Compound D,200kg/ha,Ammonium Nitrate,150kg/ha,4-6 weeks after planting,Split application recommended
Wheat,NPK 10-20-10,180kg/ha,,120kg/ha,At tillering,Monitor soil moisture`;

    const exampleJson = `[
  {
    "crop": "Maize",
    "compound_at_planting": "Compound D",
    "rate_at_planting": "200kg/ha",
    "compound_top_dressing": "Ammonium Nitrate",
    "rate_top_dressing": "150kg/ha",
    "timing": "4-6 weeks after planting",
    "remarks": "Split application recommended"
  },
  {
    "crop": "Wheat",
    "compound_at_planting": "NPK 10-20-10",
    "rate_at_planting": "180kg/ha",
    "compound_top_dressing": null,
    "rate_top_dressing": "120kg/ha",
    "timing": "At tillering",
    "remarks": "Monitor soil moisture"
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
                    <h1 className="text-3xl font-bold tracking-tight">Fertilizer Calculator</h1>
                    <p className="text-muted-foreground mt-2">
                        Yield-based fertilizer recommendations and crop-specific data
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setBulkImportOpen(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Bulk Import
                    </Button>
                    <Button onClick={() => setDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Crop
                    </Button>
                </div>
            </div>

            {/* Yield-Based Calculator */}
            <Card>
                <CardHeader>
                    <CardTitle>🧮 UCF Fertilizer Calculator</CardTitle>
                </CardHeader>
                <CardContent>
                    <YieldCalculator />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Fertilizer Recommendations ({fertilizers.length} crops)</CardTitle>
                        <Input
                            placeholder="Search by crop name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Crop</TableHead>
                                    <TableHead>At Planting</TableHead>
                                    <TableHead>Rate</TableHead>
                                    <TableHead>Top Dressing</TableHead>
                                    <TableHead>Rate</TableHead>
                                    <TableHead>Timing</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredFertilizers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                                            No fertilizer data found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredFertilizers.map((fert, idx) => (
                                        <TableRow key={`${fert.crop}-${idx}`}>
                                            <TableCell className="font-medium">{fert.crop}</TableCell>
                                            <TableCell>{fert.compound_at_planting}</TableCell>
                                            <TableCell>{fert.rate_at_planting}</TableCell>
                                            <TableCell>{fert.compound_top_dressing || "Nil"}</TableCell>
                                            <TableCell>{fert.rate_top_dressing}</TableCell>
                                            <TableCell className="text-sm">{fert.timing}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(fert)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(fert.crop)}
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
                    </div>
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingFertilizer ? "Edit Fertilizer Data" : "Add New Crop"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Crop Name</Label>
                                <Input
                                    required
                                    value={formData.crop}
                                    onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
                                    disabled={!!editingFertilizer}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Compound at Planting</Label>
                                    <Input
                                        required
                                        value={formData.compound_at_planting}
                                        onChange={(e) => setFormData({ ...formData, compound_at_planting: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Rate at Planting</Label>
                                    <Input
                                        required
                                        value={formData.rate_at_planting}
                                        onChange={(e) => setFormData({ ...formData, rate_at_planting: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Compound Top Dressing (optional)</Label>
                                    <Input
                                        value={formData.compound_top_dressing}
                                        onChange={(e) => setFormData({ ...formData, compound_top_dressing: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Rate Top Dressing</Label>
                                    <Input
                                        required
                                        value={formData.rate_top_dressing}
                                        onChange={(e) => setFormData({ ...formData, rate_top_dressing: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Timing</Label>
                                <Input
                                    value={formData.timing}
                                    onChange={(e) => setFormData({ ...formData, timing: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Remarks</Label>
                                <Input
                                    value={formData.remarks}
                                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editingFertilizer ? "Update" : "Add"} Crop
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Bulk Import Dialog */}
            <BulkImportDialog
                entityName="Fertilizers"
                exampleCsv={exampleCsv}
                exampleJson={exampleJson}
                isOpen={bulkImportOpen}
                onClose={() => setBulkImportOpen(false)}
                onImport={handleBulkImport}
            />
        </div>
    );
}
