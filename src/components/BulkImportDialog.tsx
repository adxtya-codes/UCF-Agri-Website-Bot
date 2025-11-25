"use client";

import { useState } from "react";
import Papa from "papaparse";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface BulkImportDialogProps {
    entityName: string;
    exampleCsv: string;
    exampleJson: string;
    isOpen: boolean;
    onClose: () => void;
    onImport: (data: any[], format: "csv" | "json") => Promise<void>;
}

export function BulkImportDialog({
    entityName,
    exampleCsv,
    exampleJson,
    isOpen,
    onClose,
    onImport,
}: BulkImportDialogProps) {
    const [format, setFormat] = useState<"csv" | "json">("json");
    const [inputData, setInputData] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleFormatChange = (newFormat: string) => {
        setFormat(newFormat as "csv" | "json");
        setInputData("");
        setError("");
        setSuccess("");
    };

    const validateAndParse = (): any[] | null => {
        setError("");
        setSuccess("");

        if (!inputData.trim()) {
            setError("Please enter data to import");
            return null;
        }

        if (format === "json") {
            try {
                const parsed = JSON.parse(inputData);
                if (!Array.isArray(parsed)) {
                    setError("JSON must be an array of objects");
                    return null;
                }
                return parsed;
            } catch (err: any) {
                setError(`Invalid JSON: ${err.message}`);
                return null;
            }
        } else {
            // CSV parsing
            const result = Papa.parse(inputData, {
                header: true,
                skipEmptyLines: true,
                transformHeader: (header) => header.trim(),
            });

            if (result.errors.length > 0) {
                setError(`CSV parsing error: ${result.errors[0].message}`);
                return null;
            }

            if (!result.data || result.data.length === 0) {
                setError("No data found in CSV");
                return null;
            }

            return result.data as any[];
        }
    };

    const handleImport = async () => {
        const data = validateAndParse();
        if (!data) return;

        setLoading(true);
        try {
            await onImport(data, format);
            setSuccess(`Successfully imported ${data.length} ${entityName.toLowerCase()}`);
            setInputData("");
            setTimeout(() => {
                onClose();
                setSuccess("");
            }, 1500);
        } catch (err: any) {
            setError(err.message || "Import failed");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setInputData("");
        setError("");
        setSuccess("");
        setFormat("json");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Bulk Import {entityName || 'Items'}</DialogTitle>
                    <DialogDescription>
                        Import multiple {(entityName || 'items').toLowerCase()} at once using CSV or JSON format
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={format} onValueChange={handleFormatChange}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="json">JSON</TabsTrigger>
                        <TabsTrigger value="csv">CSV</TabsTrigger>
                    </TabsList>

                    <TabsContent value="json" className="space-y-4">
                        <div className="space-y-2">
                            <Label>JSON Data</Label>
                            <Textarea
                                placeholder="Paste your JSON array here..."
                                value={inputData}
                                onChange={(e) => setInputData(e.target.value)}
                                className="font-mono text-sm min-h-[200px]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Example JSON Format</Label>
                            <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                                {exampleJson}
                            </pre>
                        </div>
                    </TabsContent>

                    <TabsContent value="csv" className="space-y-4">
                        <div className="space-y-2">
                            <Label>CSV Data</Label>
                            <Textarea
                                placeholder="Paste your CSV data here (including headers)..."
                                value={inputData}
                                onChange={(e) => setInputData(e.target.value)}
                                className="font-mono text-sm min-h-[200px]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Example CSV Format</Label>
                            <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                                {exampleCsv}
                            </pre>
                        </div>
                    </TabsContent>
                </Tabs>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="border-green-500 text-green-700">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleImport} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Import
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
