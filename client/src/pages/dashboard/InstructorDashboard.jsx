import React, { useState, useEffect } from 'react';

import { Link } from 'react-router-dom';
import { BookOpen, Users, DollarSign, TrendingUp, Plus, Eye } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { dashboardApi } from '../../api/dashboardApi';
import { courseApi } from '../../api/courseApi';
import { discussionApi } from '../../api/discussionApi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';

const InstructorDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState(365);
  const [questionCounts, setQuestionCounts] = useState({}); // courseId -> unanswered count

  useEffect(() => {
    fetchDashboardData(rangeDays);
    fetchMyCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeDays]);

  const fetchDashboardData = async (days) => {
    try {
      const response = await dashboardApi.getInstructorDashboard({ rangeDays: days });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchMyCourses = async () => {
    try {
      const response = await courseApi.getInstructorCourses();
      const courses = response.data.slice(0, 5); // Show only first 5 courses
      setMyCourses(courses);
      // After setting courses, fetch unanswered question counts
      fetchQuestionCounts(courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionCounts = async (courses) => {
    if (!Array.isArray(courses) || courses.length === 0) {
      setQuestionCounts({});
      return;
    }
    try {
      const results = await Promise.all(
        courses.map(async (c) => {
          try {
            const res = await discussionApi.getDiscussionCount(c._id);
            // Prefer res.data.count; fallback to res.data.unanswered or 0
            const count = (res?.data?.count ?? res?.data?.unanswered ?? 0);
            return [c._id, count];
          } catch (e) {
            console.error('Failed to fetch discussion count for course', c._id, e);
            return [c._id, 0];
          }
        })
      );
      const map = Object.fromEntries(results);
      setQuestionCounts(map);
    } catch (err) {
      console.error('Error fetching question counts:', err);
      setQuestionCounts({});
    }
  };

  // Refresh counts when window gains focus (after replying, come back and badge disappears)
  useEffect(() => {
    const onFocus = () => {
      if (myCourses.length) fetchQuestionCounts(myCourses);
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [myCourses]);

  if (loading) {
    return <LoadingSpinner size="lg" className="mt-20" />;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatMonthYear = (data) => {
    return data.map(item => ({
      ...item,
      monthYear: `${item._id.month}/${item._id.year}`
    }));
  };

  return (
    <div className="space-y-6">
      {/* Welcome + Controls */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Instructor Dashboard</h1>
            <p className="text-primary-100">Manage your courses and track your success</p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="range" className="text-sm text-primary-100">Time Range</label>
            <select
              id="range"
              value={rangeDays}
              onChange={(e) => setRangeDays(Number(e.target.value))}
              className="text-gray-900 rounded-md px-3 py-2"
            >
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Last 180 days</option>
              <option value={365}>Last 365 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.totalCourses || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.totalEnrolledStudents || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(dashboardData?.totalEarnings || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.courseRatings?.length > 0
                  ? (
                      dashboardData.courseRatings.reduce((acc, course) => acc + course.rating, 0) /
                      dashboardData.courseRatings.length
                    ).toFixed(1)
                  : '0.0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Revenue Over Time</h2>
          </div>
          <div className="p-6">
            {dashboardData?.revenueOverTime?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={formatMonthYear(dashboardData.revenueOverTime)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthYear" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No revenue data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Enrollment Trends */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Student Enrollments</h2>
          </div>
          <div className="p-6">
            {dashboardData?.enrollmentTrends?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formatMonthYear(dashboardData.enrollmentTrends)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthYear" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [value, 'Enrollments']}
                  />
                  <Bar dataKey="enrollments" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No enrollment data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Courses */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">My Courses</h2>
                <Link
                  to="/instructor/courses"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View All
                </Link>
              </div>
            </div>
            <div className="p-6">
              {myCourses.length > 0 ? (
                <div className="space-y-4">
                  {myCourses.map((course) => (
                    <div key={course._id} className="flex items-center p-4 border border-gray-200 rounded-lg">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="ml-4 flex-1">
                        <h3 className="font-medium text-gray-900">{course.title}</h3>
                        <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mt-1 text-sm text-gray-600">
                          <span>{course.enrolledStudents.length} students</span>
                          <span>{formatCurrency(course.price)}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            course.isPublished 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {course.isPublished ? 'Published' : 'Draft'}
                          </span>
                          {questionCounts[course._id] > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {questionCounts[course._id]} new question{questionCounts[course._id] > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/course/${course._id}`}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          to={`/instructor/course/${course._id}/edit`}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          Edit
                        </Link>
                        <Link
                          to={`/instructor/course/${course._id}/discussions?filter=unanswered`}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="View new questions"
                        >
                          Questions
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
                    Create your first course to start teaching
                  </p>
                  <div className="mt-6">
                    <Link to="/instructor/create-course">
                      <Button>
                        <Plus size={16} className="mr-2" />
                        Create Course
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions & Course Ratings */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-3">
              <Link
                to="/instructor/create-course"
                className="flex items-center justify-center w-full p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create New Course
              </Link>
              
              <Link
                to="/instructor/courses"
                className="flex items-center justify-center w-full p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <BookOpen className="h-5 w-5 mr-2" />
                Manage Courses
              </Link>
              
              <Link
                to="/instructor/students"
                className="flex items-center justify-center w-full p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Users className="h-5 w-5 mr-2" />
                View Students
              </Link>
            </div>
          </div>

          {/* Course Ratings */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Course Ratings</h2>
            </div>
            <div className="p-6">
              {dashboardData?.courseRatings?.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.courseRatings.slice(0, 3).map((course, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {course.courseName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {course.reviewCount} reviews
                        </p>
                      </div>
                      <div className="flex items-center ml-4">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(course.rating) ? 'fill-current' : 'text-gray-300'
                              }`}
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {course.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No ratings yet</p>
              )}
            </div>
          </div>

          {/* Top Performing Courses */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Top Performing Courses</h2>
            </div>
            <div className="p-6">
              {dashboardData?.topCourses?.length ? (
                <div className="space-y-4">
                  {dashboardData.topCourses.map((c) => (
                    <div key={c._id} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
                        <p className="text-xs text-gray-500">{c.enrollments} enrollments</p>
                      </div>
                      <div className="ml-4 text-sm font-semibold text-gray-900">
                        {formatCurrency(c.revenue)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No data in selected range</p>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default InstructorDashboard;