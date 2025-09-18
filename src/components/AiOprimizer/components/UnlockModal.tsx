import { useState, useEffect } from "react";
import { useResumeUnlockStore } from "../store/resumeStore";
import { getStoredPin, storePin, clearStoredPin, getPinTimeRemainingString } from "../../../utils/pinStorage";

interface UnlockModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function UnlockModal({ isOpen, onClose }: UnlockModalProps) {
    const [unlockKey, setUnlockKey] = useState("");
    const [error, setError] = useState("");
    const { validateUnlockKey } = useResumeUnlockStore();

    // Auto-fill PIN when modal opens
    useEffect(() => {
        if (isOpen) {
            const storedPin = getStoredPin();
            if (storedPin) {
                setUnlockKey(storedPin);
            }
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (await validateUnlockKey(unlockKey)) {
            // Store PIN after successful verification
            storePin(unlockKey);
            setError("");
            onClose();
        } else {
            setError("Invalid unlock key. Please try again.");
            setUnlockKey("");
        }
    };

    const handleClose = () => {
        setUnlockKey("");
        setError("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop with heavy blur */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                    <div>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                            <svg
                                className="h-6 w-6 text-yellow-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                            </svg>
                        </div>
                        <div className="mt-3 text-center sm:mt-5">
                            <h3 className="text-base font-semibold leading-6 text-gray-900">
                                Resume Editor Locked
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500">
                                    Enter the unlock key to edit resume
                                    sections. Only the Job Description field is
                                    available for optimization.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 sm:mt-6">
                        <div>
                            <label
                                htmlFor="unlock-key"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Unlock Key
                            </label>
                            <input
                                type="password"
                                id="unlock-key"
                                value={unlockKey}
                                onChange={(e) => setUnlockKey(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleSubmit(e)
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                                placeholder="Enter unlock key..."
                                autoFocus
                            />
                            {getStoredPin() && (
                                <div className="mt-2 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-green-600">
                                            ✓ PIN auto-filled from storage
                                        </span>
                                        {getPinTimeRemainingString() && (
                                            <span className="text-xs text-gray-500">
                                                Expires in {getPinTimeRemainingString()}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            clearStoredPin();
                                            setUnlockKey("");
                                        }}
                                        className="text-xs text-red-600 hover:text-red-800 underline"
                                    >
                                        Clear stored PIN
                                    </button>
                                </div>
                            )}
                            {error && (
                                <p className="mt-2 text-sm text-red-600">
                                    {error}
                                </p>
                            )}
                        </div>

                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                            <button
                                onClick={handleSubmit}
                                className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:col-start-2"
                            >
                                Unlock
                            </button>
                            <button
                                onClick={handleClose}
                                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
