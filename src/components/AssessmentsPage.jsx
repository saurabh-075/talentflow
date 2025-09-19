// AssessmentsPage component
// Allows creating and previewing assessments
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  Save, 
  Play,
  GripVertical,
  ChevronDown,
  ChevronRight,
  FileText,
  Upload
} from 'lucide-react';
import { mockAPI } from '../lib/mockAPI';

// Question type components
const QuestionTypes = {
  'single-choice': {
    name: 'Single Choice',
    icon: '○',
    defaultOptions: ['Option 1', 'Option 2', 'Option 3']
  },
  'multi-choice': {
    name: 'Multiple Choice',
    icon: '☐',
    defaultOptions: ['Option 1', 'Option 2', 'Option 3']
  },
  'short-text': {
    name: 'Short Text',
    icon: '─',
    defaultOptions: null
  },
  'long-text': {
    name: 'Long Text',
    icon: '▢',
    defaultOptions: null
  },
  'numeric': {
    name: 'Numeric',
    icon: '#',
    defaultOptions: null
  },
  'file-upload': {
    name: 'File Upload',
    icon: '📎',
    defaultOptions: null
  }
};

// Question builder component
function QuestionBuilder({ question, onUpdate, onDelete, onDuplicate }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localQuestion, setLocalQuestion] = useState(question);

  useEffect(() => {
    setLocalQuestion(question);
  }, [question]);

  const handleUpdate = (field, value) => {
    const updated = { ...localQuestion, [field]: value };
    setLocalQuestion(updated);
    onUpdate(updated);
  };

  const addOption = () => {
    const newOptions = [...(localQuestion.options || []), `Option ${(localQuestion.options?.length || 0) + 1}`];
    handleUpdate('options', newOptions);
  };

  const updateOption = (index, value) => {
    const newOptions = [...(localQuestion.options || [])];
    newOptions[index] = value;
    handleUpdate('options', newOptions);
  };

  const removeOption = (index) => {
    const newOptions = localQuestion.options?.filter((_, i) => i !== index) || [];
    handleUpdate('options', newOptions);
  };

  const questionType = QuestionTypes[localQuestion.type];

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <GripVertical className="w-4 h-4 text-gray-400" />
            <span className="text-lg">{questionType.icon}</span>
            <div className="flex-1">
              <input
                type="text"
                value={localQuestion.title}
                onChange={(e) => handleUpdate('title', e.target.value)}
                className="text-lg font-medium text-gray-900 bg-transparent border-none outline-none focus:ring-0 p-0"
                placeholder="Question title"
              />
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-sm text-gray-500">{questionType.name}</span>
                <label className="flex items-center text-sm text-gray-500">
                  <input
                    type="checkbox"
                    checked={localQuestion.required}
                    onChange={(e) => handleUpdate('required', e.target.checked)}
                    className="mr-1"
                  />
                  Required
                </label>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onDuplicate(localQuestion)}
              className="p-2 text-gray-400 hover:text-gray-600"
              title="Duplicate"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(localQuestion.id)}
              className="p-2 text-gray-400 hover:text-red-600"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Question Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
            <select
              value={localQuestion.type}
              onChange={(e) => {
                const newType = e.target.value;
                const typeConfig = QuestionTypes[newType];
                handleUpdate('type', newType);
                if (typeConfig.defaultOptions) {
                  handleUpdate('options', typeConfig.defaultOptions);
                } else {
                  handleUpdate('options', undefined);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.entries(QuestionTypes).map(([key, type]) => (
                <option key={key} value={key}>{type.name}</option>
              ))}
            </select>
          </div>

          {/* Options for choice questions */}
          {(localQuestion.type === 'single-choice' || localQuestion.type === 'multi-choice') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
              <div className="space-y-2">
                {localQuestion.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => removeOption(index)}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addOption}
                  className="flex items-center px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Option
                </button>
              </div>
            </div>
          )}

          {/* Validation for numeric questions */}
          {localQuestion.type === 'numeric' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Value</label>
                <input
                  type="number"
                  value={localQuestion.validation?.min || ''}
                  onChange={(e) => handleUpdate('validation', { 
                    ...localQuestion.validation, 
                    min: e.target.value ? Number(e.target.value) : undefined 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Value</label>
                <input
                  type="number"
                  value={localQuestion.validation?.max || ''}
                  onChange={(e) => handleUpdate('validation', { 
                    ...localQuestion.validation, 
                    max: e.target.value ? Number(e.target.value) : undefined 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Max length for text questions */}
          {(localQuestion.type === 'short-text' || localQuestion.type === 'long-text') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Length</label>
              <input
                type="number"
                value={localQuestion.validation?.maxLength || ''}
                onChange={(e) => handleUpdate('validation', { 
                  ...localQuestion.validation, 
                  maxLength: e.target.value ? Number(e.target.value) : undefined 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Leave empty for no limit"
              />
            </div>
          )}

          {/* Conditional logic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Show this question only if:</label>
            <div className="text-sm text-gray-500">
              Conditional logic coming soon...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Assessment preview component
function AssessmentPreview({ assessment, responses, onResponseChange }) {
  const [currentResponses, setCurrentResponses] = useState(responses || {});

  const handleResponseChange = (questionId, value) => {
    const newResponses = { ...currentResponses, [questionId]: value };
    setCurrentResponses(newResponses);
    onResponseChange(newResponses);
  };

  const renderQuestion = (question) => {
    const response = currentResponses[question.id];

    switch (question.type) {
      case 'single-choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={response === option}
                  onChange={(e) => handleResponseChange(question.id, e.target.value)}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
        );

      case 'multi-choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(response) && response.includes(option)}
                  onChange={(e) => {
                    const currentArray = Array.isArray(response) ? response : [];
                    const newArray = e.target.checked
                      ? [...currentArray, option]
                      : currentArray.filter(item => item !== option);
                    handleResponseChange(question.id, newArray);
                  }}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
        );

      case 'short-text':
        return (
          <input
            type="text"
            value={response || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={question.validation?.maxLength}
          />
        );

      case 'long-text':
        return (
          <textarea
            value={response || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={question.validation?.maxLength}
          />
        );

      case 'numeric':
        return (
          <input
            type="number"
            value={response || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            min={question.validation?.min}
            max={question.validation?.max}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        );

      case 'file-upload':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-400">File upload is simulated in this demo</p>
          </div>
        );

      default:
        return <div>Unknown question type</div>;
    }
  };

  if (!assessment) {
    return (
      <div className="text-center text-gray-500 py-8">
        No assessment to preview
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">{assessment.title}</h2>
        <p className="text-gray-600 mt-2">Assessment Preview</p>
      </div>

      {assessment.sections?.map((section, sectionIndex) => (
        <div key={section.id} className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-100 pb-2">
            {section.title}
          </h3>
          
          {section.questions?.map((question, questionIndex) => (
            <div key={question.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-900">
                  {questionIndex + 1}. {question.title}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </label>
              </div>
              {renderQuestion(question)}
            </div>
          ))}
        </div>
      ))}

      <div className="text-center pt-6 border-t border-gray-200">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Submit Assessment
        </button>
      </div>
    </div>
  );
}

export default function AssessmentsPage({ selectedJobId, onJobSelect }) {
  const [activeTab, setActiveTab] = useState('builder'); // 'builder' or 'preview'
  const [selectedJob, setSelectedJob] = useState(selectedJobId || '');
  const [previewResponses, setPreviewResponses] = useState({});
  const queryClient = useQueryClient();

  // Fetch jobs for selection
  const { data: jobsData } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => mockAPI.getJobs({ pageSize: 100 }),
  });

  // Fetch assessment for selected job
  const { data: assessment, isLoading } = useQuery({
    queryKey: ['assessment', selectedJob],
    queryFn: () => mockAPI.getAssessment(selectedJob),
    enabled: !!selectedJob,
  });

  // Save assessment mutation
  const saveAssessmentMutation = useMutation({
    mutationFn: ({ jobId, assessmentData }) => mockAPI.saveAssessment(jobId, assessmentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment'] });
      toast.success('Assessment saved successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save assessment');
    },
  });

  // Submit assessment response mutation
  const submitResponseMutation = useMutation({
    mutationFn: ({ jobId, responses }) => mockAPI.submitAssessmentResponse(jobId, responses),
    onSuccess: () => {
      toast.success('Assessment response submitted successfully');
      setPreviewResponses({});
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit assessment response');
    },
  });

  const [localAssessment, setLocalAssessment] = useState(null);

  useEffect(() => {
    if (assessment) {
      setLocalAssessment(assessment);
    } else if (selectedJob) {
      // Create new assessment structure
      setLocalAssessment({
        title: `Assessment for Job ${selectedJob}`,
        sections: [
          {
            id: `section-${Date.now()}`,
            title: 'General Questions',
            questions: []
          }
        ]
      });
    }
  }, [assessment, selectedJob]);

  const handleSave = () => {
    if (!selectedJob || !localAssessment) return;
    
    saveAssessmentMutation.mutate({
      jobId: selectedJob,
      assessmentData: localAssessment
    });
  };

  const addSection = () => {
    if (!localAssessment) return;
    
    const newSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      questions: []
    };
    
    setLocalAssessment({
      ...localAssessment,
      sections: [...localAssessment.sections, newSection]
    });
  };

  const updateSection = (sectionId, updates) => {
    if (!localAssessment) return;
    
    setLocalAssessment({
      ...localAssessment,
      sections: localAssessment.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    });
  };

  const deleteSection = (sectionId) => {
    if (!localAssessment) return;
    
    setLocalAssessment({
      ...localAssessment,
      sections: localAssessment.sections.filter(section => section.id !== sectionId)
    });
  };

  const addQuestion = (sectionId, questionType = 'short-text') => {
    if (!localAssessment) return;
    
    const newQuestion = {
      id: `question-${Date.now()}`,
      type: questionType,
      title: 'New Question',
      required: false,
      options: QuestionTypes[questionType].defaultOptions
    };
    
    setLocalAssessment({
      ...localAssessment,
      sections: localAssessment.sections.map(section =>
        section.id === sectionId
          ? { ...section, questions: [...section.questions, newQuestion] }
          : section
      )
    });
  };

  const updateQuestion = (sectionId, questionId, updates) => {
    if (!localAssessment) return;
    
    setLocalAssessment({
      ...localAssessment,
      sections: localAssessment.sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.map(question =>
                question.id === questionId ? { ...question, ...updates } : question
              )
            }
          : section
      )
    });
  };

  const deleteQuestion = (sectionId, questionId) => {
    if (!localAssessment) return;
    
    setLocalAssessment({
      ...localAssessment,
      sections: localAssessment.sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.filter(question => question.id !== questionId)
            }
          : section
      )
    });
  };

  const duplicateQuestion = (sectionId, question) => {
    if (!localAssessment) return;
    
    const duplicatedQuestion = {
      ...question,
      id: `question-${Date.now()}`,
      title: `${question.title} (Copy)`
    };
    
    setLocalAssessment({
      ...localAssessment,
      sections: localAssessment.sections.map(section =>
        section.id === sectionId
          ? { ...section, questions: [...section.questions, duplicatedQuestion] }
          : section
      )
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
        <div className="flex items-center space-x-3">
          {selectedJob && (
            <button
              onClick={handleSave}
              disabled={saveAssessmentMutation.isLoading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveAssessmentMutation.isLoading ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
      </div>

      {/* Job Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Job</label>
        <select
          value={selectedJob}
          onChange={(e) => {
            setSelectedJob(e.target.value);
            if (onJobSelect) onJobSelect(e.target.value);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a job...</option>
          {jobsData?.data.map(job => (
            <option key={job.id} value={job.id}>{job.title}</option>
          ))}
        </select>
      </div>

      {selectedJob && (
        <>
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('builder')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'builder'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Edit className="w-4 h-4 inline mr-2" />
                  Builder
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'preview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Eye className="w-4 h-4 inline mr-2" />
                  Preview
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'builder' ? (
                <div className="space-y-6">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-500">Loading assessment...</p>
                    </div>
                  ) : (
                    <>
                      {/* Assessment Title */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Title</label>
                        <input
                          type="text"
                          value={localAssessment?.title || ''}
                          onChange={(e) => setLocalAssessment({ ...localAssessment, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Sections */}
                      {localAssessment?.sections?.map((section, sectionIndex) => (
                        <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) => updateSection(section.id, { title: e.target.value })}
                              className="text-lg font-medium bg-transparent border-none outline-none focus:ring-0 p-0"
                            />
                            <div className="flex items-center space-x-2">
                              <div className="relative">
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      addQuestion(section.id, e.target.value);
                                      e.target.value = '';
                                    }
                                  }}
                                  className="px-3 py-1 text-sm border border-gray-300 rounded-md"
                                >
                                  <option value="">Add Question</option>
                                  {Object.entries(QuestionTypes).map(([key, type]) => (
                                    <option key={key} value={key}>{type.name}</option>
                                  ))}
                                </select>
                              </div>
                              {localAssessment.sections.length > 1 && (
                                <button
                                  onClick={() => deleteSection(section.id)}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-4">
                            {section.questions?.map((question) => (
                              <QuestionBuilder
                                key={question.id}
                                question={question}
                                onUpdate={(updatedQuestion) => updateQuestion(section.id, question.id, updatedQuestion)}
                                onDelete={(questionId) => deleteQuestion(section.id, questionId)}
                                onDuplicate={(question) => duplicateQuestion(section.id, question)}
                              />
                            ))}
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={addSection}
                        className="flex items-center px-4 py-2 text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Section
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Live Preview</h3>
                    <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                      <AssessmentPreview
                        assessment={localAssessment}
                        responses={previewResponses}
                        onResponseChange={setPreviewResponses}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Test Submission</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-4">
                        Test the assessment by filling out the preview and submitting responses.
                      </p>
                      <button
                        onClick={() => {
                          if (Object.keys(previewResponses).length > 0) {
                            submitResponseMutation.mutate({
                              jobId: selectedJob,
                              responses: previewResponses
                            });
                          } else {
                            toast.error('Please fill out some responses first');
                          }
                        }}
                        disabled={submitResponseMutation.isLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        <Play className="w-4 h-4 inline mr-2" />
                        {submitResponseMutation.isLoading ? 'Submitting...' : 'Test Submit'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}