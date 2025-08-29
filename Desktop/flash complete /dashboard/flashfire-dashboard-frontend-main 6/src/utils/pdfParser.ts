import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export interface ParsedResumeData {
  text: string;
  skills: string[];
  experience: string[];
  education: string[];
  contact: {
    name?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    github?: string;
  };
}

export async function parsePDFResume(file: File): Promise<ParsedResumeData> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    // Parse the extracted text
    const parsedData = parseResumeText(fullText);
    
    return {
      text: fullText,
      ...parsedData
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF resume. Please ensure it\'s a valid PDF file.');
  }
}

function parseResumeText(text: string): Omit<ParsedResumeData, 'text'> {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Extract contact information
  const contact = extractContactInfo(text);
  
  // Extract skills
  const skills = extractSkills(text);
  
  // Extract experience
  const experience = extractExperience(text);
  
  // Extract education
  const education = extractEducation(text);
  
  return {
    skills,
    experience,
    education,
    contact
  };
}

function extractContactInfo(text: string) {
  const contact: ParsedResumeData['contact'] = {};
  
  // Email regex
  const emailMatch = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
  if (emailMatch) contact.email = emailMatch[0];
  
  // Phone regex
  const phoneMatch = text.match(/(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
  if (phoneMatch) contact.phone = phoneMatch[0];
  
  // LinkedIn
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  if (linkedinMatch) contact.linkedin = linkedinMatch[0];
  
  // GitHub
  const githubMatch = text.match(/github\.com\/[\w-]+/i);
  if (githubMatch) contact.github = githubMatch[0];
  
  // Name (usually first line or near contact info)
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length > 0) {
    // Look for a name-like pattern in the first few lines
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i];
      if (line.match(/^[A-Z][a-z]+ [A-Z][a-z]+/) && !line.includes('@') && !line.includes('http')) {
        contact.name = line;
        break;
      }
    }
  }
  
  return contact;
}

function extractSkills(text: string): string[] {
  const skillsSection = extractSection(text, ['skills', 'technical skills', 'core competencies', 'technologies']);
  
  if (!skillsSection) return [];
  
  // Common technical skills to look for
  const commonSkills = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby',
    'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel',
    'HTML', 'CSS', 'SASS', 'SCSS', 'Tailwind', 'Bootstrap',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'SQLite',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins',
    'Git', 'GitHub', 'GitLab', 'Jira', 'Confluence',
    'Machine Learning', 'AI', 'Data Science', 'Analytics',
    'Agile', 'Scrum', 'DevOps', 'CI/CD'
  ];
  
  const foundSkills = commonSkills.filter(skill => 
    skillsSection.toLowerCase().includes(skill.toLowerCase())
  );
  
  // Also extract skills from bullet points or comma-separated lists
  const skillLines = skillsSection.split(/[•\n,]/).map(line => line.trim()).filter(line => line.length > 0);
  const additionalSkills = skillLines.filter(skill => 
    skill.length < 30 && skill.length > 2 && !foundSkills.includes(skill)
  );
  
  return [...foundSkills, ...additionalSkills.slice(0, 10)];
}

function extractExperience(text: string): string[] {
  const experienceSection = extractSection(text, ['experience', 'work experience', 'professional experience', 'employment']);
  
  if (!experienceSection) return [];
  
  // Split by common job separators and extract job titles/companies
  const jobEntries = experienceSection.split(/\n(?=[A-Z])/);
  
  return jobEntries
    .map(entry => entry.trim())
    .filter(entry => entry.length > 10)
    .slice(0, 5); // Limit to 5 most recent positions
}

function extractEducation(text: string): string[] {
  const educationSection = extractSection(text, ['education', 'academic background', 'qualifications', 'certifications']);
  
  if (!educationSection) return [];
  
  const educationEntries = educationSection.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 5);
  
  return educationEntries.slice(0, 5);
}

function extractSection(text: string, sectionHeaders: string[]): string | null {
  const lines = text.split('\n');
  
  for (const header of sectionHeaders) {
    const headerIndex = lines.findIndex(line => 
      line.toLowerCase().includes(header.toLowerCase()) && line.length < 50
    );
    
    if (headerIndex !== -1) {
      // Find the next section or end of text
      let endIndex = lines.length;
      for (let i = headerIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.length > 0 && line.match(/^[A-Z\s]+$/) && line.length < 50) {
          // Likely another section header
          endIndex = i;
          break;
        }
      }
      
      return lines.slice(headerIndex + 1, endIndex).join('\n').trim();
    }
  }
  
  return null;
}