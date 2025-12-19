import React, { useState } from "react";
import { X, Lock } from "lucide-react";

interface SecretKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (key: string) => void;
    error?: string;
}

export default function SecretKeyModal({
    isOpen,
    onClose,
    onConfirm,
    error,
}: SecretKeyModalProps) {
    const [secretKey, setSecretKey] = useState("");

    const handleClose = () => {
        setSecretKey("");
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (secretKey.trim()) {
            onConfirm(secretKey.trim());
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
                <div
                    className="relative transform overflow-hidden rounded-2xl bg-white px-6 pb-6 pt-6 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-8"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Icon */}
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-orange-100 to-red-100 mb-6">
                        <Lock className="h-7 w-7 text-orange-600" />
                    </div>

                    {/* Title */}
                    <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            Enter Secret Key
                        </h3>
                        <p className="text-sm text-gray-600">
                            Please enter the secret key to save your changes
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label
                                htmlFor="secretKey"
                                className="block text-sm font-semibold text-gray-700 mb-2"
                            >
                                Secret Key
                            </label>
                            <input
                                id="secretKey"
                                type="password"
                                value={secretKey}
                                onChange={(e) => setSecretKey(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-gray-900"
                                placeholder="Enter secret key"
                                autoFocus
                            />
                            {error && (
                                <p className="mt-2 text-sm text-red-600">{error}</p>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-all shadow-md"
                            >
                                Confirm
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

