import React, { useState, useEffect } from 'react';
import { Award, Eye, Calendar } from 'lucide-react';
import { getStudentCertificates } from '../../api/certificateApi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import CertificateViewer from '../../components/course/CertificateViewer';
import useAuthStore from '../../store/authStore';

const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewModal, setPreviewModal] = useState({ isOpen: false, certificate: null });
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const certs = await getStudentCertificates();
      // Normalize to a safe array and drop null/undefined entries
      const safeCerts = Array.isArray(certs) ? certs.filter(Boolean) : [];
      setCertificates(safeCerts);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (certificate) => {
    setPreviewModal({ isOpen: true, certificate });
  };

  const handlePreview = (certificate) => {
    setPreviewModal({ isOpen: true, certificate });
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="mt-20" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Certificates</h1>
        <p className="text-gray-600">Your earned certificates and achievements</p>
      </div>

      {certificates.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-white rounded-lg shadow p-8">
            <Award className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates yet</h3>
            <p className="text-gray-600 mb-6">
              Complete courses to earn your first certificate
            </p>
            <Button onClick={() => window.location.href = '/courses'}>
              Browse Courses
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((certificate, idx) => {
            const courseTitle = certificate?.course?.title || certificate?.courseTitle || 'Untitled Course';
            const issuedOn = certificate?.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString() : 'Not available';
            const certId = certificate?.certificateId || certificate?._id || 'N/A';
            return (
            <div key={certId + '-' + idx} className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Certificate Preview */}
              <div className="relative bg-gradient-to-br from-primary-600 to-primary-800 p-8 text-white text-center">
                <Award size={48} className="mx-auto mb-4 text-primary-200" />
                <h3 className="text-lg font-bold mb-2">Certificate of Completion</h3>
                <p className="text-primary-100 text-sm">
                  {courseTitle}
                </p>
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 bg-white text-primary-700 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm border border-white/70">
                    Verified
                  </span>
                </div>
              </div>

              {/* Certificate Details */}
              <div className="p-6">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar size={16} className="mr-2" />
                    <span>Issued on {issuedOn}</span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Certificate ID:</span> {certId}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    size="sm"
                    onClick={() => certificate && handleView(certificate)}
                    className="w-full"
                  >
                    <Eye size={16} className="mr-2" />
                    View Certificate
                  </Button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      <Modal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ isOpen: false, certificate: null })}
        title="Certificate Preview"
        size="xl"
      >
        {previewModal.certificate && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 overflow-auto">
              <CertificateViewer
                certificate={previewModal.certificate}
                studentName={user?.fullName || user?.name || 'Student'}
              />
            </div>
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setPreviewModal({ isOpen: false, certificate: null })}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Certificates;