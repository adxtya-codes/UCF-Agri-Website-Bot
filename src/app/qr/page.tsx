'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function QRCodePage() {
    const [imageKey, setImageKey] = useState(0);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Set initial timestamp on mount (client-side only)
        setImageKey(Date.now());

        // Auto-refresh the QR code every 3 seconds
        const interval = setInterval(() => {
            setImageKey(Date.now());
            setLoading(true);
            setError(false);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const handleImageLoad = () => {
        setLoading(false);
        setError(false);
    };

    const handleImageError = () => {
        setLoading(false);
        setError(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        WhatsApp Bot QR Code
                    </h1>
                    <p className="text-gray-600">
                        Scan this QR code with WhatsApp to connect the bot
                    </p>
                </div>

                {/* QR Code Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
                    <div className="flex flex-col items-center justify-center">
                        {loading && !error && (
                            <div className="mb-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                                <p className="text-gray-600 mt-4">Loading QR code...</p>
                            </div>
                        )}

                        {error ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">⚠️</div>
                                <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                                    QR Code Not Available
                                </h2>
                                <p className="text-gray-600 mb-4">
                                    The bot may already be connected or not running.
                                </p>
                                <p className="text-sm text-gray-500">
                                    Make sure the bot is running with <code className="bg-gray-100 px-2 py-1 rounded">npm run bot</code>
                                </p>
                            </div>
                        ) : (
                            <div className="relative">
                                <img
                                    src={`/api/qr-image?t=${imageKey}`}
                                    alt="WhatsApp QR Code"
                                    className={`max-w-md w-full h-auto rounded-lg border-4 border-green-500 ${loading ? 'opacity-0' : 'opacity-100'
                                        } transition-opacity duration-300`}
                                    onLoad={handleImageLoad}
                                    onError={handleImageError}
                                />

                                {!loading && (
                                    <div className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full p-2 animate-pulse">
                                        <svg
                                            className="w-6 h-6"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                            />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {!error && (
                        <div className="mt-6 text-center">
                            <div className="inline-flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-full">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                </span>
                                Auto-refreshing every 3 seconds
                            </div>
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="text-2xl">📱</span>
                        How to Connect
                    </h3>
                    <ol className="space-y-3 text-gray-700">
                        <li className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                1
                            </span>
                            <span>Open WhatsApp on your phone</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                2
                            </span>
                            <span>Tap <strong>Menu</strong> or <strong>Settings</strong> and select <strong>Linked Devices</strong></span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                3
                            </span>
                            <span>Tap <strong>Link a Device</strong></span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                4
                            </span>
                            <span>Point your phone at this screen to scan the QR code</span>
                        </li>
                    </ol>
                </div>

                {/* Back Button */}
                <div className="text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 shadow-lg"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                            />
                        </svg>
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
