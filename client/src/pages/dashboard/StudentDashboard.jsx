import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Award, TrendingUp, Play, ChevronRight, Download } from 'lucide-react';
import { dashboardApi } from '../../api/dashboardApi';
import { courseApi } from '../../api/courseApi';
import { getStudentCertificates } from '../../api/certificateApi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import StudentCertificateModal from '../../components/StudentCertificateModal';

const StudentDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchRecommendedCourses();
    fetchCertificates();
  }, []);

  // Refresh dashboard when course progress updates elsewhere (e.g., CourseViewer)
  useEffect(() => {
    const handler = () => {
      fetchDashboardData();
    };
    window.addEventListener('courseProgressUpdated', handler);
    return () => window.removeEventListener('courseProgressUpdated', handler);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardApi.getStudentDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchRecommendedCourses = async () => {
    try {
      const response = await courseApi.getRecommendedCourses({ limit: 6 });
      setRecommendedCourses(response.data.courses);
    } catch (error) {
      console.error('Error fetching recommended courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificates = async () => {
    try {
      const certificatesData = await getStudentCertificates();
      setCertificates(certificatesData);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="mt-20" />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-blue-600 bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] rounded-lg p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold mb-2">Welcome back!</h1>
        <p className="text-white/80">Continue your learning journey today</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Enrolled Courses</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.enrolledCourses || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Award className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.completedCourses || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Learning Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(dashboardData?.totalLearningTime || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.progressTracker?.length > 0
                  ? Math.round(
                      dashboardData.progressTracker.reduce((acc, item) => acc + item.progress, 0) /
                      dashboardData.progressTracker.length
                    )
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCertificateModalOpen(true)}>
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Award className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Certificates</p>
              <p className="text-2xl font-bold text-gray-900">
                {certificates?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue Learning */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Continue Learning</h2>
            </div>
            <div className="p-6">
              {dashboardData?.recentlyViewed?.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recentlyViewed.map((enrollment) => (
                    <div key={enrollment._id} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <img
                        src={enrollment.course.thumbnail}
                        alt={enrollment.course.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="ml-4 flex-1">
                        <h3 className="font-medium text-gray-900">{enrollment.course.title}</h3>
                        <p className="text-sm text-gray-600">
                          by {enrollment.course.instructor.fullName}
                        </p>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium">{enrollment.progress}%</span>
                          </div>
                          <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full"
                              style={{ width: `${enrollment.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex items-center space-x-2">
                        {enrollment.isCompleted && enrollment.course.hasCertificate && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setCertificateModalOpen(true);
                            }}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="View Certificate"
                          >
                            <Award size={20} />
                          </button>
                        )}
                        <Link
                          to={`/course/${enrollment.course._id}/learn`}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Play size={20} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No courses yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start learning by enrolling in a course
                  </p>
                  <div className="mt-6">
                    <Link to="/courses">
                      <Button>Browse Courses</Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-3">
              <Link
                to="/courses"
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 text-gray-600" />
                  <span className="ml-3 text-sm font-medium text-gray-900">Browse Courses</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Link>
              
              <Link
                to="/student/courses"
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <Play className="h-5 w-5 text-gray-600" />
                  <span className="ml-3 text-sm font-medium text-gray-900">My Learning</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Link>
              
              <Link
                to="/student/certificates"
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-gray-600" />
                  <span className="ml-3 text-sm font-medium text-gray-900">Certificates</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Progress Tracker */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Progress Tracker</h2>
            </div>
            <div className="p-6">
              {dashboardData?.progressTracker?.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.progressTracker.slice(0, 3).map((item) => (
                    <div key={item.courseId}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-900 truncate">
                          {item.courseName}
                        </span>
                        <span className="text-gray-600">{item.progress}%</span>
                      </div>
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            item.isCompleted ? 'bg-green-500' : 'bg-primary-600'
                          }`}
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No progress to show</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Courses */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recommended for You</h2>
            <Link
              to="/courses"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View All
            </Link>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedCourses.map((course) => (
              <Link key={course._id} to={`/course/${course._id}`} className="block">
                <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-2">{course.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      by {course.instructor.fullName}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary-600">
                        ${course.price}
                      </span>
                      <span className="text-sm text-gray-500">
                        Click to view
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      <StudentCertificateModal
        isOpen={certificateModalOpen}
        onClose={() => setCertificateModalOpen(false)}
      />
    </div>
  );
};

export default StudentDashboard;