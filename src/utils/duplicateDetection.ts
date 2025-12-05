// import { Job } from '../types';

// export interface DuplicateCheckResult {
//   isDuplicate: boolean;
//   existingJob?: Job;
//   message?: string;
// }

// export function checkForDuplicateJob(
//   newJob: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>,
//   existingJobs: Job[]
// ): DuplicateCheckResult {
//   // Normalize text for comparison
//   const normalizeText = (text: string): string => {
//     return text.toLowerCase().trim().replace(/\s+/g, ' ');
//   };

//   const newTitle = normalizeText(newJob.title);
//   const newCompany = normalizeText(newJob.company);
//   const newDescription = normalizeText(newJob.description);

//   // Check for exact matches
//   const exactMatch = existingJobs.find(job => {
//     const existingTitle = normalizeText(job.title);
//     const existingCompany = normalizeText(job.company);
//     const existingDescription = normalizeText(job.description);

//     return (
//       existingTitle === newTitle &&
//       existingCompany === newCompany &&
//       existingDescription === newDescription
//     );
//   });

//   if (exactMatch) {
//     return {
//       isDuplicate: true,
//       existingJob: exactMatch,
//       message: `Already applied to this job: ${exactMatch.title} at ${exactMatch.company}`
//     };
//   }

//   // Check for similar matches (same title and company, but different description)
//   const similarMatch = existingJobs.find(job => {
//     const existingTitle = normalizeText(job.title);
//     const existingCompany = normalizeText(job.company);

//     return (
//       existingTitle === newTitle &&
//       existingCompany === newCompany
//     );
//   });

//   if (similarMatch) {
//     // Calculate description similarity
//     const similarity = calculateTextSimilarity(newDescription, normalizeText(similarMatch.description));
    
//     if (similarity > 0.8) { // 80% similarity threshold
//       return {
//         isDuplicate: true,
//         existingJob: similarMatch,
//         message: `Very similar job already exists: ${similarMatch.title} at ${similarMatch.company}`
//       };
//     }
//   }

//   return {
//     isDuplicate: false
//   };
// }

// function calculateTextSimilarity(text1: string, text2: string): number {
//   if (text1 === text2) return 1;
//   if (text1.length === 0 || text2.length === 0) return 0;

//   // Simple word-based similarity
//   const words1 = text1.split(' ').filter(word => word.length > 3);
//   const words2 = text2.split(' ').filter(word => word.length > 3);
  
//   if (words1.length === 0 || words2.length === 0) return 0;

//   const commonWords = words1.filter(word => words2.includes(word));
//   const totalWords = Math.max(words1.length, words2.length);
  
//   return commonWords.length / totalWords;
// }

// export function formatDuplicateMessage(result: DuplicateCheckResult): string {
//   if (!result.isDuplicate || !result.existingJob) return '';

//   const job = result.existingJob;
//   const statusText = job.status === 'applied' ? 'applied to' : 
//                     job.status === 'interviewing' ? 'interviewing for' :
//                     job.status === 'offer' ? 'received offer for' :
//                     job.status === 'rejected' ? 'was rejected for' :
//                     'saved';

//   return `You have already ${statusText} this position: "${job.title}" at ${job.company} on ${new Date(job.dateApplied).toLocaleDateString()}.`;
// }