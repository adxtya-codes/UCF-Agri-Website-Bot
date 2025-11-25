"use client";

import { useState, useEffect } from "react";
import { CropDiagnosis, User } from "@/types";
import { formatPhoneNumber } from "@/utils/phoneFormatter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, Pencil, Trash2 } from "lucide-react";

export default function CropDiagnosisPage() {
    const [diagnoses, setDiagnoses] = useState<CropDiagnosis[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [viewingDiagnosis, setViewingDiagnosis] = useState<CropDiagnosis | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const [formData, setFormData] = useState({
        diagnosis: "",
        status: "diagnosed" as "pending" | "diagnosed" | "on_hold",
    });

    useEffect(() => {
        fetchDiagnoses();
    }, []);

    const fetchDiagnoses = async () => {
        try {
            const [diagnosesRes, usersRes] = await Promise.all([
                fetch("/api/crop-diagnosis"),
                fetch("/api/users")
            ]);
            const diagnosesData = await diagnosesRes.json();
            const usersData = await usersRes.json();
            setDiagnoses(diagnosesData);
            setUsers(usersData);
        } catch (error) {
            console.error("Error fetching diagnoses:", error);
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
        if (!viewingDiagnosis) return;

        try {
            await fetch("/api/crop-diagnosis", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...viewingDiagnosis,
                    diagnosis: formData.diagnosis,
                    status: formData.status,
                }),
            });

            fetchDiagnoses();
            handleCloseDialog();
        } catch (error) {
            console.error("Error updating diagnosis:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this diagnosis request?")) return;

        try {
            await fetch("/api/crop-diagnosis", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            fetchDiagnoses();
        } catch (error) {
            console.error("Error deleting diagnosis:", error);
        }
    };

    const handleView = (diagnosis: CropDiagnosis) => {
        setViewingDiagnosis(diagnosis);
        setFormData({
            diagnosis: diagnosis.diagnosis || "",
            status: diagnosis.status || "pending",
        });
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setViewingDiagnosis(null);
        setFormData({
            diagnosis: "",
            status: "diagnosed",
        });
    };

    const filteredDiagnoses = diagnoses.filter((d) =>
        d.phone.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pendingCount = diagnoses.filter(d => d.status === "pending").length;

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
                <h1 className="text-3xl font-bold tracking-tight">Crop Diagnosis</h1>
                <p className="text-muted-foreground mt-2">
                    Review and diagnose crop disease images submitted by users
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{diagnoses.length}</div>
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
                        <CardTitle className="text-sm font-medium">Diagnosed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{diagnoses.length - pendingCount}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Diagnosis Requests</CardTitle>
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

                                <TableHead>Image</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredDiagnoses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                        No diagnosis requests found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredDiagnoses.map((diagnosis, idx) => (
                                    <TableRow key={diagnosis.id || `diagnosis-${idx}`}>
                                        <TableCell className="font-medium">{getUserName(diagnosis.phone)}</TableCell>
                                        <TableCell>{getUserPhone(diagnosis.phone)}</TableCell>
                                        <TableCell>{new Date(diagnosis.created_at).toLocaleString()}</TableCell>

                                        <TableCell>
                                            <a href={diagnosis.image} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                View Image
                                            </a>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleView(diagnosis)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (!diagnosis.id) {
                                                            alert("Cannot delete: Diagnosis ID is missing. Please refresh the page.");
                                                            return;
                                                        }
                                                        handleDelete(diagnosis.id);
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
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Crop Diagnosis</DialogTitle>
                    </DialogHeader>
                    {viewingDiagnosis && (
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>User Phone</Label>
                                    <Input value={viewingDiagnosis.phone} disabled />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Submitted</Label>
                                    <Input value={new Date(viewingDiagnosis.created_at).toLocaleString()} disabled />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Crop Image</Label>
                                    <div className="border rounded-md p-2">
                                        <img src={viewingDiagnosis.image} alt="Crop" className="max-h-96 w-full object-contain" />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Diagnosis</Label>
                                    <Textarea
                                        value={formData.diagnosis}
                                        onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                                        rows={4}
                                        placeholder="Enter your diagnosis and recommendations..."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Status</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as "pending" | "diagnosed" })}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="diagnosed">Diagnosed</option>
                                    </select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    Save Diagnosis
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
