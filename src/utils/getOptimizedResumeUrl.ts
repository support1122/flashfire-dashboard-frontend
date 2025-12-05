export function getOptimizedResumeUrl(jobId?: string, companyName?: string): string | null {
  if (!jobId) return null;
  try {
    const raw = localStorage.getItem("userAuth");
    if (!raw) return null;
    const auth = JSON.parse(raw);

    // Your exact path: userAuth.userDetails.optimizedResumes
    const arr = Array.isArray(auth?.userDetails?.optimizedResumes)
      ? auth.userDetails.optimizedResumes
      : [];

    const norm = (v: any) => (v ?? "").toString().trim().toLowerCase();
    const jId   = norm(jobId);
    const cName = norm(companyName);

    const resumeItem = arr.find((it: any) => {
      const itemJobId   = norm(it?.jobID ?? it?.jobId);
      const itemCompany = norm(it?.companyName ?? it?.company);
      // require jobId match; if company present, also match
      const jobMatch = itemJobId && itemJobId === jId;
      const companyMatch = !cName || !itemCompany ? true : (itemCompany === cName);

      // Optional: ensure there's actually a resume URL-like field
      const hasUrl = Boolean(it?.url || it?.resumeUrl || it?.link);
      return jobMatch && companyMatch && hasUrl;
    });

    // Return the first available URL field
    return resumeItem?.url || resumeItem?.resumeUrl || resumeItem?.link || null;
  } catch {
    return null;
  }
}

export function getOptimizedResumeTitle(jobId?: string, companyName?: string): string | null {
  if (!jobId) return null;
  try {
    const raw = localStorage.getItem("userAuth");
    if (!raw) return null;
    const auth = JSON.parse(raw);

    const arr = Array.isArray(auth?.userDetails?.optimizedResumes)
      ? auth.userDetails.optimizedResumes
      : [];

    const norm = (v: any) => (v ?? "").toString().trim().toLowerCase();
    const jId   = norm(jobId);
    const cName = norm(companyName);

    const resumeItem = arr.find((it: any) => {
      const itemJobId   = norm(it?.jobID ?? it?.jobId);
      const itemCompany = norm(it?.companyName ?? it?.company);
      const jobMatch = itemJobId && itemJobId === jId;
      const companyMatch = !cName || !itemCompany ? true : (itemCompany === cName);
      const hasUrl = Boolean(it?.url || it?.resumeUrl || it?.link);
      return jobMatch && companyMatch && hasUrl;
    });

    // Return title or generate one from job details
    return resumeItem?.title || resumeItem?.name || null;
  } catch {
    return null;
  }
}
