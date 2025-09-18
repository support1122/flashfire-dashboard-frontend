import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toastUtils } from "../../../../utils/toast";

interface RegisterFormProps {
    onRegister ?: (email: string, password: string) => void;
}

const RegisterOPS: React.FC<RegisterFormProps> = ({  }) => {

    const [formData, setFormData] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            toastUtils.error("Email and password are required");
            return;
        }

        // Ensure @flashfirehq is present in the email
        const normalizedEmail = formData.email.includes("@")
            ? formData.email
            : `${formData.email}@flashfirehq`;
            console.log("normalizedEmail ::", normalizedEmail);
        setLoading(true);
        const loadingToast = toastUtils.loading("Creating operations user...");
        try {
            const Api = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8086";
            const res = await fetch(`${Api}/operations/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: normalizedEmail,
                    password: formData.password,
                }),
            });

            const result = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(result?.error || result?.message || "Failed to create operations user");
            }

            toastUtils.dismissToast(loadingToast);
            toastUtils.success(result?.message || "Operation user created successfully");
            setFormData({ email: "", password: "" });
        } catch (error: any) {
            toastUtils.dismissToast(loadingToast);
            toastUtils.error(error?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Create a new Operation team member account
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            required
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    email: e.target.value,
                                })
                            }
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="user@flashfirehq"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={formData.password}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    password: e.target.value,
                                })
                            }
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl ${
                        loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                >
                    {loading ? "Creating..." : "Create"}
                </button>
            </form>
        </div>
    );
};

export default RegisterOPS;