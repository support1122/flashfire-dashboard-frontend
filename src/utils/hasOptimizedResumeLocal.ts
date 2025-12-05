export function hasOptimizedResumeLocal(jobId?: string, companyName?: string): boolean {
  if (!jobId) return false;
  try {
    const raw = localStorage.getItem("userAuth");
    if (!raw) return false;
    const auth = JSON.parse(raw);

    // Your exact path: userAuth.userDetails.optimizedResumes
    const arr = Array.isArray(auth?.userDetails?.optimizedResumes)
      ? auth.userDetails.optimizedResumes
      : [];

    const norm = (v: any) => (v ?? "").toString().trim().toLowerCase();
    const jId   = norm(jobId);
    const cName = norm(companyName);

    return arr.some((it: any) => {
      const itemJobId   = norm(it?.jobID ?? it?.jobId);
      const itemCompany = norm(it?.companyName ?? it?.company);
      // require jobId match; if company present, also match
      const jobMatch = itemJobId && itemJobId === jId;
      const companyMatch = !cName || !itemCompany ? true : (itemCompany === cName);

      // Optional: ensure there's actually a resume URL-like field
      const hasUrl = Boolean(it?.url || it?.resumeUrl || it?.link);
      return jobMatch && companyMatch && hasUrl;
    });
  } catch {
    return false;
  }
}
