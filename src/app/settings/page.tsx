"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, Clock, Save, CheckCircle2, AlertCircle } from "lucide-react";

export default function SettingsPage() {
    const [promoCode, setPromoCode] = useState("");
    const [promoDescription, setPromoDescription] = useState("");
    const [tipsSendTime, setTipsSendTime] = useState("08:00");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

    useEffect(() => {
        async function fetchSettings() {
            try {
                const res = await fetch("/api/settings");
                const data = await res.json();
                setPromoCode(data.promo_code || "");
                setPromoDescription(data.promo_code_description || "");
                setTipsSendTime(data.tips_send_time || "08:00");
            } catch {
                setToast({ type: "error", message: "Failed to load settings." });
            } finally {
                setLoading(false);
            }
        }
        fetchSettings();
    }, []);

    async function handleSave() {
        if (!promoCode.trim()) {
            setToast({ type: "error", message: "Promo code cannot be empty." });
            return;
        }

        setSaving(true);
        setToast(null);

        try {
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    promo_code: promoCode.trim(),
                    promo_code_description: promoDescription.trim(),
                    tips_send_time: tipsSendTime,
                }),
            });

            if (!res.ok) throw new Error("Failed to save");

            setToast({ type: "success", message: "Settings saved! Bot picks up changes instantly." });
        } catch {
            setToast({ type: "error", message: "Failed to save settings. Please try again." });
        } finally {
            setSaving(false);
            setTimeout(() => setToast(null), 5000);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Configure bot promo codes and daily tip schedule
                </p>
            </div>

            {/* Toast */}
            {toast && (
                <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium ${toast.type === "success"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                >
                    {toast.type === "success" ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                    ) : (
                        <AlertCircle className="h-5 w-5 shrink-0" />
                    )}
                    {toast.message}
                </div>
            )}

            {/* Promo Code Card */}
            <Card>
                <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                    <Ticket className="h-5 w-5 text-yellow-500" />
                    <CardTitle className="text-lg">Promo Code</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pt-4">
                    <p className="text-sm text-muted-foreground">
                        Users can enter this code in the bot to receive <strong>1 month free premium access</strong>.
                        Change it here anytime — the bot always reads the latest value.
                    </p>

                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="promo-code">
                            Active Promo Code
                        </label>
                        <input
                            id="promo-code"
                            type="text"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            placeholder="e.g. 8841"
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="promo-desc">
                            Description (shown in bot)
                        </label>
                        <input
                            id="promo-desc"
                            type="text"
                            value={promoDescription}
                            onChange={(e) => setPromoDescription(e.target.value)}
                            placeholder="e.g. 1 month free premium access"
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Daily Tips Time Card */}
            <Card>
                <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-lg">Daily Tips Schedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pt-4">
                    <p className="text-sm text-muted-foreground">
                        Set what time daily farming tips are sent to users, in{" "}
                        <strong>Zimbabwe time (CAT, UTC+2)</strong>. Use 24-hour format.
                    </p>

                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="tips-time">
                            Send Time (Zimbabwe time)
                        </label>
                        <input
                            id="tips-time"
                            type="time"
                            value={tipsSendTime}
                            onChange={(e) => setTipsSendTime(e.target.value)}
                            className="w-48 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        />
                        <p className="text-xs text-muted-foreground">
                            Currently set to: <strong>{tipsSendTime}</strong> CAT — tips rotate daily through all available tips automatically.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {saving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                    <Save className="h-4 w-4" />
                )}
                {saving ? "Saving..." : "Save All Settings"}
            </button>
        </div>
    );
}
