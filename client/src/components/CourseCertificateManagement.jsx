import React, { useState, useEffect } from 'react';
import { Award, Users, Download, RefreshCw, Calendar, Mail, Loader2, Search } from 'lucide-react';
import { getCourseCertificates, regenerateCertificate } from '../api/certificateApi';
import CertificateTemplateSelector from './CertificateTemplateSelector';
import toast from 'react-hot-toast';

const CourseCertificateManagement = ({ courseId, courseTitle, currentTemplate, onTemplateUpdate }) => {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [regeneratingId, setRegeneratingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (courseId) {
            fetchCourseCertificates();
        }
    }, [courseId]);

    const fetchCourseCertificates = async () => {
        try {
            setLoading(true);
            const certificatesData = await getCourseCertificates(courseId);
            setCertificates(certificatesData);
        } catch (error) {
            console.error('Error fetching course certificates:', error);
            toast.error('Failed to load course certificates');
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerateCertificate = async (certificateId) => {
        try {
            setRegeneratingId(certificateId);
            await regenerateCertificate(certificateId);
            toast.success('Certificate regenerated successfully!');
            fetchCourseCertificates(); // Refresh the list
        } catch (error) {
            console.error('Error regenerating certificate:', error);
            toast.error('Failed to regenerate certificate');
        } finally {
            setRegeneratingId(null);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredCertificates = certificates.filter(cert =>
        cert.student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.certificateId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        totalCertificates: certificates.length,
        recentCertificates: certificates.filter(cert => {
            const issueDate = new Date(cert.issuedAt);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return issueDate >= weekAgo;
        }).length
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <Award className="w-6 h-6 text-indigo-600" />
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Certificate Management</h2>
                            <p className="text-sm text-gray-600">{courseTitle}</p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-indigo-50 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <Award className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Certificates</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.totalCertificates}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">This Week</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.recentCertificates}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'overview'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('certificates')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'certificates'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Certificates ({certificates.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('template')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'template'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Template Settings
                        </button>
                    </nav>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificate Overview</h3>
                    {certificates.length === 0 ? (
                        <div className="text-center py-8">
                            <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600">No certificates issued yet</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Certificates will appear here when students complete your course
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-gray-600">
                                You have issued <strong>{certificates.length}</strong> certificate{certificates.length !== 1 ? 's' : ''} for this course.
                            </p>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                    <Award className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-blue-900">Certificate Features</h4>
                                        <ul className="mt-2 text-sm text-blue-800 space-y-1">
                                            <li>• Automatically generated when students complete the course</li>
                                            <li>• Sent via email with PDF attachment</li>
                                            <li>• Stored securely in the cloud</li>
                                            <li>• Can be regenerated with updated templates</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'certificates' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {/* Search bar */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by student name, email, or certificate ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Certificates list */}
                    <div className="p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                                <span className="ml-2 text-gray-600">Loading certificates...</span>
                            </div>
                        ) : filteredCertificates.length === 0 ? (
                            <div className="text-center py-8">
                                <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600">
                                    {searchTerm ? 'No certificates match your search' : 'No certificates issued yet'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredCertificates.map((certificate) => (
                                    <div
                                        key={certificate._id}
                                        className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                    <Award className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900">
                                                        {certificate.student.fullName}
                                                    </h4>
                                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                        <span className="flex items-center space-x-1">
                                                            <Mail className="w-3 h-3" />
                                                            <span>{certificate.student.email}</span>
                                                        </span>
                                                        <span className="flex items-center space-x-1">
                                                            <Calendar className="w-3 h-3" />
                                                            <span>{formatDate(certificate.issuedAt)}</span>
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        ID: {certificate.certificateId}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => window.open(certificate.pdfUrl, '_blank')}
                                                    className="flex items-center space-x-1 px-3 py-1 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                                                >
                                                    <Download className="w-3 h-3" />
                                                    <span>View</span>
                                                </button>
                                                <button
                                                    onClick={() => handleRegenerateCertificate(certificate.certificateId)}
                                                    disabled={regeneratingId === certificate.certificateId}
                                                    className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    {regeneratingId === certificate.certificateId ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <RefreshCw className="w-3 h-3" />
                                                    )}
                                                    <span>Regenerate</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'template' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <CertificateTemplateSelector
                        courseId={courseId}
                        currentTemplate={currentTemplate}
                        onTemplateUpdate={onTemplateUpdate}
                    />
                </div>
            )}
        </div>
    );
};

export default CourseCertificateManagement;
