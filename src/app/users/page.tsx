"use client";

import { useState, useEffect } from "react";
import { User } from "@/types";
import { formatPhoneNumber } from "@/utils/phoneFormatter";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Search, Plus, Pencil, Trash2, Loader2, Upload } from "lucide-react";
import { BulkImportDialog } from "@/components/BulkImportDialog";

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [bulkImportOpen, setBulkImportOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<Partial<User>>({});

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const filtered = users.filter(
            (user) =>
                (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (user.phone && user.phone.includes(searchQuery)) ||
                (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setFilteredUsers(filtered);
    }, [searchQuery, users]);

    const fetchUsers = async () => {
        setLoading(true);
        const res = await fetch("/api/users");
        const data = await res.json();
        setUsers(data);
        setFilteredUsers(data);
        setLoading(false);
    };

    const handleAdd = () => {
        setEditingUser(null);
        setFormData({
            name: "",
            phone: "",
            email: "",
            is_premium: false,
            premium_expiry_date: "",
            conversation_state: "idle",
            location: { latitude: 0, longitude: 0 },
            last_interaction: new Date().toISOString(),
        });
        setDialogOpen(true);
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData(user);
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.phone) {
            alert("Name and phone are required");
            return;
        }

        const method = editingUser ? "PUT" : "POST";
        await fetch("/api/users", {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });

        setDialogOpen(false);
        fetchUsers();
    };

    const handleDelete = async (phone: string) => {
        if (!confirm("Are you sure you want to delete this user?")) return;

        await fetch("/api/users", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone }),
        });

        fetchUsers();
    };

    const togglePremium = async (user: User) => {
        const updated = { ...user, is_premium: !user.is_premium };
        await fetch("/api/users", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updated),
        });
        fetchUsers();
    };

    const handleBulkImport = async (data: any[], format: "csv" | "json") => {
        const response = await fetch("/api/users/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data, format }),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || "Import failed");
        }

        await fetchUsers();
    };

    const exampleCsv = `phone,name,email,is_premium,premium_expiry_date,latitude,longitude
263773526659@c.us,John Farmer,john@example.com,true,2025-12-31,-17.8545,30.9987
263783506625@c.us,Jane Grower,jane@example.com,false,,-18.7816,31.1072`;

    const exampleJson = `[
  {
    "phone": "263773526659@c.us",
    "name": "John Farmer",
    "email": "john@example.com",
    "is_premium": true,
    "premium_expiry_date": "2025-12-31T00:00:00Z",
    "latitude": -17.8545,
    "longitude": 30.9987
  },
  {
    "phone": "263783506625@c.us",
    "name": "Jane Grower",
    "email": "jane@example.com",
    "is_premium": false
  }
]`;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage user accounts and premium access
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setBulkImportOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Bulk Import
                    </Button>
                    <Button onClick={handleAdd}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add User
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name, phone, or email..."
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
                                <TableHead>Name</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Premium</TableHead>
                                <TableHead>Expiry Date</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Last Interaction</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                                        No users found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.phone}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.phone_numeric || formatPhoneNumber(user.phone)}</TableCell>
                                        <TableCell>{user.email || "N/A"}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={user.is_premium}
                                                    onCheckedChange={() => togglePremium(user)}
                                                />
                                                {user.is_premium ? (
                                                    <Badge variant="default">Premium</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Free</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {user.premium_expiry_date
                                                ? new Date(user.premium_expiry_date).toLocaleDateString()
                                                : "N/A"}
                                        </TableCell>
                                        <TableCell>
                                            {user.location?.latitude && user.location?.longitude
                                                ? `${user.location.latitude.toFixed(4)}, ${user.location.longitude.toFixed(4)}`
                                                : "N/A"}
                                        </TableCell>
                                        <TableCell>
                                            {user.last_interaction
                                                ? new Date(user.last_interaction).toLocaleDateString()
                                                : "N/A"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(user)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDelete(user.phone)}
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
                        <DialogTitle>{editingUser ? "Edit User" : "Add User"}</DialogTitle>
                        <DialogDescription>
                            {editingUser
                                ? "Update user information"
                                : "Create a new user account"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                value={formData.name || ""}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone *</Label>
                            <Input
                                id="phone"
                                value={formData.phone || ""}
                                onChange={(e) =>
                                    setFormData({ ...formData, phone: e.target.value })
                                }
                                disabled={!!editingUser}
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

                        <div className="flex items-center gap-2">
                            <Switch
                                checked={formData.is_premium || false}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, is_premium: checked })
                                }
                            />
                            <Label>Premium Access</Label>
                        </div>

                        {formData.is_premium && (
                            <div className="grid gap-2">
                                <Label htmlFor="expiry">Premium Expiry Date</Label>
                                <Input
                                    id="expiry"
                                    type="date"
                                    value={formData.premium_expiry_date || ""}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            premium_expiry_date: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="lat">Latitude</Label>
                                <Input
                                    id="lat"
                                    type="number"
                                    step="0.000001"
                                    value={formData.location?.latitude || 0}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            location: {
                                                ...formData.location,
                                                latitude: parseFloat(e.target.value),
                                            },
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
                                    value={formData.location?.longitude || 0}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            location: {
                                                ...formData.location,
                                                longitude: parseFloat(e.target.value),
                                            },
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="state">Conversation State</Label>
                            <Input
                                id="state"
                                value={formData.conversation_state || ""}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        conversation_state: e.target.value,
                                    })
                                }
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            {editingUser ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Import Dialog */}
            <BulkImportDialog
                entityName="Users"
                exampleCsv={exampleCsv}
                exampleJson={exampleJson}
                isOpen={bulkImportOpen}
                onClose={() => setBulkImportOpen(false)}
                onImport={handleBulkImport}
            />
        </div>
    );
}
