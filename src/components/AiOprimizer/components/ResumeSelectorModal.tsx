import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ResumeData } from "../types/ResumeTypes";
import { useResumeUnlockStore } from "../store/resumeStore";
import { Lock, X, AlertCircle } from "lucide-react";
import { getStoredPin, storePin, clearStoredPin, getPinTimeRemainingString } from "../../../utils/pinStorage";

type Props = {
    open: boolean;
    onClose: () => void;
    onSelect: (resume: ResumeData) => void;
    version?: number;
};

export default function ResumeSelectorModal({
    open,
    onClose,
    onSelect,
    version,
}: Props) {
    const [resumes, setResumes] = useState<any[]>([]);
    const [filteredResumes, setFilteredResumes] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [unlockModalOpen, setUnlockModalOpen] = useState(false);
    const [selectedResumeId, setSelectedResumeId] = useState<string | null>(
        null
    );
    const [unlockKey, setUnlockKey] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const { setResumeId } = useResumeUnlockStore();
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

    useEffect(() => {
        const userRole = localStorage.getItem("role");
        console.log("yourRole:", userRole);
        setIsAdmin(userRole == "admin");
        if (userRole == "admin") {
            console.log("you are admin");
        }
    }, []);

    // Reset state + fetch resumes
    useEffect(() => {
        if (!open) {
            setResumes([]);
            setFilteredResumes([]);
            setSearchTerm("");
            setUnlockModalOpen(false);
            setSelectedResumeId(null);
            setUnlockKey("");
            setErrorMessage(null);
            return;
        }

        const fetchResumes = async () => {
            try {
                let url = `${apiUrl}/api/resumes`; // default (all)
                if (version == 1) {
                    url = `${apiUrl}/api/resumes/v1`;
                }

                const res = await fetch(url);
                const data = await res.json();
                setResumes(data);
                setFilteredResumes(data);
            } catch (err) {
                console.error("Error fetching resumes:", err);
            }
        };

        fetchResumes();
    }, [open, version]);

    // Filter resumes
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredResumes(resumes);
        } else {
            setFilteredResumes(
                resumes.filter((r) =>
                    `${r.firstName} ${r.lastName}`
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
                )
            );
        }
    }, [searchTerm, resumes]);

    const handleResumeClick = (resumeId: string) => {
        setSelectedResumeId(resumeId);
        setUnlockModalOpen(true);
        setErrorMessage(null);
        
        // Auto-fill PIN if stored
        const storedPin = getStoredPin();
        setUnlockKey(storedPin || "");
    };

    const handleUnlock = async () => {
        if (!selectedResumeId) return;

        try {
            let resumeData;
            // Skip unlock key validation for admins
            if (isAdmin) {
                const resumeRes = await fetch(`${apiUrl}/api/resume`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        resume_id: selectedResumeId,
                    }),
                });

                resumeData = await resumeRes.json();
                if (resumeData.error) {
                    setErrorMessage(resumeData.error);
                    return;
                }

                if (!resumeRes.ok) {
                    throw new Error(
                        resumeData.error || "Failed to load resume"
                    );
                }
            } else {
                // Non-admin: Validate unlock key
                const res = await fetch(`${apiUrl}/api/verify-unlock-key`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "unlock-key": unlockKey.trim(),
                    },
                    body: JSON.stringify({
                        resume_id: selectedResumeId,
                    }),
                });

                const data = await res.json();
                if (data.error) {
                    setErrorMessage(data.error);
                    return;
                }

                if (!res.ok) {
                    throw new Error(
                        data.error || "Failed to verify unlock key"
                    );
                }

                if (!data.match) {
                    setErrorMessage("Invalid unlock key. Please try again.");
                    return;
                }

                // Store PIN after successful verification
                storePin(unlockKey.trim());

                // Fetch resume for non-admin after key validation
                const resumeRes = await fetch(`${apiUrl}/api/resume`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        resume_id: selectedResumeId,
                    }),
                });

                resumeData = await resumeRes.json();
                if (resumeData.error) {
                    setErrorMessage(resumeData.error);
                    return;
                }

                if (!resumeRes.ok) {
                    throw new Error(
                        resumeData.error || "Failed to load resume"
                    );
                }
            }

            // Common logic for both admin and non-admin after fetching resume
            setResumeId(selectedResumeId);
            onSelect(resumeData);
            setUnlockModalOpen(false);
            onClose();
        } catch (err) {
            console.error("Error:", err);
            setErrorMessage((err as Error).message || "An error occurred");
        }
    };

    if (!open) return null;

    return createPortal(
        <>
            {/* Main Resume Selector */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
                onClick={onClose}
            >
                <div
                    className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Select a Resume
                        </h2>
                        <button onClick={onClose}>
                            <X className="w-6 h-6 text-gray-500 hover:text-gray-800" />
                        </button>
                    </div>

                    <div className="mt-4">
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="mt-4 h-[180px] overflow-y-auto">
                        {filteredResumes.length === 0 ? (
                            <p className="text-gray-600">No resumes found.</p>
                        ) : (
                            <ul className="space-y-2">
                                {filteredResumes.map((r) => (
                                    <li
                                        key={r._id}
                                        className="p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors"
                                        onClick={() => handleResumeClick(r._id)}
                                    >
                                        {r.firstName} {r.lastName}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {/* Unlock Modal */}
            {unlockModalOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-[999] flex items-center justify-center"
                    onClick={() => setUnlockModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800">
                                <p>
                                    {isAdmin ? "Admin Access" : "Unlock Resume"}
                                </p>
                            </h2>
                            <button onClick={() => setUnlockModalOpen(false)}>
                                <X className="w-6 h-6 text-gray-500 hover:text-gray-800" />
                            </button>
                        </div>

                        <div className="mt-4">
                            <div className="flex justify-center mb-4">
                                <Lock className="w-8 h-8 text-gray-600" />
                            </div>
                            <p className="text-center text-gray-600 mb-4">
                                {isAdmin
                                    ? "You are an admin, so you can view the resume directly."
                                    : "Enter the unlock key to access this resume."}
                            </p>
                            {!isAdmin && (
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        placeholder="Enter unlock key..."
                                        value={unlockKey}
                                        onChange={(e) =>
                                            setUnlockKey(e.target.value)
                                        }
                                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {getStoredPin() && (
                                        <div className="mt-2 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-green-600">
                                                    ✓ PIN auto-filled
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
                                </div>
                            )}
                            {errorMessage && (
                                <div className="flex items-center text-red-500 text-sm mb-4">
                                    <AlertCircle className="w-5 h-5 mr-2" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}
                            <button
                                onClick={handleUnlock}
                                className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
                            >
                                {isAdmin ? "View Resume" : "Unlock Resume"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>,
        document.body
    );
}
