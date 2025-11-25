"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    Receipt,
    Package,
    Store,
    Lightbulb,
    Menu,
    X,
    FileText,
    Calculator,
    Leaf,
    Droplet,
    LogOut,
    MessageSquare,
} from "lucide-react";
import { useState } from "react";

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Users", href: "/users", icon: Users },
    { name: "Receipts", href: "/receipts", icon: Receipt },
    { name: "Products", href: "/products", icon: Package },
    { name: "Retailers Name", href: "/retailers", icon: Store },
    { name: "UCF Authorized Dealers", href: "/shops", icon: Store },
    { name: "Tips", href: "/tips", icon: Lightbulb },
    { name: "Agronomist Questions", href: "/argonomist", icon: MessageSquare },
    { name: "Farming Guides", href: "/pdfs", icon: FileText },
    { name: "Fertilizer Calc", href: "/fertilizers", icon: Calculator },
    { name: "Crop Diagnosis", href: "/crop-diagnosis", icon: Leaf },
    { name: "Soil Analysis", href: "/soil-analysis", icon: Droplet },
];

export function Sidebar() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <>
            {/* Mobile menu button */}
            <button
                type="button"
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-primary text-primary-foreground"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
                {mobileMenuOpen ? (
                    <X className="h-6 w-6" />
                ) : (
                    <Menu className="h-6 w-6" />
                )}
            </button>

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
                    mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Logo/Title */}
                    <div className="flex items-center h-16 px-6 border-b border-border">
                        <h1 className="text-xl font-bold text-primary">UCF Agri-Bot CMS</h1>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-border space-y-4">
                        <button
                            onClick={async () => {
                                await fetch("/api/auth/logout", { method: "POST" });
                                window.location.href = "/login";
                            }}
                            className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                        >
                            <LogOut className="h-5 w-5" />
                            Logout
                        </button>
                        <p className="text-xs text-muted-foreground text-center">
                            UCF Fertilizers © 2025
                        </p>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}
        </>
    );
}
