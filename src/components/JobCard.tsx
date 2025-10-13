import React,{useState, useEffect} from 'react';
import { Calendar } from 'lucide-react';
import { Job } from '../types';
import { getTimeAgo } from '../utils/getTimeAgo';
interface JobCardProps {
  job: Job;
  onDragStart: (e: React.DragEvent, job: Job) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onEdit: () => void;
  onDelete: () => void;
  showJobModal: boolean;
  setSelectedJob: React.Dispatch<React.SetStateAction<Job | null>>;
  setShowJobModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const JobCard: React.FC<JobCardProps> = ({
  setSelectedJob,
  setShowJobModal,
  job,
  onDragStart,
  onDragEnd,
  onEdit,
  onDelete,
}) => {
   const [logoUrl, setLogoUrl] = useState<string | null>(null);
  //    useEffect(() => {
  //   const resolveLogo = async () => {
  //     if (!job?.companyName) return;

  //     const base = job.companyName.trim().split(" ")[0].toLowerCase();
  //     const tlds = ["com", "io", "ai", "co", "org", "in"];
  //     let found = false;

  //     // Try each possible TLD using Google's favicon service
  //     for (const tld of tlds) {
  //       const testUrl = `https://www.google.com/s2/favicons?domain=${base}.${tld}&sz=64`;
  //       try {
  //         const res = await fetch(testUrl);
  //         if (res.ok && res.headers.get("content-type")?.startsWith("image")) {
  //           setLogoUrl(testUrl);
  //           found = true;
  //           break;
  //         }
  //       } catch {
  //         // ignore network errors and keep looping
  //       }
  //     }

  //     if (!found) {
  //       // generate fallback placeholder with initials
  //       const initials = base.slice(0, 2).toUpperCase();
  //       const svg = `data:image/svg+xml,${encodeURIComponent(`
  //         <svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>
  //           <rect width='64' height='64' fill='#6666ff'/>
  //           <text x='50%' y='50%' dy='.35em' font-size='28' text-anchor='middle' fill='white'>${initials}</text>
  //         </svg>
  //       `)}`;
  //       setLogoUrl(svg);
  //     }
  //   };

  //   resolveLogo();
  // }, [job?.companyName]);
  useEffect(() => {
  const resolveLogo = async () => {
    if (!job?.companyName) return;

    // ✅ 1️⃣ Normalize the company name
    const base = job.companyName
      .trim()
      .toLowerCase()
      // remove punctuation, commas, ampersands, parentheses
      .replace(/[&,.()']/g, "")
      // replace spaces and multiple dashes with a single dash
      .replace(/\s+|_+/g, "-")
      .replace(/-+/g, "-");

    const tlds = ["com", "io", "ai", "co", "org", "in"];
    let found = false;

    // ✅ 2️⃣ Try each TLD with Google's favicon service
    for (const tld of tlds) {
      const testUrl = `https://www.google.com/s2/favicons?domain=${base}.${tld}&sz=64`;
      try {
        const res = await fetch(testUrl);
        if (res.ok && res.headers.get("content-type")?.startsWith("image")) {
          setLogoUrl(testUrl);
          found = true;
          return;
          break;
        }
      } catch {
        // ignore network errors
      }
    }

    // ✅ 3️⃣ Fallback to initials if nothing found
   // if (!found) {
    //  const cleanName = job.companyName
    //    .replace(/[^a-zA-Z0-9 ]/g, "")
    //    .trim()
    //    .split(/\s+/)
    //    .slice(0, 2)
    //    .map((word) => word[0]?.toUpperCase() || "")
    //    .join("");

     // const svg = `data:image/svg+xml,${encodeURIComponent(`
     //   <svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>
     //     <rect width='64' height='64' fill='#6666ff'/>
      //    <text x='50%' y='50%' dy='.35em' font-size='28' text-anchor='middle' fill='white'>${cleanName}</text>
      // </svg>
     // `)}`;
    //  setLogoUrl(svg);
   // }
  };

  resolveLogo();
}, [job.companyName]);

  const handleClick = () => {
    setShowJobModal(true);
    setSelectedJob(job);
  };

  const getCompanyDomain = (companyName: string) => {
    return companyName.replace(/\s+/g, '').toLowerCase();
  };

  return (
    <div
      onClick={handleClick}
      draggable
      onDragStart={(e) => onDragStart(e, job)}
      onDragEnd={onDragEnd}
      className="bg-white rounded-lg border w-full border-gray-200 p-2 shadow-sm hover:shadow-md transition-all duration-200 cursor-move hover:scale-[1.02] hover:-rotate-1"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 ">{job.jobTitle}</h4>
          <div className="flex items-center text-sm text-gray-600 mt-1">

            <img
  src={
    job.companyLogo
      ? job.companyLogo
      : logoUrl
      ? logoUrl
      : `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
          job.companyName
        )}.com&sz=64`
  }
  alt="Company Logo"

  className="w-[20px] h-[20px] m-2"
  onError={(e) => {
    e.currentTarget.style.display = 'none';
  }}
/>

            <span className="">{job.companyName}</span> <hr />
          </div>
        </div>
      </div>

      <div className="flex items-center text-xs text-gray-500 mb-3">
        <Calendar className="w-3 h-3 mr-1" />
        <span>
         {getTimeAgo(job?.createdAt || job?.dateAdded || job?.updatedAt)}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
            title="Edit Job"
          >
            <Edit3 className="w-4 h-4" />
          </button> */}
          {/* <button
            // disabled
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1  bg-gray-100 rounded hover:text-neutral-500 text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default JobCard;
