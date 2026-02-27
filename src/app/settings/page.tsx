"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, Clock, Save, CheckCircle2, AlertCircle, Globe } from "lucide-react";

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

            {/* === PROMO CODE — AT TOP === */}
            <Card>
                <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                    <Ticket className="h-5 w-5 text-yellow-500" />
                    <CardTitle className="text-lg">Promo Code</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pt-4">
                    <p className="text-sm text-muted-foreground">
                        Users enter this code in the bot (option 8) to receive free premium access.
                        Change it here anytime — the bot reads the latest value instantly.
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
                            Reward Description (shown in bot)
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

            {/* === DAILY TIPS SCHEDULE === */}
            <Card>
                <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-lg">Daily Tips Schedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pt-4">
                    <p className="text-sm text-muted-foreground">
                        Set the time for daily farming tips to be sent to all active users.
                        Tips rotate automatically through all available tips each day.
                    </p>

                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="tips-time">
                            Send Time (24-hour format)
                        </label>
                        <input
                            id="tips-time"
                            type="time"
                            value={tipsSendTime}
                            onChange={(e) => setTipsSendTime(e.target.value)}
                            className="w-48 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        />
                    </div>

                    {/* Timezone info box */}
                    <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-md">
                        <Globe className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                        <div className="text-sm text-blue-700 space-y-1">
                            <p className="font-medium">Timezone: Zimbabwe (CAT — UTC+2)</p>
                            <p className="text-blue-600">
                                All times are in <strong>Central Africa Time (CAT)</strong>, which is
                                UTC+2. This is the local time in Zimbabwe. Currently set to{" "}
                                <strong>{tipsSendTime} CAT</strong>.
                            </p>
                        </div>
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
