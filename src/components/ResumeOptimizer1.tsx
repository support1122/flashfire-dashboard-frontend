

import { ArrowLeftCircle, Trash2 , HardDriveDownload, Menu, X } from "lucide-react";
import React, { useEffect, useState, useContext } from "react";
import { UserContext } from '../state_management/UserContext.js';

type PendingType = "optimized" | "coverLetter" | null;

type Entry = {
  jobRole: string;
  companyName: string;
  jobLink?: string;
  url: string;
  createdAt?: string | Date;
  jobId?: string;
  name : string
};

// Cloudinary sometimes serves PDFs under `image/upload`.
// For preview (iframe), use `/raw/upload/`
// For download, add `/fl_attachment/`
function toRawPdfUrl(
  resume: string | { url?: string; link?: string },
  opts: { download?: boolean } = {}
) {
  let pdfUrl = "";

  if (typeof resume === "string") {
    pdfUrl = resume;
  } else if (resume && typeof resume === "object") {
    pdfUrl = (resume as any).link || (resume as any).url || "";
  }

  if (!pdfUrl) return "";

  if (opts.download) {
    return pdfUrl.replace("/upload/", "/upload/fl_attachment/");
  }
  return pdfUrl.replace("/upload/", "/upload/"); // ✅ preview inline
}

const fmtDate = (d?: string | Date) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : "—";

// Small download icon (no external deps)
const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 3a1 1 0 011 1v9.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4A1 1 0 118.707 11.293L11 13.586V4a1 1 0 011-1z"></path>
    <path d="M5 18a1 1 0 011-1h12a1 1 0 110 2H6a1 1 0 01-1-1z"></path>
  </svg>
);

