import React, { useState, useEffect } from 'react';
import { X, Award, Calendar, User, Loader2, ExternalLink, BookOpen } from 'lucide-react';
import { getStudentCertificates } from '../api/certificateApi';
import Button from './ui/Button';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import CertificateViewer from './course/CertificateViewer';

const StudentCertificateModal = ({ isOpen, onClose, courseId = null }) => {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [downloadingId, setDownloadingId] = useState(null);
    const [previewCert, setPreviewCert] = useState(null);
    const user = useAuthStore((s) => s.user);

    useEffect(() => {
        if (isOpen) {
            fetchCertificates();
        }
    }, [isOpen]);

    const fetchCertificates = async () => {
        try {
            setLoading(true);
            const certificatesData = await getStudentCertificates();

            // Normalize to safe array and drop null/undefined entries
            const safeList = Array.isArray(certificatesData) ? certificatesData.filter(Boolean) : [];

            // Safely filter by courseId if provided; handle null course gracefully
            const filteredCertificates = courseId
                ? safeList.filter(cert => (cert?.course?._id || cert?.courseId || '').toString() === courseId.toString())
                : safeList;

            setCertificates(filteredCertificates);
        } catch (error) {
            console.error('Error fetching certificates:', error);
            toast.error('Failed to load certificates');
        } finally {
            setLoading(false);
        }
    };

    const handleViewCertificateInline = (certificate) => {
        setPreviewCert(certificate);
    };

    const closePreview = () => {
        setPreviewCert(null);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (!isOpen) return null;

    return (
        <>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <Award className="w-6 h-6 text-indigo-600" />
                        <h2 className="text-xl font-semibold text-gray-900">
                            {courseId ? 'Course Certificate' : 'My Certificates'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                            <span className="ml-3 text-gray-600">Loading certificates...</span>
                        </div>
                    ) : certificates.length === 0 ? (
                        <div className="text-center py-12">
                            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {courseId ? 'No Certificate Yet' : 'No Certificates Yet'}
                            </h3>
                            <p className="text-gray-600">
                                {courseId 
                                    ? 'Complete the course to earn your certificate!'
                                    : 'Complete courses to start earning certificates!'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {certificates.map((certificate, idx) => {
                                const courseTitle = certificate?.course?.title || certificate?.courseTitle || 'Untitled Course';
                                const issuedOn = certificate?.issuedAt ? formatDate(certificate.issuedAt) : 'Not available';
                                const instructorName = (
                                    certificate?.course?.instructor?.fullName ||
                                    certificate?.course?.instructor?.name ||
                                    certificate?.instructor?.fullName ||
                                    certificate?.instructor?.name ||
                                    'N/A'
                                );
                                const certId = certificate?.certificateId || certificate?._id || `idx-${idx}`;
                                return (
                                <div
                                    key={certId}
                                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            {/* Course info */}
                                            <div className="flex items-center space-x-3 mb-4">
                                                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                    <Award className="w-6 h-6 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {courseTitle}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        Certificate ID: {certId}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Certificate details */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>Issued: {issuedOn}</span>
                                                </div>
                                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                    <User className="w-4 h-4" />
                                                    <span>Instructor: {instructorName}</span>
                                                </div>
                                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                    <BookOpen className="w-4 h-4" />
                                                    <span>Course Completed</span>
                                                </div>
                                            </div>

                                            {/* Achievement badge */}
                                            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <Award className="w-3 h-3 mr-1" />
                                                Certificate Earned
                                            </div>
                                        </div>

                                        {/* Download button */}
                                        <div className="ml-4">
                                            <button
                                                onClick={() => certificate && handleViewCertificateInline(certificate)}
                                                disabled={downloadingId === certId}
                                                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {downloadingId === certId ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <ExternalLink className="w-4 h-4" />
                                                )}
                                                <span>
                                                    {downloadingId === certId ? 'Opening...' : 'View Certificate'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {certificates.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>{certificates.length} certificate{certificates.length !== 1 ? 's' : ''} earned</span>
                            <span>Keep learning to earn more certificates!</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
            {/* Inline Preview Modal (styled card, not PDF) */}
            {previewCert && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-auto shadow-2xl">
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center space-x-3">
                                <Award className="w-5 h-5 text-indigo-600" />
                                <h3 className="font-semibold text-gray-900">Certificate Preview</h3>
                            </div>
                            <button onClick={closePreview} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                        <div className="bg-gray-50 p-6">
                            <CertificateViewer
                                certificate={previewCert}
                                studentName={user?.fullName || user?.name || 'Student'}
                            />
                        </div>
                        <div className="flex justify-end p-3 border-t bg-white">
                            <Button variant="outline" onClick={closePreview}>Close</Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default StudentCertificateModal;
