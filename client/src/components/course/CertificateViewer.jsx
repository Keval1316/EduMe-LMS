import React from 'react';
import { Award } from 'lucide-react';

const CertificateViewer = ({ certificate, studentName }) => {
  const formatDate = (date) => {
    if (!date) return 'Not available';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Not available';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Robustly resolve instructor name from possible shapes
  const instructorName = (
    certificate?.course?.instructor?.fullName ||
    certificate?.course?.instructor?.name ||
    certificate?.course?.instructorName ||
    certificate?.instructor?.fullName ||
    certificate?.instructor?.name ||
    certificate?.instructorName ||
    'Instructor'
  );

  const courseTitle = certificate?.course?.title || certificate?.courseTitle || 'Untitled Course';
  const issuedOn = certificate?.issuedAt || certificate?.completedAt || null;

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6">
      {/* Certificate */}
      <div className="w-full bg-white border-4 sm:border-8 border-gray-200 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-4 sm:p-10 lg:p-16 text-white relative">
          {/* Branding */}
          <div className="absolute top-3 sm:top-6 left-1/2 -translate-x-1/2 sm:left-auto sm:right-8 sm:translate-x-0 text-lg sm:text-2xl font-extrabold tracking-wide text-center">
            EduMe
          </div>
          
          <div className="text-center relative z-10">
            {/* Header */}
            <div className="mb-4 sm:mb-8">
              <div className="w-14 sm:w-24 h-1 bg-white bg-opacity-50 mx-auto mb-3 sm:mb-6 rounded" />
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-1 sm:mb-4 tracking-wide">CERTIFICATE</h1>
              <p className="text-sm sm:text-2xl text-primary-100 tracking-widest">OF COMPLETION</p>
            </div>
            
            {/* Decorative line */}
            <div className="w-20 sm:w-32 h-1 bg-white bg-opacity-50 mx-auto mb-4 sm:mb-8"></div>
            
            {/* Content */}
            <div className="mb-5 sm:mb-8">
              <p className="text-sm sm:text-xl text-primary-100 mb-2 sm:mb-4">This is to certify that</p>
              <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-6 pb-1 sm:pb-2 border-b-2 border-white border-opacity-50 inline-block px-3 sm:px-8 break-words">
                {studentName}
              </h2>
              <p className="text-sm sm:text-xl text-primary-100 mb-2 sm:mb-4">has successfully completed the course</p>
              <h3 className="text-base sm:text-2xl font-semibold italic text-primary-50 leading-relaxed max-w-2xl mx-auto px-2">
                "{courseTitle}"
              </h3>
            </div>
            
            {/* Footer */}
            <div className="flex flex-row items-center text-center gap-3 sm:gap-0 max-w-full sm:max-w-2xl mx-auto mt-6 sm:mt-12">
              <div className="flex-1 text-center sm:text-left">
                <div className="w-full sm:w-48 border-t-2 border-white border-opacity-50 pt-1.5 sm:pt-2">
                  <p className="font-semibold text-sm sm:text-lg">
                    {instructorName}
                  </p>
                  <p className="text-primary-100 text-[10px] sm:text-sm">Course Instructor</p>
                </div>
              </div>

              {/* Minimal center spacer to balance layout (removed white circle) */}
              <div className="flex-1 flex items-center justify-center text-center px-2 sm:px-4 order-none">
                <div>
                  <div className="w-10 sm:w-12 h-0.5 bg-white bg-opacity-40 mx-auto mb-1 sm:mb-2 rounded" />
                  <p className="text-[10px] sm:text-xs text-primary-200">EduMe</p>
                </div>
              </div>

              <div className="flex-1 text-center sm:text-right">
                <div className="w-full sm:w-48 border-t-2 border-white border-opacity-50 pt-1.5 sm:pt-2">
                  <p className="font-semibold text-sm sm:text-lg">
                    {formatDate(issuedOn)}
                  </p>
                  <p className="text-primary-100 text-[10px] sm:text-sm">Date of Completion</p>
                </div>
              </div>
            </div>
            
            {/* Certificate ID */}
            <div className="mt-4 sm:mt-8 text-center">
              <p className="text-[10px] sm:text-xs text-primary-200 tracking-widest px-2 break-words">
                CERTIFICATE ID: {certificate.certificateId}
              </p>
            </div>
          </div>
        </div>
        
        {/* White border footer */}
        <div className="bg-white p-3 sm:p-6 text-center border-t-4 border-primary-200">
          <p className="text-gray-600 text-[11px] sm:text-sm">
            This certificate verifies that the above named individual has completed the requirements for the specified course. Issued by EduMe Platform.
          </p>
        </div>
      </div>

      {/* Certificate Details */}
      <div className="mt-5 sm:mt-8 bg-gray-50 rounded-lg p-3 sm:p-6">
        <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-4 text-center sm:text-left">Certificate Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
          <div>
            <span className="font-medium text-gray-700">Course:</span>
            <p className="text-gray-600 break-words">{courseTitle}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Completion Date:</span>
            <p className="text-gray-600">{formatDate(issuedOn)}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Certificate ID:</span>
            <p className="text-gray-600 font-mono break-words">{certificate?.certificateId || certificate?._id || 'N/A'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Instructor:</span>
            <p className="text-gray-600">{instructorName}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateViewer;