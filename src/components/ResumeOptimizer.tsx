import React, { useEffect, useState } from "react";

type PendingType = "optimized" | "coverLetter" | null;

type Entry = {
  jobRole: string;
  companyName: string;
  jobLink?: string;
  url: string;
  createdAt?: string | Date;
  jobId?: string;
};

// Cloudinary sometimes serves PDFs under `image/upload`.
// For iframes, we want the original bytes. Convert to `raw/upload`.
const toRawPdfUrl = (url: string | null) =>
  url ? url.replace("/image/upload/", "/raw/upload/") : url;

export default function DocumentUpload() {
  const [activeTab, setActiveTab] = useState<"base" | "optimized" | "cover">("base");

  const [baseResume, setBaseResume] = useState("");
  const [optimizedList, setOptimizedList] = useState<Entry[]>([]);
  const [coverList, setCoverList] = useState<Entry[]>([]);

  const [showMetaModal, setShowMetaModal] = useState<PendingType>(null);
  const [pendingUploadType, setPendingUploadType] = useState<PendingType>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [metadata, setMetadata] = useState({ jobRole: "", companyName: "", jobLink: "" });

  // Preview state
  const [previewMode, setPreviewMode] = useState<boolean>(true); // true = show iframe; false = list/upload
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);
  const [iframeError, setIframeError] = useState<string | null>(null);

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

  const writeAuth = (updatedUserAuth: any) => {
    localStorage.setItem("userAuth", JSON.stringify(updatedUserAuth));
  };

  const uploadToCloudinary = async (file: File) => {
    const isPdf = file.type === "application/pdf";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_CLOUD_PRESET_PDF);

    // Use the correct endpoint for PDFs so we get a clean PDF URL
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
    return res.json(); // -> { userDetails: {..., resumeLink, optimizedResumes, coverLetters } }
  };

  // ---- initialization (hydrate from userAuth) ----
  useEffect(() => {
    const parsed = readAuth();
    if (!parsed) return;
    const u = parsed.userDetails || {};
    setBaseResume(u.resumeLink || "");
    setOptimizedList(Array.isArray(u.optimizedResumes) ? u.optimizedResumes : []);
    setCoverList(Array.isArray(u.coverLetters) ? u.coverLetters : []);
  }, []);

  // Default preview per tab (only when in preview mode AND no preview selected yet)
  useEffect(() => {
    if (!previewMode) return;
    if (activePreviewUrl) return; // don't override a user-selected preview
    setIframeError(null);

    let defaultUrl: string | null = null;
    if (activeTab === "base") defaultUrl = baseResume || null;
    else if (activeTab === "optimized") defaultUrl = optimizedList[0]?.url || null;
    else if (activeTab === "cover") defaultUrl = coverList[0]?.url || null;

    setActivePreviewUrl(toRawPdfUrl(defaultUrl));
  }, [
    activeTab,
    baseResume,
    optimizedList,
    coverList,
    previewMode,
    activePreviewUrl, // in deps but we early-return if it's set
  ]);

  // ---- handlers ----
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "base" | "optimized" | "coverLetter"
  ) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = ""; // allow reselecting same file
    if (!file) return;

    if (type !== "base" && !baseResume) {
      alert("Please upload Base Resume first.");
      return;
    }

    if (type === "base") {
      await uploadBaseResume(file);
      setPreviewMode(true);
      return;
    }

    // For optimized/coverLetter: open metadata modal (with Skip option)
    setSelectedFile(file);
    setPendingUploadType(type);
    setShowMetaModal(type);
  };

  const uploadBaseResume = async (file: File) => {
    if (isUploading) return;
    setIsUploading(true);
    try {
      const uploadedURL = await uploadToCloudinary(file);

      const parsed = readAuth();
      if (!parsed) return;

      const payload = {
        token: parsed.token,
        userDetails: parsed.userDetails,
        resumeLink: uploadedURL, // base resume (no metadata)
      };

      const backendData = await persistToBackend(payload);
      const serverUser = backendData.userDetails || parsed.userDetails;

      // Persist and hydrate from server
      const updatedUserAuth = { ...parsed, userDetails: serverUser };
      writeAuth(updatedUserAuth);

      setBaseResume(serverUser.resumeLink || uploadedURL);
      setOptimizedList(Array.isArray(serverUser.optimizedResumes) ? serverUser.optimizedResumes : []);
      setCoverList(Array.isArray(serverUser.coverLetters) ? serverUser.coverLetters : []);

      // Show preview immediately (ensure raw URL)
      setPreviewMode(true);
      setActivePreviewUrl(toRawPdfUrl(serverUser.resumeLink || uploadedURL));
      setIframeError(null);

      alert("✅ Base resume uploaded successfully!");
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  // Save with or without metadata
  const handleMetadataSubmit = async (e?: React.FormEvent<HTMLFormElement>, skip = false) => {
    if (e) e.preventDefault();
    if (!selectedFile || !pendingUploadType) return;
    if (isUploading) return;

    setIsUploading(true);
    try {
      const uploadedURL = await uploadToCloudinary(selectedFile);
      const parsed = readAuth();
      if (!parsed) return;

      const entry: Entry = skip
        ? { jobRole: "", companyName: "", jobLink: "", url: uploadedURL, createdAt: new Date().toISOString() }
        : { ...metadata, url: uploadedURL, createdAt: new Date().toISOString() };

      const payload: any = {
        token: parsed.token,
        userDetails: parsed.userDetails,
        resumeLink: baseResume,
      };

      if (pendingUploadType === "optimized") {
        payload.optimizedResumeEntry = entry;
      } else {
        payload.coverLetterEntry = entry;
      }

      const backendData = await persistToBackend(payload);
      const serverUser = backendData.userDetails || parsed.userDetails;

      const updatedUserAuth = { ...parsed, userDetails: serverUser };
      writeAuth(updatedUserAuth);

      setBaseResume(serverUser.resumeLink || baseResume);
      setOptimizedList(Array.isArray(serverUser.optimizedResumes) ? serverUser.optimizedResumes : []);
      setCoverList(Array.isArray(serverUser.coverLetters) ? serverUser.coverLetters : []);

      // Immediately preview the doc we just uploaded
      setPreviewMode(true);
      setActivePreviewUrl(toRawPdfUrl(uploadedURL));
      setIframeError(null);

      alert(`✅ ${pendingUploadType === "optimized" ? "Optimized resume" : "Cover letter"} uploaded successfully!`);

      // reset modal state
      setMetadata({ jobRole: "", companyName: "", jobLink: "" });
      setShowMetaModal(null);
      setPendingUploadType(null);
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  // ---- Reusable Preview Panel (iframe) ----
  const PreviewPanel = ({ url, onChange }: { url: string; onChange: () => void }) => {
    if (!url) return null;
    const src = `${url}#toolbar=1&navpanes=0&scrollbar=1`; // tweak viewer UI

    return (
      <div className="flex flex-col items-center">
        <div className="border shadow mb-4 w-full max-w-3xl h-[80vh] bg-gray-50">
          <iframe
            key={url}                // <-- force reload when URL changes
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
          <button onClick={onChange} className="bg-gray-600 text-white px-4 py-2 rounded">
            Change Document
          </button>
        </div>
      </div>
    );
  };

  // ---- UI ----
  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="grid grid-cols-12 gap-4">
        {/* Left sidebar */}
        <aside className="col-span-12 md:col-span-3">
          <div className="bg-white rounded-lg shadow border">
            <h2 className="px-4 py-3 font-semibold border-b">Documents</h2>
            <nav className="flex md:flex-col">
              <button
                className={`px-4 py-3 text-left w-full hover:bg-gray-50 ${activeTab === "base" ? "bg-blue-50 text-blue-700 font-medium" : ""}`}
                onClick={() => {
                  setActiveTab("base");
                  setPreviewMode(true);
                  setActivePreviewUrl(null); // let effect choose default for the tab
                }}
              >
                Base Resume
              </button>
              <button
                className={`px-4 py-3 text-left w-full hover:bg-gray-50 ${activeTab === "optimized" ? "bg-blue-50 text-blue-700 font-medium" : ""}`}
                onClick={() => {
                  setActiveTab("optimized");
                  setPreviewMode(true);
                  setActivePreviewUrl(null); // important
                }}
              >
                Optimized Resumes
              </button>
              <button
                className={`px-4 py-3 text-left w-full hover:bg-gray-50 ${activeTab === "cover" ? "bg-blue-50 text-blue-700 font-medium" : ""}`}
                onClick={() => {
                  setActiveTab("cover");
                  setPreviewMode(true);
                  setActivePreviewUrl(null); // important
                }}
              >
                Cover Letters
              </button>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="col-span-12 md:col-span-9">
          <div className="bg-white rounded-lg shadow border p-4">
            {/* BASE TAB */}
            {activeTab === "base" && (
              <section>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold mb-3">Base Resume</h3>
                  {baseResume && previewMode && (
                    <button
                      className="px-3 py-1.5 rounded bg-gray-700 text-white text-sm"
                      onClick={() => setPreviewMode(false)}
                    >
                      Change Document
                    </button>
                  )}
                </div>

                {/* Preview or upload */}
                {baseResume && previewMode ? (
                  <PreviewPanel url={toRawPdfUrl(activePreviewUrl || baseResume) as string} onChange={() => setPreviewMode(false)} />
                ) : (
                  <div>
                    <div className="mb-3">
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
                    {baseResume ? (
                      <p className="text-sm">
                        Current:{" "}
                        <a className="text-blue-600 underline break-all" href={toRawPdfUrl(baseResume) || "#"} target="_blank" rel="noreferrer">
                          View in new tab
                        </a>
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">No base resume uploaded yet.</p>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* OPTIMIZED TAB */}
            {activeTab === "optimized" && (
              <section>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold mb-3">Optimized Resumes</h3>
                  {previewMode ? (
                    <button
                      className="px-3 py-1.5 rounded bg-gray-700 text-white text-sm"
                      onClick={() => setPreviewMode(false)}
                    >
                      Change Document
                    </button>
                  ) : (
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <span className="text-sm font-medium">Upload New</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="application/pdf,.pdf"
                        onChange={(e) => handleFileUpload(e, "optimized")}
                        disabled={isUploading || !baseResume}
                      />
                      <span className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm">Choose File</span>
                    </label>
                  )}
                </div>

                {/* Preview or list */}
                {optimizedList.length === 0 ? (
                  <p className="text-sm text-gray-500">No optimized resumes yet.</p>
                ) : previewMode && activePreviewUrl ? (
                  <PreviewPanel url={toRawPdfUrl(activePreviewUrl) as string} onChange={() => setPreviewMode(false)} />
                ) : (
                  <ul className="divide-y mt-2">
                    {optimizedList.map((item, i) => (
                      <li
                        key={i}
                        className="py-3 cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          setActivePreviewUrl(toRawPdfUrl(item.url)!);
                          setPreviewMode(true);
                          setIframeError(null);
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {item.jobRole || "—"} @ {item.companyName || "—"}
                            </p>
                            <div className="text-xs text-gray-500 space-x-2">
                              {item.jobLink ? (
                                <a
                                  href={item.jobLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="underline break-all"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Job Link
                                </a>
                              ) : null}
                              {item.createdAt ? <span>{new Date(item.createdAt).toLocaleString()}</span> : null}
                            </div>
                          </div>
                          <span className="text-blue-600 underline text-sm">Preview</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {/* COVER TAB */}
            {activeTab === "cover" && (
              <section>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold mb-3">Cover Letters</h3>
                  {previewMode ? (
                    <button
                      className="px-3 py-1.5 rounded bg-gray-700 text-white text-sm"
                      onClick={() => setPreviewMode(false)}
                    >
                      Change Document
                    </button>
                  ) : (
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <span className="text-sm font-medium">Upload New</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="application/pdf,.pdf"
                        onChange={(e) => handleFileUpload(e, "coverLetter")}
                        disabled={isUploading || !baseResume}
                      />
                      <span className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm">Choose File</span>
                    </label>
                  )}
                </div>

                {/* Preview or list */}
                {coverList.length === 0 ? (
                  <p className="text-sm text-gray-500">No cover letters yet.</p>
                ) : previewMode && activePreviewUrl ? (
                  <PreviewPanel url={toRawPdfUrl(activePreviewUrl) as string} onChange={() => setPreviewMode(false)} />
                ) : (
                  <ul className="divide-y mt-2">
                    {coverList.map((item, i) => (
                      <li
                        key={i}
                        className="py-3 cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          setActivePreviewUrl(toRawPdfUrl(item.url)!);
                          setPreviewMode(true);
                          setIframeError(null);
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {item.jobRole || "—"} @ {item.companyName || "—"}
                            </p>
                            <div className="text-xs text-gray-500 space-x-2">
                              {item.jobLink ? (
                                <a
                                  href={item.jobLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="underline break-all"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Job Link
                                </a>
                              ) : null}
                              {item.createdAt ? <span>{new Date(item.createdAt).toLocaleString()}</span> : null}
                            </div>
                          </div>
                          <span className="text-blue-600 underline text-sm">Preview</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>
        </main>
      </div>

      {/* Metadata modal */}
      {showMetaModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" role="dialog" aria-modal="true">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">
                {showMetaModal === "optimized" ? "Optimized Resume Details" : "Cover Letter Details"}
              </h2>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-800"
                onClick={() => {
                  if (!isUploading) {
                    setShowMetaModal(null);
                    setPendingUploadType(null);
                    setSelectedFile(null);
                    setMetadata({ jobRole: "", companyName: "", jobLink: "" });
                  }
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={(e) => handleMetadataSubmit(e, false)} className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Job Role</label>
                <input
                  type="text"
                  value={metadata.jobRole}
                  onChange={(e) => setMetadata((prev) => ({ ...prev, jobRole: e.target.value }))}
                  className="w-full border p-2 rounded"
                  disabled={isUploading}
                  placeholder="e.g., Data Analyst"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Company Name</label>
                <input
                  type="text"
                  value={metadata.companyName}
                  onChange={(e) => setMetadata((prev) => ({ ...prev, companyName: e.target.value }))}
                  className="w-full border p-2 rounded"
                  disabled={isUploading}
                  placeholder="e.g., Acme Corp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Job Link</label>
                <input
                  type="url"
                  value={metadata.jobLink}
                  onChange={(e) => setMetadata((prev) => ({ ...prev, jobLink: e.target.value }))}
                  className="w-full border p-2 rounded"
                  disabled={isUploading}
                  placeholder="https://careers.example.com/job/123"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={isUploading} className="bg-blue-600 text-white px-4 py-2 rounded w-1/2">
                  {isUploading ? "Uploading..." : "Save & Upload"}
                </button>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => handleMetadataSubmit(undefined, true)}
                  className="bg-gray-600 text-white px-4 py-2 rounded w-1/2"
                >
                  {isUploading ? "Uploading..." : "Skip Metadata"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
