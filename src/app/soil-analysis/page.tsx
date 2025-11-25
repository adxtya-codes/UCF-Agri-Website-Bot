"use client";

import { useState, useEffect } from "react";
import { SoilAnalysis, User } from "@/types";
import { formatPhoneNumber } from "@/utils/phoneFormatter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, Trash2 } from "lucide-react";

export default function SoilAnalysisPage() {
    const [analyses, setAnalyses] = useState<SoilAnalysis[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [viewingAnalysis, setViewingAnalysis] = useState<SoilAnalysis | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const [formData, setFormData] = useState({
        analysis: "",
        status: "analyzed" as "pending" | "analyzed" | "on_hold",
        ph: 0,
        nitrogen: "",
        phosphorus: "",
        potassium: "",
        recommendations: "",
    });

    useEffect(() => {
        fetchAnalyses();
    }, []);

    const fetchAnalyses = async () => {
        try {
            const [analysesRes, usersRes] = await Promise.all([
                fetch("/api/soil-analysis"),
                fetch("/api/users")
            ]);
            const analysesData = await analysesRes.json();
            const usersData = await usersRes.json();
            setAnalyses(analysesData);
            setUsers(usersData);
        } catch (error) {
            console.error("Error fetching analyses:", error);
        } finally {
            setLoading(false);
        }
    };

    const getUserName = (phone: string) => {
        const user = users.find(u => u.phone === phone);
        return user?.name || "Unknown";
    };

    const getUserPhone = (phone: string) => {
        const user = users.find(u => u.phone === phone);
        return user?.phone_numeric || formatPhoneNumber(phone);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!viewingAnalysis) return;

        try {
            await fetch("/api/soil-analysis", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...viewingAnalysis,
                    ...formData,
                }),
            });

            fetchAnalyses();
            handleCloseDialog();
        } catch (error) {
            console.error("Error updating analysis:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this soil analysis request?")) return;

        try {
            await fetch("/api/soil-analysis", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            fetchAnalyses();
        } catch (error) {
            console.error("Error deleting analysis:", error);
        }
    };

    const handleView = (analysis: SoilAnalysis) => {
        setViewingAnalysis(analysis);
        setFormData({
            analysis: analysis.analysis || "",
            status: analysis.status || "pending",
            ph: analysis.ph || 0,
            nitrogen: analysis.nitrogen || "",
            phosphorus: analysis.phosphorus || "",
            potassium: analysis.potassium || "",
            recommendations: analysis.recommendations || "",
        });
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setViewingAnalysis(null);
        setFormData({
            analysis: "",
            status: "analyzed",
            ph: 0,
            nitrogen: "",
            phosphorus: "",
            potassium: "",
            recommendations: "",
        });
    };

    const filteredAnalyses = analyses.filter((a) =>
        a.phone.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pendingCount = analyses.filter(a => a.status === "pending").length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Soil Analysis</h1>
                <p className="text-muted-foreground mt-2">
                    Review and analyze soil test images submitted by users
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analyses.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Analyzed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{analyses.length - pendingCount}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Analysis Requests</CardTitle>
                        <Input
                            placeholder="Search by phone..."
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
                                <TableHead>User</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Submitted</TableHead>

                                <TableHead>pH</TableHead>
                                <TableHead>Image</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAnalyses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                                        No soil analysis requests found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAnalyses.map((analysis, idx) => (
                                    <TableRow key={analysis.id || `analysis-${idx}`}>
                                        <TableCell className="font-medium">{getUserName(analysis.phone)}</TableCell>
                                        <TableCell>{getUserPhone(analysis.phone)}</TableCell>
                                        <TableCell>{new Date(analysis.created_at).toLocaleString()}</TableCell>

                                        <TableCell>{analysis.ph || "N/A"}</TableCell>
                                        <TableCell>
                                            <a href={analysis.image} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                View Image
                                            </a>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleView(analysis)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (!analysis.id) {
                                                            alert("Cannot delete: Analysis ID is missing. Please refresh the page.");
                                                            return;
                                                        }
                                                        handleDelete(analysis.id);
                                                    }}
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
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Soil Analysis</DialogTitle>
                    </DialogHeader>
                    {viewingAnalysis && (
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>User Phone</Label>
                                        <Input value={viewingAnalysis.phone} disabled />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Submitted</Label>
                                        <Input value={new Date(viewingAnalysis.created_at).toLocaleString()} disabled />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Soil Sample Image</Label>
                                    <div className="border rounded-md p-2">
                                        <img src={viewingAnalysis.image} alt="Soil Sample" className="max-h-96 w-full object-contain" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="grid gap-2">
                                        <Label>pH Level</Label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={formData.ph}
                                            onChange={(e) => setFormData({ ...formData, ph: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Nitrogen (N)</Label>
                                        <Input
                                            value={formData.nitrogen}
                                            onChange={(e) => setFormData({ ...formData, nitrogen: e.target.value })}
                                            placeholder="e.g., Low, Medium, High"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Phosphorus (P)</Label>
                                        <Input
                                            value={formData.phosphorus}
                                            onChange={(e) => setFormData({ ...formData, phosphorus: e.target.value })}
                                            placeholder="e.g., Low, Medium, High"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Potassium (K)</Label>
                                        <Input
                                            value={formData.potassium}
                                            onChange={(e) => setFormData({ ...formData, potassium: e.target.value })}
                                            placeholder="e.g., Low, Medium, High"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Analysis Summary</Label>
                                    <Textarea
                                        value={formData.analysis}
                                        onChange={(e) => setFormData({ ...formData, analysis: e.target.value })}
                                        rows={3}
                                        placeholder="Overall soil health assessment..."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Recommendations</Label>
                                    <Textarea
                                        value={formData.recommendations}
                                        onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                                        rows={4}
                                        placeholder="Fertilizer recommendations, amendments, etc..."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Status</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as "pending" | "analyzed" })}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="analyzed">Analyzed</option>
                                    </select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    Save Analysis
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
