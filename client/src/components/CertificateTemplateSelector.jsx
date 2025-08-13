import React, { useState, useEffect } from 'react';
import { Award, Eye, Check, Loader2 } from 'lucide-react';
import { getTemplates, updateCourseTemplate, previewTemplate } from '../api/certificateApi';
import toast from 'react-hot-toast';

const CertificateTemplateSelector = ({ courseId, currentTemplate, onTemplateUpdate }) => {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(currentTemplate || 'classic');
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

    useEffect(() => {
        setSelectedTemplate(currentTemplate || 'classic');
    }, [currentTemplate]);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const templatesData = await getTemplates();
            setTemplates(templatesData);
        } catch (error) {
            console.error('Error fetching templates:', error);
            toast.error('Failed to load certificate templates');
        } finally {
            setLoading(false);
        }
    };

    const handleTemplateSelect = (templateId) => {
        setSelectedTemplate(templateId);
    };

    const handleUpdateTemplate = async () => {
        try {
            setUpdating(true);
            await updateCourseTemplate(courseId, selectedTemplate);
            toast.success('Certificate template updated successfully!');
            if (onTemplateUpdate) {
                onTemplateUpdate(selectedTemplate);
            }
        } catch (error) {
            console.error('Error updating template:', error);
            toast.error('Failed to update certificate template');
        } finally {
            setUpdating(false);
        }
    };

    const handlePreviewTemplate = async (templateId) => {
        try {
            setPreviewLoading(templateId);
            const pdfBlob = await previewTemplate(templateId);
            
            // Create blob URL and open in new tab
            const url = window.URL.createObjectURL(pdfBlob);
            window.open(url, '_blank');
            
            // Clean up the blob URL after a delay
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 1000);
        } catch (error) {
            console.error('Error previewing template:', error);
            toast.error('Failed to preview certificate template');
        } finally {
            setPreviewLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                <span className="ml-2 text-gray-600">Loading templates...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">Certificate Template</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                    <div
                        key={template.id}
                        className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                            selectedTemplate === template.id
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleTemplateSelect(template.id)}
                    >
                        {/* Selection indicator */}
                        {selectedTemplate === template.id && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                            </div>
                        )}

                        {/* Template preview placeholder */}
                        <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                            <Award className="w-12 h-12 text-gray-400" />
                        </div>

                        {/* Template info */}
                        <div className="space-y-2">
                            <h4 className="font-semibold text-gray-900">{template.name}</h4>
                            <p className="text-sm text-gray-600">{template.description}</p>
                            
                            {/* Preview button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePreviewTemplate(template.id);
                                }}
                                disabled={previewLoading === template.id}
                                className="flex items-center space-x-1 text-sm text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                            >
                                {previewLoading === template.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                                <span>Preview</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Update button */}
            {selectedTemplate !== currentTemplate && (
                <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                        onClick={handleUpdateTemplate}
                        disabled={updating}
                        className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {updating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Award className="w-4 h-4" />
                        )}
                        <span>{updating ? 'Updating...' : 'Update Template'}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default CertificateTemplateSelector;
