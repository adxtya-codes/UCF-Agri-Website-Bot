"use client";

import { useState, useEffect } from "react";
import { User, Receipt, Product, Shop, Tip } from "@/types";
import { formatPhoneNumber } from "@/utils/phoneFormatter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Receipt as ReceiptIcon, Package, Store, Lightbulb, Crown, Loader2 } from "lucide-react";

export default function DashboardPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [shops, setShops] = useState<Shop[]>([]);
    const [tips, setTips] = useState<Tip[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [usersRes, receiptsRes, productsRes, shopsRes, tipsRes] = await Promise.all([
                    fetch("/api/users"),
                    fetch("/api/receipts"),
                    fetch("/api/products"),
                    fetch("/api/shops"),
                    fetch("/api/tips"),
                ]);

                const [usersData, receiptsData, productsData, shopsData, tipsData] = await Promise.all([
                    usersRes.json(),
                    receiptsRes.json(),
                    productsRes.json(),
                    shopsRes.json(),
                    tipsRes.json(),
                ]);

                setUsers(usersData);
                setReceipts(receiptsData);
                setProducts(productsData);
                setShops(shopsData);
                setTips(tipsData);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const premiumUsers = users.filter((u) => u.is_premium);
    const recentUsers = users.slice(-5).reverse();
    const recentReceipts = receipts.slice(-5).reverse();

    const getUserPhone = (phone: string) => {
        const user = users.find(u => u.phone === phone);
        return user?.phone_numeric || formatPhoneNumber(phone);
    };

    const stats = [
        {
            title: "Total Users",
            value: users.length,
            icon: Users,
            color: "text-blue-600",
        },
        {
            title: "Premium Users",
            value: premiumUsers.length,
            icon: Crown,
            color: "text-yellow-600",
        },
        {
            title: "Total Receipts",
            value: receipts.length,
            icon: ReceiptIcon,
            color: "text-green-600",
        },
        {
            title: "Total Products",
            value: products.length,
            icon: Package,
            color: "text-purple-600",
        },
        {
            title: "UCF Authorised Retailers",
            value: shops.length,
            icon: Store,
            color: "text-orange-600",
        },
        {
            title: "Total Tips",
            value: tips.length,
            icon: Lightbulb,
            color: "text-pink-600",
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                    Overview of UCF Agri-Bot system statistics
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Users */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Interaction</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No users found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                recentUsers.map((user) => (
                                    <TableRow key={user.phone}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.phone_numeric || formatPhoneNumber(user.phone)}</TableCell>
                                        <TableCell>{user.email || "N/A"}</TableCell>
                                        <TableCell>
                                            {user.is_premium ? (
                                                <Badge variant="default">Premium</Badge>
                                            ) : (
                                                <Badge variant="secondary">Free</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {user.last_interaction
                                                ? new Date(user.last_interaction).toLocaleDateString()
                                                : "N/A"}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Recent Receipts */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Receipts</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Phone</TableHead>
                                <TableHead>Retailer</TableHead>
                                <TableHead>Purchase Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentReceipts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No receipts found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                recentReceipts.map((receipt, idx) => (
                                    <TableRow key={receipt.id || idx}>
                                        <TableCell>{getUserPhone(receipt.phone)}</TableCell>
                                        <TableCell className="font-medium">
                                            {receipt.retailer_name}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(receipt.purchase_date).toLocaleDateString()}
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
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