export default function DocumentUpload() {
  const [activeTab, setActiveTab] = useState<"base" | "optimized" | "cover" | "transcript">("base");
  const [fileNamePrompt, setFileNamePrompt] = useState<string>("");
  const context = useContext(UserContext);
  const [baseResume, setBaseResume] = useState<any[]>([]);
  const [optimizedList, setOptimizedList] = useState<Entry[]>([]);
  const [coverList, setCoverList] = useState<Entry[]>([]);
  const [transcriptList, setTranscriptList] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Preview state (kept)
  const [previewMode, setPreviewMode] = useState<boolean>(true);
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);
  const [iframeError, setIframeError] = useState<string | null>(null);

  // 👇 New: mobile helpers (UI only)
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [mobileModalOpen, setMobileModalOpen] = useState<boolean>(false);

  // 👇 New: burger sidebar state (UI only)
  const [burgerOpen, setBurgerOpen] = useState<boolean>(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const mobile = 'matches' in e ? e.matches : (e as MediaQueryList).matches;
      setIsMobile(mobile);
      if (mobile) setPreviewMode(false); // mobile defaults to list
    };
    onChange(mql);
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange as any);
  }, []);

  // ---- helpers ----
  const readAuth = () => {
    const storedAuth = localStorage.getItem("userAuth");
    if (!storedAuth) {
      alert("Not logged in");
      return null;
    }
    try {
      return JSON.parse(storedAuth);
    } catch {
      alert("Auth data corrupted. Please login again.");
      return null;
    }
  };

  const writeAuth = (serverUser: any, token?: string) => {
    const existingRaw = localStorage.getItem("userAuth");
    const existing = existingRaw ? JSON.parse(existingRaw) : {};
    const finalToken = token || existing?.token || "";

    const updated = {
      ...existing,
      userDetails: serverUser,
      token: finalToken,
    };

    localStorage.setItem("userAuth", JSON.stringify(updated));
  };

  const uploadToCloudinary = async (file: File) => {
    const isPdf = file.type === "application/pdf";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_CLOUD_PRESET_PDF);

    const resource = isPdf ? "raw" : "auto";
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/${resource}/upload`,
      { method: "POST", body: formData }
    );
    if (!res.ok) throw new Error("Cloudinary upload failed");
    const data = await res.json();
    if (!data?.secure_url) throw new Error("No secure_url returned");

    const url: string = isPdf
      ? (data.secure_url as string).replace("/image/upload/", "/raw/upload/")
      : (data.secure_url as string);

    return url;
  };

  const persistToBackend = async (payload: any) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/plans/select`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Backend save failed");
    return res.json();
  };

  useEffect(() => {
    const parsed = readAuth();
    if (!parsed) return;
    const u = parsed.userDetails || {};

    if (Array.isArray(u.resumeLink)) {
      setBaseResume(u.resumeLink);
    } else if (typeof u.resumeLink === "string" && u.resumeLink.startsWith("http")) {
      setBaseResume([
        {
          name: u.resumeLink.split("/").pop() || "Imported Resume",
          createdAt: new Date().toISOString(),
          link: u.resumeLink,
          url: u.resumeLink
        },
      ]);
    } else {
      setBaseResume([]);
    }

    setOptimizedList(Array.isArray(u.optimizedResumes) ? u.optimizedResumes : []);
    setCoverList(Array.isArray(u.coverLetters) ? u.coverLetters : []);
    setTranscriptList(Array.isArray(u.transcript) ? u.transcript :  []);
  }, []);

  // Default preview per tab (only when in preview mode AND no preview selected yet)
  useEffect(() => {
    if (!previewMode) return;
    if (activePreviewUrl) return;
    setIframeError(null);

    let defaultUrl: string | null = null;
    if (activeTab === "base") {
      const last = Array.isArray(baseResume) && baseResume.length > 0 ? baseResume[baseResume.length - 1] : null;
      defaultUrl = (last?.link || last?.url) ?? null;
    }
    else if (activeTab === "optimized") defaultUrl = optimizedList[0]?.url || null;
    else if (activeTab === "cover") defaultUrl = coverList[0]?.url || null;
    else if (activeTab === "transcript") defaultUrl = (transcriptList[0] as any)?.url || null;

    setActivePreviewUrl(toRawPdfUrl(defaultUrl));
  }, [
    activeTab,
    baseResume,
    optimizedList,
    coverList,
    previewMode,
    activePreviewUrl,
  ]);

  // ---- handlers ----
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "base" | "optimized" | "coverLetter"|"transcript"
  ) => {
    const files = Array.from(e.target.files || []);
    e.currentTarget.value = "";
    if (files.length === 0) return;

    if (type !== "base" && !baseResume) {
      alert("Please upload Base Resume first.");
      return;
    }

    for (const file of files) {
      if (type === "base" || type === "coverLetter" || type === "optimized" || type === "transcript") {
        const name = prompt("Enter a name for this file:");
        if (!name) return;

        if (type === "base") {
          await uploadBaseResume(file, name);
          setPreviewMode(false);
        } else if (type === "coverLetter") {
          await uploadCoverLetter(file, name);
        } else if (type === "optimized") {
          await uploadOptimizedResume(file, name);
        } else if (type === "transcript") {
          await uploadTranscript(file, name);
        }
        return;
      }
    }
  };

  const uploadBaseResume = async (file: File, name: string) => {
    const uploadedURL = await uploadToCloudinary(file);
    const parsed = readAuth();
    if (!parsed) return;

    const newEntry = {
      name,
      createdAt: new Date().toISOString(),
      link: uploadedURL,
    };

    const payload = {
      token: parsed.token,
      userDetails: parsed.userDetails,
      resumeLink: newEntry,
    };

    const backendData = await persistToBackend(payload);
    const serverUser = backendData.userDetails || parsed.userDetails;

    writeAuth(serverUser, parsed.token);
    setBaseResume(serverUser.resumeLink);
  };

  const uploadOptimizedResume = async (file: File, name: string) => {
    try {
      setIsUploading(true);
      const uploadedURL = await uploadToCloudinary(file);
      const parsed = readAuth();
      if (!parsed) return;

      const newEntry: Entry = {
        name,
        url: uploadedURL,
        createdAt: new Date().toISOString(),
        jobRole: "",
        companyName: "",
        jobLink: "",
      };

      const payload = {
        token: parsed.token,
        userDetails: {
          ...parsed.userDetails,
          email: parsed.userDetails?.email,
        },
        optimizedResumeEntry: newEntry,
      };

      console.log("Payload for optimized resume upload:", payload);

      const backendData = await persistToBackend(payload);
      const serverUser = backendData.userDetails || parsed.userDetails;

      writeAuth(serverUser, parsed.token);
      setOptimizedList(Array.isArray(serverUser.optimizedResumes) ? serverUser.optimizedResumes : []);

      setPreviewMode(true);
      setActivePreviewUrl(toRawPdfUrl(uploadedURL));
      setIframeError(null);

      alert("✅ Optimized resume uploaded successfully!");
    } catch (err) {
      console.error("Upload optimized resume failed:", err);
      alert("❌ Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const uploadCoverLetter = async (file: File, name: string) => {
    try {
      setIsUploading(true);
      const uploadedURL = await uploadToCloudinary(file);
      const parsed = readAuth();
      if (!parsed) return;

      const newEntry: Entry = {
        name,
        url: uploadedURL,
        createdAt: new Date().toISOString(),
        jobRole: "",
        companyName: "",
        jobLink: "",
      };

      const payload = {
        token: parsed.token,
        userDetails: {
          ...parsed.userDetails,
          email: parsed.userDetails?.email,
        },
        coverLetterEntry: newEntry,
      };

      console.log("Payload for cover letter upload:", payload);

      const backendData = await persistToBackend(payload);
      const serverUser = backendData.userDetails || parsed.userDetails;

      writeAuth(serverUser, parsed.token);
      setCoverList(Array.isArray(serverUser.coverLetters) ? serverUser.coverLetters : []);

      setPreviewMode(true);
      setActivePreviewUrl(toRawPdfUrl(uploadedURL));
      setIframeError(null);

      alert("✅ Cover letter uploaded successfully!");
    } catch (err) {
      console.error("Upload cover letter failed:", err);
      alert("❌ Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const uploadTranscript = async (file: File, name: string) => {
    try {
      setIsUploading(true);
      const uploadedURL = await uploadToCloudinary(file);
      const parsed = readAuth();
      if (!parsed) return;

      const newEntry: Entry = {
        name,
        url: uploadedURL,
        createdAt: new Date().toISOString(),
        jobRole: "",
        companyName: "",
        jobLink: "",
      };

      const payload = {
        token: parsed.token,
        userDetails: {
          ...parsed.userDetails,
          email: parsed.userDetails?.email,
        },
        transcriptEntry: newEntry,
      };

      const backendData = await persistToBackend(payload);
      const serverUser = backendData.userDetails || parsed.userDetails;

      writeAuth(serverUser, parsed.token);
      setTranscriptList(Array.isArray(serverUser.transcript) ? serverUser.transcript : []);

      setPreviewMode(true);
      setActivePreviewUrl(toRawPdfUrl(uploadedURL));
      setIframeError(null);

      alert("✅ Transcript uploaded successfully!");
    } catch (err) {
      console.error("Upload transcript failed:", err);
      alert("❌ Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (item: Entry, category: "base" | "optimized" | "cover") => {
    const DELETE_PASSCODE = import.meta.env.VITE_EDIT_PASSCODE;
    const input = prompt("Enter passcode to delete:");
    if (!input || input !== DELETE_PASSCODE) {
      alert("❌ Wrong passcode. Deletion cancelled.");
      return;
    }

    const parsed = readAuth();
    if (!parsed) return;

    try {
      const payload: any = {
        token: parsed.token,
        userDetails: parsed.userDetails,
      };

      if (category === "base") {
        payload.deleteBaseResume = item;
      } else if (category === "optimized") {
        payload.deleteOptimizedResume = item;
      } else if (category === "cover") {
        payload.deleteCoverLetter = item;
      }
      else if (category === "transcript") {
        payload.deleteTranscript = item;
      }

      const backendData = await persistToBackend(payload);
      const serverUser = backendData.userDetails || parsed.userDetails;

      writeAuth(serverUser, parsed.token);
      setBaseResume(serverUser.resumeLink || []);
      setOptimizedList(Array.isArray(serverUser.optimizedResumes) ? serverUser.optimizedResumes : []);
      setCoverList(Array.isArray(serverUser.coverLetters) ? serverUser.coverLetters : []);
      setTranscriptList(Array.isArray(serverUser.transcripts) ? serverUser.transcripts : []);

      alert("✅ Document deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to delete document.");
    }
  };

  // 🔹 Unified "pick" handler (desktop: inline preview; mobile: modal)
  const handlePickDoc = (it: any) => {
    const url = toRawPdfUrl(it.link || it.url)!;
    setActivePreviewUrl(url);
    setIframeError(null);

    if (isMobile) {
      setMobileModalOpen(true);
    } else {
      setPreviewMode(true);
    }
  };

  // ---- Compact, responsive Docs Table (UI-only changes) ----
  const DocsTable = ({
    items,
    category,
    onPick,
  }: {
    items: Entry[];
    category: "Resume" | "Cover Letter" | "Base" | "Transcript";
    onPick: (item: Entry) => void;
  }) => (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr className="text-left text-xs font-semibold text-gray-600">
              <th className="px-3 py-2 w-[45%]">Title</th>
              <th className="px-3 py-2 hidden sm:table-cell w-[20%]">Created On</th>
              <th className="px-3 py-2 hidden md:table-cell w-[20%]">Category</th>
              {activeTab !== "base" && activeTab !== "cover" && activeTab !== "transcript" && (
                <th className="px-3 py-2 hidden md:table-cell w-[10%]">Job Link</th>
              )}
              <th className="px-3 py-2 text-right w-[5%]">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {items.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-gray-500" colSpan={5}>No documents yet.</td>
              </tr>
            ) : (
              items.slice().reverse().map((it, i) => (
                <tr
                  key={i}
                  className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 cursor-pointer"
                  onClick={() => onPick(it)}
                  title="Click to preview"
                >
                  {/* Title (truncate nicely) */}
                  <td className="px-3 py-2 max-w-0">
                    <div className="truncate" title={
                      category === "Base" || category === "Cover Letter" || category === "Transcript"
                        ? (it as any).name || "Unnamed"
                        : `${it.jobRole || "—"} at ${it.companyName || "—"}`
                    }>
                      {category === "Base" || category === "Cover Letter" || category === "Transcript"
                        ? (it as any).name || "Unnamed"
                        : `${it.jobRole || "—"} at ${it.companyName || "—"}`}
                    </div>
                  </td>

                  {/* Created On */}
                  <td className="px-3 py-2 hidden sm:table-cell whitespace-nowrap">
                    {(it as any).createdAt
                      ? new Date((it as any).createdAt as string).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                      : "—"}
                  </td>

                  {/* Category */}
                  <td className="px-3 py-2 hidden md:table-cell whitespace-nowrap">
                    {category} {category === "Base" ? "Resume" : ""}
                  </td>

                  {/* Job Link (only for optimized) */}
                  {activeTab !== "base" && activeTab !== "cover" && activeTab !== "transcript" && (
                    <td className="px-3 py-2 hidden md:table-cell">
                      {it.jobLink ? (
                        <a
                          href={it.jobLink.startsWith("http") ? it.jobLink : `https://${it.jobLink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                          title={it.jobLink}
                        >
                          Link
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  )}

                  {/* Actions */}
                  <td className="px-3 py-2 text-right">
                    <a
                      href={toRawPdfUrl((it as any).link || it.url) || (it as any).link || it.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title="Download"
                      className="inline-flex items-center gap-1 text-gray-700 hover:text-blue-600"
                    >
                      <DownloadIcon />
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ---- Inline Preview Panel (desktop) ----
  const PreviewPanel = ({
    url,
    onChange,
  }: {
    url: string;
    onChange: () => void;
  }) => {
    if (!url) return null;
    const src = `${url}#toolbar=1&navpanes=0&scrollbar=1`;

    return (
      <div className="flex flex-col items-center">
        <div className="border shadow mb-4 w-full max-w-3xl h-[80vh] bg-gray-50">
          <iframe
            key={url}
            title="pdf-preview"
            src={src}
            className="w-full h-full"
            onLoad={() => setIframeError(null)}
          />
        </div>

        {iframeError && (
          <div className="text-sm text-red-600 mb-2">
            Couldn’t preview this PDF here. You can still download it below.
          </div>
        )}

        <div className="flex gap-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Download
          </a>
          <button
            onClick={onChange}
            className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            View All Docs
          </button>
        </div>
      </div>
    );
  };

  // ---- UI ----
  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* 🔹 Fixed burger button (mobile/tablet only) */}
      <button
        className="relative top-15 left-3 z-10 md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full bg-white shadow border hover:bg-gray-50"
        onClick={() => setBurgerOpen(true)}
        aria-label="Open menu"
        title="Open menu"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* 🔹 Slide-in sidebar overlay (mobile) */}
      {burgerOpen && (
        <div
          className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setBurgerOpen(false)}
        >
          {/* stop propagation so clicks inside panel don't close */}
          <aside
            className="absolute top-0 left-0 h-full w-72 bg-white shadow-xl border-r transform transition-transform duration-300 ease-out translate-x-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="font-semibold">Documents</h2>
              <button
                className="p-2 rounded hover:bg-gray-100"
                onClick={() => setBurgerOpen(false)}
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex flex-col">
              <button
                className={`px-4 py-3 text-left w-full hover:bg-gray-50 ${activeTab === "base" ? "bg-blue-50 text-blue-700 font-medium" : ""}`}
                onClick={() => {
                  setActiveTab("base");
                  setPreviewMode(false);
                  setActivePreviewUrl(null);
                  setBurgerOpen(false);
                }}
              >
                Base Resume
              </button>
              <button
                className={`px-4 py-3 text-left w-full hover:bg-gray-50 ${activeTab === "optimized" ? "bg-blue-50 text-blue-700 font-medium" : ""}`}
                onClick={() => {
                  setActiveTab("optimized");
                  setPreviewMode(false);
                  setActivePreviewUrl(null);
                  setBurgerOpen(false);
                }}
              >
                Optimized Resumes
              </button>
              <button
                className={`px-4 py-3 text-left w-full hover:bg-gray-50 ${activeTab === "cover" ? "bg-blue-50 text-blue-700 font-medium" : ""}`}
                onClick={() => {
                  setActiveTab("cover");
                  setPreviewMode(false);
                  setActivePreviewUrl(null);
                  setBurgerOpen(false);
                }}
              >
                Cover Letters
              </button>
              <button
                className={`px-4 py-3 text-left w-full hover:bg-gray-50 ${activeTab === "transcript" ? "bg-blue-50 text-blue-700 font-medium" : ""}`}
                onClick={() => {
                  setActiveTab("transcript");
                  setPreviewMode(false);
                  setActivePreviewUrl(null);
                  setBurgerOpen(false);
                }}
              >
                Transcripts
              </button>
            </nav>
          </aside>
        </div>
      )}

<div className="block md:grid md:grid-cols-12 md:gap-4 h-fit overflow-y-scroll">

        {/* Desktop sidebar stays as before */}
        <aside className="hidden md:block md:col-span-3 md:fixed md:top-25 md:ml-4 md:w-1/5 md:left-0">
          <div className="bg-white rounded-lg shadow border">
            <h2 className="px-4 py-3 font-semibold border-b">Documents</h2>
            <nav className="flex md:flex-col">
              <button
                className={`px-4 py-3 text-left w-full hover:bg-gray-50 ${activeTab === "base" ? "bg-blue-50 text-blue-700 font-medium" : ""}`}
                onClick={() => {
                  setActiveTab("base");
                  setPreviewMode(false);
                  setActivePreviewUrl(null);
                }}
              >
                Base Resume
              </button>
              <button
                className={`px-4 py-3 text-left w-full hover:bg-gray-50 ${activeTab === "optimized" ? "bg-blue-50 text-blue-700 font-medium" : ""}`}
                onClick={() => {
                  setActiveTab("optimized");
                  setPreviewMode(false);
                  setActivePreviewUrl(null);
                }}
              >
                Optimized Resumes
              </button>
              <button
                className={`px-4 py-3 text-left w-full hover:bg-gray-50 ${activeTab === "cover" ? "bg-blue-50 text-blue-700 font-medium" : ""}`}
                onClick={() => {
                  setActiveTab("cover");
                  setPreviewMode(false);
                  setActivePreviewUrl(null);
                }}
              >
                Cover Letters
              </button>
              <button
                className={`px-4 py-3 text-left w-full hover:bg-gray-50 ${activeTab === "transcript" ? "bg-blue-50 text-blue-700 font-medium" : ""}`}
                onClick={() => {
                  setActiveTab("transcript");
                  setPreviewMode(false);
                  setActivePreviewUrl(null);
                }}
              >
                Transcripts
              </button>
            </nav>
          </div>
        </aside>

        {/* Main content */}
<main className="w-full md:col-span-9 md:w-3/4 md:fixed md:right-10">

<div className="bg-white rounded-lg shadow border p-4 w-full md:w-[70vw] md:h-[90vh] md:overflow-y-scroll">
            {/* BASE TAB */}
            {activeTab === "base" && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Base Resume</h3>
                  {baseResume && previewMode && (
                    <button
                      className="px-3 py-1.5 rounded bg-blue-500 hover:bg-blue-700 text-white text-sm"
                      onClick={() => {
                        setActiveTab('base');
                        setPreviewMode(false);
                      }}
                    >
                      <ArrowLeftCircle />
                      View All Docs
                    </button>
                  )}
                </div>

                {baseResume && previewMode ? (
                  <PreviewPanel
                    url={toRawPdfUrl(activePreviewUrl as any) as string}
                    onChange={() => setPreviewMode(true)}
                  />
                ) : (
                  <>
                    {baseResume ? (
                      <DocsTable
                        items={Array.isArray(baseResume) ? (baseResume as any) : [baseResume as any]}
                        category="Base"
                        onPick={(it) => handlePickDoc(it)}
                      />
                    ) : (
                      <p className="text-sm text-gray-500 mb-4">No base resume uploaded yet.</p>
                    )}

                    <div className="mt-4">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <span className="text-sm font-medium">Upload / Replace Base Resume</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="application/pdf,.pdf"
                          onChange={(e) => handleFileUpload(e, "base")}
                          disabled={isUploading}
                        />
                        <span className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm">Choose File</span>
                      </label>
                    </div>
                  </>
                )}
              </section>
            )}

            {/* OPTIMIZED TAB */}
            {activeTab === "optimized" && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Optimized Resumes</h3>
                  {previewMode ? (
                    <button
                      className="p-2 m-2 rounded bg-blue-500 hover:bg-blue-700 text-white text-sm"
                      onClick={() => setPreviewMode(false)}
                    >
                      <ArrowLeftCircle />
                      View All Docs
                    </button>
                  ) : (
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <span className="text-sm font-medium">Upload New</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="application/pdf,.pdf"
                        multiple
                        onChange={(e) => handleFileUpload(e, "optimized")}
                        disabled={isUploading}
                      />
                      <span className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm">Choose File</span>
                    </label>
                  )}
                </div>

                {optimizedList.length === 0 ? (
                  <p className="text-sm text-gray-500">No optimized resumes yet.</p>
                ) : previewMode && activePreviewUrl ? (
                  <PreviewPanel
                    url={toRawPdfUrl(activePreviewUrl) as string}
                    onChange={() => setPreviewMode(false)}
                  />
                ) : (
                  <DocsTable
                    items={optimizedList}
                    category="Resume"
                    onPick={(it) => handlePickDoc(it)}
                  />
                )}
              </section>
            )}

            {/* COVER TAB */}
            {activeTab === "cover" && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Cover Letters</h3>
                  {previewMode ? (
                    <button
                      className="px-3 py-1.5 rounded bg-blue-500 hover:bg-blue-700 text-white text-sm"
                      onClick={() => setPreviewMode(false)}
                    >
                      <ArrowLeftCircle />
                      View All Docs
                    </button>
                  ) : (
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <span className="text-sm font-medium">Upload New</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="application/pdf,.pdf"
                        onChange={(e) => handleFileUpload(e, "coverLetter")}
                        disabled={isUploading}
                      />
                      <span className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm">Choose File</span>
                    </label>
                  )}
                </div>

                {coverList.length === 0 ? (
                  <p className="text-sm text-gray-500">No cover letters yet.</p>
                ) : previewMode && activePreviewUrl ? (
                  <PreviewPanel
                    url={toRawPdfUrl(activePreviewUrl) as string}
                    onChange={() => setPreviewMode(false)}
                  />
                ) : (
                  <DocsTable
                    items={coverList}
                    category="Cover Letter"
                    onPick={(it) => handlePickDoc(it)}
                  />
                )}
              </section>
            )}

            {/* TRANSCRIPT TAB */}
            {activeTab === "transcript" && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Transcripts</h3>
                  {previewMode ? (
                    <button
                      className="px-3 py-1.5 rounded bg-blue-500 hover:bg-blue-700 text-white text-sm"
                      onClick={() => setPreviewMode(false)}
                    >
                      <ArrowLeftCircle />
                      View All Docs
                    </button>
                  ) : (
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <span className="text-sm font-medium">Upload New</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="application/pdf,.pdf"
                        onChange={(e) => handleFileUpload(e, "transcript")}
                        disabled={isUploading}
                      />
                      <span className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm">
                        Choose File
                      </span>
                    </label>
                  )}
                </div>

                {transcriptList.length === 0 ? (
                  <p className="text-sm text-gray-500">No transcripts yet.</p>
                ) : previewMode && activePreviewUrl ? (
                  <PreviewPanel
                    url={toRawPdfUrl(activePreviewUrl) as string}
                    onChange={() => setPreviewMode(false)}
                  />
                ) : (
                  <DocsTable
                    items={transcriptList as any}
                    category="Transcript"
                    onPick={(it) => handlePickDoc(it)}
                  />
                )}
              </section>
            )}
          </div>
        </main>
      </div>

      {/* 🔹 Mobile preview modal (unchanged behavior), with blur overlay */}
      {isMobile && mobileModalOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-3"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-3xl bg-white rounded-lg shadow-lg">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl leading-none"
              aria-label="Close"
              onClick={() => setMobileModalOpen(false)}
            >
              ×
            </button>

            <div className="p-3">
              {activePreviewUrl ? (
                <div className="w-full h-[80vh] bg-gray-50 border rounded">
                  <iframe
                    key={activePreviewUrl}
                    title="pdf-preview-mobile"
                    src={`${activePreviewUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                    className="w-full h-full rounded"
                    onLoad={() => setIframeError(null)}
                  />
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">No document selected.</div>
              )}

              <div className="mt-3 flex justify-end gap-2">
                {activePreviewUrl && (
                  <a
                    href={activePreviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    Download
                  </a>
                )}
                <button
                  onClick={() => setMobileModalOpen(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded"
                >
                  Close
                </button>
              </div>

              {iframeError && (
                <div className="text-sm text-red-600 mt-2">
                  Couldn’t preview this PDF here. You can still download it.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

