import React, { useState } from "react";
import { X, Lock, Eye, EyeOff } from "lucide-react";

interface NotifyClientPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (password: string) => void;
    error?: string;
}

export default function NotifyClientPasswordModal({
    isOpen,
    onClose,
    onConfirm,
    error,
}: NotifyClientPasswordModalProps) {
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleClose = () => {
        setPassword("");
        setShowPassword(false);
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password.trim()) {
            onConfirm(password.trim());
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
                className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
                onClick={handleClose}
            />

            <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
                <div
                    className="relative transform overflow-hidden rounded-2xl bg-white px-6 pb-6 pt-6 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-8"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-green-100 to-emerald-100 mb-6">
                        <Lock className="h-7 w-7 text-green-600" />
                    </div>

                    <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            Enter Password
                        </h3>
                        <p className="text-sm text-gray-600">
                            Please enter the password to send notification
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label
                                htmlFor="notifyPassword"
                                className="block text-sm font-semibold text-gray-700 mb-2"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="notifyPassword"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-gray-900"
                                    placeholder="Enter password"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {error && (
                                <p className="mt-2 text-sm text-red-600">{error}</p>
                            )}
                        </div>

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
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-all shadow-md"
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
