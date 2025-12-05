import { BaseResume, Job, OptimizedResume } from '../types';
import { ParsedResumeData } from './pdfParser';
import { OpenAIResumeOptimizer } from './openAI';

export interface SmartOptimizationResult {
  optimizedResume: OptimizedResume;
  atsScore: number;
  addedKeywords: string[];
  optimizationSummary: string;
}

export class SmartAIOptimizer {
  
  /**
   * Smart AI Resume Optimization - Uses OpenAI or fallback local AI
   */
  static async optimizeResumeForJob(
    baseResume: BaseResume | ParsedResumeData,
    job: Job,
    isFromPDF: boolean = false
  ): Promise<SmartOptimizationResult> {
    
    const originalContent = isFromPDF ? (baseResume as ParsedResumeData).text : (baseResume as BaseResume).content;
    
    console.log('🚀 Starting Smart AI Optimization...');
    console.log('📄 Original Resume Length:', originalContent.length);
    console.log('🎯 Job Title:', job.title);
    console.log('🏢 Company:', job.company);
    
    // Validate inputs
    if (!originalContent || originalContent.trim().length < 50) {
      throw new Error('Resume content is too short or empty');
    }
    
    if (!job.description || job.description.trim().length < 50) {
      throw new Error('Job description is too short or empty');
    }
    
    try {
      // Use OpenAI for optimization
      const optimizationResult = await OpenAIResumeOptimizer.optimizeResumeWithAI(
        originalContent,
        job.description,
        job.title,
        job.company
      );
      
      console.log('✅ Optimization Complete:', {
        atsScore: optimizationResult.atsScore,
        addedKeywords: optimizationResult.addedKeywords.length,
        summary: optimizationResult.optimizationSummary
      });
      
      // Validate optimized content
      if (!optimizationResult.optimizedContent || optimizationResult.optimizedContent.trim().length < 50) {
        console.warn('⚠️ Optimized content is invalid, using original');
        optimizationResult.optimizedContent = originalContent;
      }
      
      // Create optimized resume object
      const optimizedResume: OptimizedResume = {
        id: `resume-${job.id}`,
        jobId: job.id,
        jobTitle: job.title,
        companyName: job.company,
        content: optimizationResult.optimizedContent,
        originalContent,
        matchScore: optimizationResult.atsScore,
        suggestions: this.generateSuggestions(optimizationResult.atsScore, optimizationResult.addedKeywords.length),
        keywords: optimizationResult.addedKeywords.slice(0, 15),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return {
        optimizedResume,
        atsScore: optimizationResult.atsScore,
        addedKeywords: optimizationResult.addedKeywords,
        optimizationSummary: optimizationResult.optimizationSummary
      };
      
    } catch (error) {
      console.error('❌ AI Optimization Error:', error);
      throw new Error(`Failed to optimize resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate optimization suggestions
   */
  private static generateSuggestions(atsScore: number, addedKeywordsCount: number): string[] {
    const suggestions = [];
    
    if (atsScore >= 96) {
      suggestions.push('🎯 Perfect optimization! Your resume is excellently tailored for this position.');
      suggestions.push('✨ All critical keywords have been strategically integrated while maintaining natural flow.');
      suggestions.push('🚀 Resume format preserved with enhanced keyword density for maximum ATS impact.');
    } else if (atsScore >= 93) {
      suggestions.push('🌟 Excellent optimization! Strong keyword alignment achieved with natural integration.');
      suggestions.push('💡 Consider adding specific metrics and achievements to strengthen your application.');
      suggestions.push('📈 ATS compatibility significantly improved with strategic keyword placement.');
    } else {
      suggestions.push('✅ Good optimization achieved with natural keyword integration.');
      suggestions.push('🎯 Focus on quantifiable results that demonstrate your impact in previous roles.');
      suggestions.push('📊 Additional technical terms added to improve ATS scanning compatibility.');
    }
    
    if (addedKeywordsCount > 0) {
      suggestions.push(`🔑 Successfully integrated ${addedKeywordsCount} critical keywords for better ATS compatibility.`);
    }
    
    return suggestions.slice(0, 4);
  }
}