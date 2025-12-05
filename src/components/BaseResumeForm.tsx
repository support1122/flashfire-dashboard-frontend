import React, { useState, useEffect } from 'react';
import { X, FileText, User, Briefcase, GraduationCap, Award } from 'lucide-react';
import { BaseResume } from '../types';

interface BaseResumeFormProps {
  baseResume?: BaseResume | null;
  onSubmit: (baseResume: Omit<BaseResume, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const BaseResumeForm: React.FC<BaseResumeFormProps> = ({
  baseResume,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    skills: [] as string[],
    experience: [] as string[],
    education: [] as string[],
  });

  const [newSkill, setNewSkill] = useState('');
  const [newExperience, setNewExperience] = useState('');
  const [newEducation, setNewEducation] = useState('');

  useEffect(() => {
    if (baseResume) {
      setFormData({
        name: baseResume.name,
        content: baseResume.content,
        skills: [...baseResume.skills],
        experience: [...baseResume.experience],
        education: [...baseResume.education],
      });
    }
  }, [baseResume]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.content.trim()) {
      return;
    }
    onSubmit(formData);
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill),
    }));
  };

  const addExperience = () => {
    if (newExperience.trim()) {
      setFormData(prev => ({
        ...prev,
        experience: [...prev.experience, newExperience.trim()],
      }));
      setNewExperience('');
    }
  };

  const removeExperience = (index: number) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  const addEducation = () => {
    if (newEducation.trim()) {
      setFormData(prev => ({
        ...prev,
        education: [...prev.education, newEducation.trim()],
      }));
      setNewEducation('');
    }
  };

  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          {baseResume ? 'Edit Base Resume' : 'Create Base Resume'}
        </h3>
        <button
          onClick={onCancel}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-1" />
            Resume Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="e.g., Software Engineer Template"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 inline mr-1" />
            Resume Content *
          </label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            required
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical font-mono text-sm"
            placeholder="Paste your resume content here..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Award className="w-4 h-4 inline mr-1" />
              Skills
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                placeholder="Add skill..."
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                Add
              </button>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {formData.skills.map((skill) => (
                <div key={skill} className="flex items-center justify-between bg-gray-100 rounded px-2 py-1">
                  <span className="text-sm">{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="text-red-600 hover:text-red-700 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Briefcase className="w-4 h-4 inline mr-1" />
              Experience
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={newExperience}
                onChange={(e) => setNewExperience(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExperience())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                placeholder="Add experience..."
              />
              <button
                type="button"
                onClick={addExperience}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                Add
              </button>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {formData.experience.map((exp, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-100 rounded px-2 py-1">
                  <span className="text-sm truncate">{exp}</span>
                  <button
                    type="button"
                    onClick={() => removeExperience(index)}
                    className="text-red-600 hover:text-red-700 text-xs ml-2"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <GraduationCap className="w-4 h-4 inline mr-1" />
              Education
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={newEducation}
                onChange={(e) => setNewEducation(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEducation())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                placeholder="Add education..."
              />
              <button
                type="button"
                onClick={addEducation}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                Add
              </button>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {formData.education.map((edu, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-100 rounded px-2 py-1">
                  <span className="text-sm truncate">{edu}</span>
                  <button
                    type="button"
                    onClick={() => removeEducation(index)}
                    className="text-red-600 hover:text-red-700 text-xs ml-2"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            {baseResume ? 'Update Resume' : 'Create Resume'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BaseResumeForm;