import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Users, Star, Award, MessageSquare, Play, BookOpen, CheckCircle, Edit3 } from 'lucide-react';
import { courseApi } from '../api/courseApi';
import { enrollmentApi } from '../api/enrollmentApi';
import { reviewApi } from '../api/reviewApi';
import useAuthStore from '../store/authStore';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import StarRating from '../components/StarRating';
import ReviewModal from '../components/ReviewModal';
import ReviewList from '../components/ReviewList';
import StudentCertificateModal from '../components/StudentCertificateModal';
import toast from 'react-hot-toast';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [previewModal, setPreviewModal] = useState({ isOpen: false, videoUrl: '' });
  const [reviewModal, setReviewModal] = useState({ isOpen: false, existingReview: null });
  const [canReview, setCanReview] = useState({ canReview: false, hasExistingReview: false, existingReview: null });
  const [reviewsKey, setReviewsKey] = useState(0);
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);

  useEffect(() => {
    fetchCourseDetail();
    if (isAuthenticated && user?.role === 'Student') {
      checkEnrollment();
      checkReviewEligibility();
    }
  }, [id]);

  const fetchCourseDetail = async () => {
    try {
      const response = await courseApi.getCourse(id);
      setCourse(response.data);
    } catch (error) {
      console.error('Error fetching course:', error);
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  const checkReviewEligibility = async () => {
    try {
      const response = await reviewApi.canReviewCourse(id);
      setCanReview(response.data);
    } catch (error) {
      console.error('Error checking review eligibility:', error);
    }
  };

  const handleOpenReviewModal = () => {
    setReviewModal({
      isOpen: true,
      existingReview: canReview.existingReview
    });
  };

  const handleReviewSubmitted = async (review) => {
    // Refresh course data to get updated rating
    await fetchCourseDetail();
    // Refresh review eligibility
    await checkReviewEligibility();
    // Force reviews list to refresh
    setReviewsKey(prev => prev + 1);
    setReviewModal({ isOpen: false, existingReview: null });
  };

  const checkEnrollment = async () => {
    try {
      const response = await enrollmentApi.getEnrollment(id);
      const data = response.data;
      if (data && typeof data.enrolled === 'boolean') {
        setEnrollment(data.enrolled ? data.enrollment : null);
      } else {
        // Backward compatibility if API returns raw enrollment
        setEnrollment(data || null);
      }
    } catch (error) {
      // If request fails (e.g., unauthorized), treat as not enrolled for view page
      setEnrollment(null);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setEnrolling(true);
    try {
      await courseApi.enrollInCourse(id);
      toast.success('Successfully enrolled in course!');
      checkEnrollment();
    } catch (error) {
      console.error('Error enrolling:', error);
    } finally {
      setEnrolling(false);
    }
  };

  const getTotalDuration = () => {
    return course?.sections?.reduce((total, section) => {
      return total + section.lectures.reduce((sectionTotal, lecture) => {
        return sectionTotal + (lecture.duration || 0);
      }, 0);
    }, 0) || 0;
  };

  const getTotalLectures = () => {
    return course?.sections?.reduce((total, section) => {
      return total + section.lectures.length;
    }, 0) || 0;
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="mt-20" />;
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Course not found</h2>
        <p className="text-gray-600 mt-2">The course you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Course Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg p-8 text-white">
            <div className="flex items-center space-x-2 mb-4">
              <span className="bg-primary-500 px-3 py-1 rounded-full text-sm font-medium">
                {course.category}
              </span>
              <span className="bg-primary-500 px-3 py-1 rounded-full text-sm font-medium">
                {course.level}
              </span>
            </div>
            
            <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
            <p className="text-primary-100 text-lg mb-6">{course.description}</p>
            
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center">
                <Users size={16} className="mr-2" />
                <span>{course.enrolledStudents.length} students</span>
              </div>
              <div className="flex items-center">
                <Clock size={16} className="mr-2" />
                <span>{formatDuration(getTotalDuration())}</span>
              </div>
              <div className="flex items-center">
                <BookOpen size={16} className="mr-2" />
                <span>{getTotalLectures()} lectures</span>
              </div>
              {course.rating > 0 && (
                <div className="flex items-center">
                  <StarRating rating={course.rating} readonly size={16} showValue />
                  <span className="ml-2">({course.reviewCount} reviews)</span>
                </div>
              )}
            </div>
          </div>

          {/* Course Content */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Course Content</h2>
              <p className="text-gray-600 mt-1">
                {course.sections.length} sections • {getTotalLectures()} lectures • {formatDuration(getTotalDuration())} total length
              </p>
            </div>
            
            <div className="divide-y divide-gray-200">
              {course.sections.map((section, sectionIndex) => (
                <div key={section._id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Section {sectionIndex + 1}: {section.title}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {section.lectures.length} lectures
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {section.lectures.map((lecture, lectureIndex) => {
                      const isCompleted = enrollment?.lectureProgress?.find(
                        lp => lp.lectureId.toString() === lecture._id.toString()
                      )?.completed || false;

                      return (
                        <div key={lecture._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            {isCompleted ? (
                              <CheckCircle size={20} className="text-green-500 mr-3" />
                            ) : (
                              <Play size={20} className="text-gray-400 mr-3" />
                            )}
                            <div>
                              <p className="font-medium text-gray-900">
                                {lectureIndex + 1}. {lecture.title}
                              </p>
                              {lecture.description && (
                                <p className="text-sm text-gray-600">{lecture.description}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            {lecture.duration && (
                              <span className="text-sm text-gray-500">
                                {formatDuration(lecture.duration)}
                              </span>
                            )}
                            {!enrollment && sectionIndex === 0 && lectureIndex === 0 && (
                              <button
                                onClick={() => setPreviewModal({ isOpen: true, videoUrl: lecture.videoUrl })}
                                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                              >
                                Preview
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {section.quiz && section.quiz.questions.length > 0 && (
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center">
                          <Award size={20} className="text-blue-500 mr-3" />
                          <div>
                            <p className="font-medium text-gray-900">Section Quiz</p>
                            <p className="text-sm text-gray-600">
                              {section.quiz.questions.length} questions • Passing score: {section.quiz.passingScore}%
                            </p>
                          </div>
                        </div>
                        
                        {enrollment && (
                          <div className="text-sm">
                            {enrollment.quizAttempts?.find(qa => qa.sectionId.toString() === section._id.toString()) ? (
                              <span className="text-green-600 font-medium">Completed</span>
                            ) : (
                              <span className="text-gray-500">Not attempted</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructor Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About the Instructor</h2>
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-semibold text-lg">
                  {course.instructor.fullName.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{course.instructor.fullName}</h3>
                <p className="text-gray-600">Course Instructor</p>
                <p className="text-sm text-gray-500 mt-2">
                  Experienced educator passionate about sharing knowledge and helping students succeed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Course Card */}
          <div className="bg-white rounded-lg shadow overflow-hidden sticky top-6">
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-48 object-cover"
            />
            
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-900">${course.price}</div>
                <p className="text-gray-600">One-time payment</p>
              </div>

              {enrollment ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <CheckCircle size={24} className="text-green-500 mx-auto mb-2" />
                    <p className="text-green-800 font-medium">You're enrolled!</p>
                    <p className="text-green-600 text-sm">Progress: {enrollment.progress}%</p>
                  </div>
                  
                  <Button
                    onClick={() => navigate(`/course/${course._id}/learn`)}
                    className="w-full"
                    size="lg"
                  >
                    <Play size={20} className="mr-2" />
                    Continue Learning
                  </Button>
                  
                  {course.hasGroupDiscussion && (
                    <Button
                      onClick={() => navigate(`/course/${course._id}/discussion`)}
                      variant="outline"
                      className="w-full"
                    >
                      <MessageSquare size={20} className="mr-2" />
                      Join Discussion
                    </Button>
                  )}
                  
                  {canReview.canReview && enrollment?.isCompleted && (
                    <Button
                      onClick={handleOpenReviewModal}
                      variant={canReview.hasExistingReview ? "outline" : "secondary"}
                      className="w-full"
                    >
                      <Edit3 size={20} className="mr-2" />
                      {canReview.hasExistingReview ? 'Edit Review' : 'Write Review'}
                    </Button>
                  )}
                  
                  {enrollment?.isCompleted && course.hasCertificate && (
                    <Button
                      onClick={() => setCertificateModalOpen(true)}
                      variant="outline"
                      className="w-full"
                    >
                      <Award size={20} className="mr-2" />
                      View Certificate
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {user?.role === 'Student' ? (
                    <Button
                      onClick={handleEnroll}
                      loading={enrolling}
                      disabled={enrolling}
                      className="w-full"
                      size="lg"
                    >
                      Enroll Now
                    </Button>
                  ) : user?.role === 'Instructor' ? (
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-blue-800 text-sm">
                        You're viewing this as an instructor
                      </p>
                    </div>
                  ) : (
                    <Button
                      onClick={() => navigate('/login')}
                      className="w-full"
                      size="lg"
                    >
                      Login to Enroll
                    </Button>
                  )}
                </div>
              )}

              {/* Course Features */}
              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Full lifetime access</span>
                  <CheckCircle size={16} className="text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Access on mobile and TV</span>
                  <CheckCircle size={16} className="text-green-500" />
                </div>
                {course.hasCertificate && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Certificate of completion</span>
                    <CheckCircle size={16} className="text-green-500" />
                  </div>
                )}
                {course.hasGroupDiscussion && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Discussion forum</span>
                    <CheckCircle size={16} className="text-green-500" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="max-w-7xl mx-auto mt-12">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Student Reviews</h2>
                <div className="text-gray-600 mt-1">
                  {course?.reviewCount > 0 
                    ? `${course.reviewCount} ${course.reviewCount === 1 ? 'review' : 'reviews'}` 
                    : 'No reviews yet'
                  }
                  {course?.rating > 0 && (
                    <span className="ml-2">
                      • Average rating: <StarRating rating={course.rating} readonly size={14} showValue />
                    </span>
                  )}
                </div>
              </div>
              {canReview.canReview && enrollment?.isCompleted && (
                <Button
                  onClick={handleOpenReviewModal}
                  variant={canReview.hasExistingReview ? "outline" : "primary"}
                  size="sm"
                >
                  <Edit3 size={16} className="mr-2" />
                  {canReview.hasExistingReview ? 'Edit Review' : 'Write Review'}
                </Button>
              )}
            </div>
          </div>
          
          <div className="p-6">
            <ReviewList key={reviewsKey} courseId={id} />
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ isOpen: false, videoUrl: '' })}
        title="Course Preview"
        size="xl"
      >
        <div className="aspect-video">
          {previewModal.videoUrl && (
            <video
              src={previewModal.videoUrl}
              controls
              className="w-full h-full rounded-lg"
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      </Modal>

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal({ isOpen: false, existingReview: null })}
        courseId={id}
        courseName={course?.title}
        existingReview={reviewModal.existingReview}
        onReviewSubmitted={handleReviewSubmitted}
      />

      {/* Certificate Modal */}
      <StudentCertificateModal
        isOpen={certificateModalOpen}
        onClose={() => setCertificateModalOpen(false)}
        courseId={id}
      />
    </div>
  );
};

export default CourseDetail;