"use client";

import { useState, useEffect } from "react";
import { formatPhoneNumber } from "@/utils/phoneFormatter";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MessageSquare } from "lucide-react";

interface Question {
    id: string;
    phone: string;
    name: string;
    question: string;
    created_at: string;
    status: string;
}

export default function AgronomistPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const res = await fetch("/api/argonomist");
            const data = await res.json();
            // Sort by newest first
            const sortedData = Array.isArray(data)
                ? data.sort((a: Question, b: Question) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )
                : [];
            setQuestions(sortedData);
        } catch (error) {
            console.error("Error fetching questions:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Agronomist Questions</h1>
                <p className="text-muted-foreground mt-2">
                    View questions asked by farmers to the expert agronomist
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Recent Questions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Farmer</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead className="w-[40%]">Question</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {questions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                            No questions found yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    questions.map((q) => (
                                        <TableRow key={q.id}>
                                            <TableCell>
                                                {new Date(q.created_at).toLocaleDateString()}
                                                <div className="text-xs text-muted-foreground">
                                                    {new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{q.name}</TableCell>
                                            <TableCell>{formatPhoneNumber(q.phone)}</TableCell>
                                            <TableCell className="whitespace-pre-wrap">{q.question}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
