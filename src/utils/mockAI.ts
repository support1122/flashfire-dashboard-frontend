import { BaseResume, Job, Resume } from '../types';

const jobKeywords = {
  'software engineer': ['javascript', 'react', 'node.js', 'typescript', 'api', 'database', 'git'],
  'frontend developer': ['react', 'vue', 'angular', 'css', 'html', 'javascript', 'responsive'],
  'backend developer': ['node.js', 'python', 'java', 'database', 'api', 'microservices', 'aws'],
  'full stack': ['react', 'node.js', 'database', 'api', 'javascript', 'typescript', 'aws'],
  'data scientist': ['python', 'machine learning', 'sql', 'pandas', 'tensorflow', 'statistics'],
  'product manager': ['roadmap', 'stakeholder', 'analytics', 'user experience', 'agile', 'metrics'],
  'designer': ['figma', 'sketch', 'prototyping', 'user interface', 'user experience', 'wireframing'],
  'marketing': ['analytics', 'campaigns', 'social media', 'content', 'seo', 'conversion'],
};

const commonSkills = ['leadership', 'teamwork', 'communication', 'problem solving', 'project management', 'analytical'];

export function extractKeywordsFromJob(jobDescription: string, jobTitle: string): string[] {
  const description = jobDescription.toLowerCase();
  const title = jobTitle.toLowerCase();
  
  // Get keywords based on job title
  const titleKeywords = Object.entries(jobKeywords).find(([key]) => 
    title.includes(key.toLowerCase())
  )?.[1] || [];
  
  // Extract keywords from description
  const allKeywords = [...titleKeywords, ...commonSkills];
  const foundKeywords = allKeywords.filter(keyword => 
    description.includes(keyword.toLowerCase())
  );
  
  return [...new Set(foundKeywords)];
}

export function calculateMatchScore(resumeContent: string, jobKeywords: string[]): number {
  const resumeText = resumeContent.toLowerCase();
  const matchedKeywords = jobKeywords.filter(keyword => 
    resumeText.includes(keyword.toLowerCase())
  );
  
  const baseScore = (matchedKeywords.length / jobKeywords.length) * 70;
  const randomVariation = Math.random() * 30;
  
  return Math.min(95, Math.max(25, Math.round(baseScore + randomVariation)));
}

export function optimizeResumeForJob(baseResume: BaseResume, job: Job): Resume {
  const jobKeywords = extractKeywordsFromJob(job.description, job.title);
  const matchScore = calculateMatchScore(baseResume.content, jobKeywords);
  
  // Generate suggestions based on missing keywords
  const resumeText = baseResume.content.toLowerCase();
  const missingKeywords = jobKeywords.filter(keyword => 
    !resumeText.includes(keyword.toLowerCase())
  );
  
  const suggestions = [];
  if (missingKeywords.length > 0) {
    suggestions.push(`Add these key skills: ${missingKeywords.slice(0, 3).join(', ')}`);
  }
  if (matchScore < 70) {
    suggestions.push('Consider highlighting more relevant experience');
    suggestions.push('Tailor your summary to match the job requirements');
  }
  if (matchScore < 50) {
    suggestions.push('Add specific achievements with metrics');
    suggestions.push('Include industry-specific terminology');
  }
  
  // Simulate optimized content (in real app, this would be AI-generated)
  let optimizedContent = baseResume.content;
  
  // Add some keywords to the content if missing
  if (missingKeywords.length > 0) {
    const skillsSection = '\n\nAdditional Skills: ' + missingKeywords.slice(0, 2).join(', ');
    optimizedContent += skillsSection;
  }
  
  return {
    id: `resume-${job.id}`,
    jobId: job.id,
    jobTitle: job.title,
    companyName: job.company,
    content: optimizedContent,
    originalContent: baseResume.content,
    matchScore,
    suggestions,
    keywords: jobKeywords,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function generateResumeInsights(resume: Resume): {
  strongPoints: string[];
  improvements: string[];
} {
  const strongPoints = [];
  const improvements = [];
  
  if (resume.matchScore >= 80) {
    strongPoints.push('Excellent keyword match with job requirements');
  }
  if (resume.matchScore >= 70) {
    strongPoints.push('Good alignment with job description');
  }
  if (resume.keywords.length >= 5) {
    strongPoints.push('Comprehensive skill coverage');
  }
  
  if (resume.matchScore < 70) {
    improvements.push('Add more relevant keywords from the job description');
  }
  if (resume.suggestions.length > 0) {
    improvements.push('Address the optimization suggestions provided');
  }
  
  return { strongPoints, improvements };
}