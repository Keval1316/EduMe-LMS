import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, Award, BookOpen, Search, Edit3, Star } from 'lucide-react';
import { enrollmentApi } from '../../api/enrollmentApi';
import { reviewApi } from '../../api/reviewApi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import StarRating from '../../components/StarRating';
import ReviewModal from '../../components/ReviewModal';
import StudentCertificateModal from '../../components/StudentCertificateModal';

const MyCourses = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, in-progress, completed
  const [reviewModal, setReviewModal] = useState({ isOpen: false, courseId: null, courseName: '', existingReview: null });
  const [reviewStates, setReviewStates] = useState({}); // Track review eligibility for each course
  const [certificateModal, setCertificateModal] = useState({ isOpen: false, courseId: null });

  useEffect(() => {
    fetchEnrollments();
  }, []);

  useEffect(() => {
    // Check review eligibility for completed courses
    const checkReviewEligibility = async () => {
      const completedEnrollments = enrollments.filter(e => e.isCompleted);
      const reviewPromises = completedEnrollments.map(async (enrollment) => {
        try {
          const response = await reviewApi.canReviewCourse(enrollment.course._id);
          return {
            courseId: enrollment.course._id,
            ...response.data
          };
        } catch (error) {
          console.error(`Error checking review eligibility for course ${enrollment.course._id}:`, error);
          return {
            courseId: enrollment.course._id,
            canReview: false,
            hasExistingReview: false,
            existingReview: null
          };
        }
      });
      
      const reviewResults = await Promise.all(reviewPromises);
      const reviewStatesMap = {};
      reviewResults.forEach(result => {
        reviewStatesMap[result.courseId] = result;
      });
      setReviewStates(reviewStatesMap);
    };

    if (enrollments.length > 0) {
      checkReviewEligibility();
    }
  }, [enrollments]);

  useEffect(() => {
    filterEnrollments();
  }, [enrollments, searchTerm, filter]);

  const fetchEnrollments = async () => {
    try {
      const response = await enrollmentApi.getEnrollments();
      setEnrollments(response.data);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReviewModal = (courseId, courseName, existingReview = null) => {
    setReviewModal({
      isOpen: true,
      courseId,
      courseName,
      existingReview
    });
  };

  const handleReviewSubmitted = async (review) => {
    // Refresh enrollments to get updated course ratings
    await fetchEnrollments();
    // Update review state for this course
    if (reviewModal.courseId) {
      try {
        const response = await reviewApi.canReviewCourse(reviewModal.courseId);
        setReviewStates(prev => ({
          ...prev,
          [reviewModal.courseId]: {
            courseId: reviewModal.courseId,
            ...response.data
          }
        }));
      } catch (error) {
        console.error('Error updating review state:', error);
      }
    }
    setReviewModal({ isOpen: false, courseId: null, courseName: '', existingReview: null });
  };

  const handleOpenCertificate = (courseId) => {
    setCertificateModal({ isOpen: true, courseId });
  };

  const filterEnrollments = () => {
    let filtered = enrollments;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(enrollment => {
        const title = (enrollment.course?.title || '').toLowerCase();
        const instructor = (enrollment.course?.instructor?.fullName || '').toLowerCase();
        return title.includes(term) || instructor.includes(term);
      });
    }

    // Status filter
    if (filter === 'in-progress') {
      filtered = filtered.filter(enrollment => !enrollment.isCompleted);
    } else if (filter === 'completed') {
      filtered = filtered.filter(enrollment => enrollment.isCompleted);
    }

    setFilteredEnrollments(filtered);
  };

  const getProgressColor = (progress) => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="mt-20" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
        <p className="text-gray-600">Continue your learning journey</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({enrollments.length})
            </button>
            <button
              onClick={() => setFilter('in-progress')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'in-progress'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              In Progress ({enrollments.filter(e => !e.isCompleted).length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed ({enrollments.filter(e => e.isCompleted).length})
            </button>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {filteredEnrollments.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-white rounded-lg shadow p-8">
            {enrollments.length === 0 ? (
              <div className="text-gray-500">
                <BookOpen className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses enrolled</h3>
                <p className="text-gray-600 mb-6">
                  Start learning by enrolling in your first course
                </p>
                <Link to="/courses">
                  <Button>Browse Courses</Button>
                </Link>
              </div>
            ) : (
              <div className="text-gray-500">
                <Search className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
                <p className="text-gray-600">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEnrollments.map((enrollment) => (
            <div key={enrollment._id} className="bg-white rounded-lg shadow overflow-hidden transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg">
              <div className="relative">
                {enrollment.course?.thumbnail ? (
                  <img
                    src={enrollment.course.thumbnail}
                    alt={enrollment.course?.title || 'Course thumbnail'}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                    No image
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  {enrollment.isCompleted ? (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                      <Award size={12} className="mr-1" />
                      Completed
                    </span>
                  ) : (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                      <Clock size={12} className="mr-1" />
                      In Progress
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {enrollment.course?.title || 'Untitled course'}
                </h3>
                
                <p className="text-sm text-gray-600 mb-4">
                  by {enrollment.course?.instructor?.fullName || 'Unknown instructor'}
                </p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{enrollment.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(enrollment.progress)}`}
                      style={{ width: `${enrollment.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Course Stats and Rating */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{enrollment.course?.sections?.length || 0} sections</span>
                    <span>
                      {enrollment.course?.sections?.reduce((total, section) => 
                        total + (section.lectures?.length || 0), 0
                      ) || 0} lectures
                    </span>
                  </div>
                  
                  {/* Course Rating */}
                  {enrollment.course?.rating > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Course Rating:</span>
                      <div className="flex items-center">
                        <StarRating rating={enrollment.course.rating} readonly size={14} showValue />
                        <span className="ml-1 text-xs text-gray-500">({enrollment.course.reviewCount})</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Link
                    to={`/course/${enrollment.course?._id || ''}/learn`}
                    className="w-full"
                  >
                    <Button className="w-full">
                      {enrollment.isCompleted ? (
                        <>
                          <Award size={16} className="mr-2" />
                          View Course
                        </>
                      ) : (
                        <>
                          <Play size={16} className="mr-2" />
                          Continue Learning
                        </>
                      )}
                    </Button>
                  </Link>
                  
                  {/* View Certificate for Completed Courses */}
                  {enrollment.isCompleted && (
                    <Button
                      onClick={() => handleOpenCertificate(enrollment.course._id)}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      <Award size={14} className="mr-2" />
                      View Certificate
                    </Button>
                  )}

                  {/* Review Button for Completed Courses */}
                  {enrollment.isCompleted && reviewStates[enrollment.course?._id]?.canReview && (
                    <Button
                      onClick={() => handleOpenReviewModal(
                        enrollment.course._id,
                        enrollment.course.title,
                        reviewStates[enrollment.course._id]?.existingReview
                      )}
                      variant={reviewStates[enrollment.course._id]?.hasExistingReview ? "outline" : "secondary"}
                      className="w-full"
                      size="sm"
                    >
                      <Edit3 size={14} className="mr-2" />
                      {reviewStates[enrollment.course._id]?.hasExistingReview ? 'Edit Review' : 'Write Review'}
                    </Button>
                  )}
                </div>

                {/* Enrollment Date */}
                <div className="mt-4 text-xs text-gray-500 text-center">
                  Enrolled on {new Date(enrollment.enrolledAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal({ isOpen: false, courseId: null, courseName: '', existingReview: null })}
        courseId={reviewModal.courseId}
        courseName={reviewModal.courseName}
        existingReview={reviewModal.existingReview}
        onReviewSubmitted={handleReviewSubmitted}
      />

      {/* Certificate Modal */}
      <StudentCertificateModal
        isOpen={certificateModal.isOpen}
        onClose={() => setCertificateModal({ isOpen: false, courseId: null })}
        courseId={certificateModal.courseId}
      />
    </div>
  );
};

export default MyCourses;