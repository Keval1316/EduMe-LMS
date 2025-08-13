import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Eye, Trash2, Users, DollarSign, Star, MessageSquare } from 'lucide-react';
import { courseApi } from '../../api/courseApi';
import { discussionApi } from '../../api/discussionApi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, course: null });
  const [discussionCounts, setDiscussionCounts] = useState({});

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await courseApi.getInstructorCourses();
      setCourses(response.data);
      
      // Fetch discussion counts for each course
      const counts = {};
      await Promise.all(
        response.data.map(async (course) => {
          try {
            const countResponse = await discussionApi.getDiscussionCount(course._id);
            counts[course._id] = countResponse.data.count;
          } catch (error) {
            console.error(`Error fetching discussion count for course ${course._id}:`, error);
            counts[course._id] = 0;
          }
        })
      );
      setDiscussionCounts(counts);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToggle = async (courseId, isPublished) => {
    try {
      if (!isPublished) {
        await courseApi.publishCourse(courseId);
        setCourses(courses.map(course =>
          course._id === courseId ? { ...course, isPublished: true } : course
        ));
        toast.success('Course published successfully');
      }
    } catch (error) {
      console.error('Error publishing course:', error);
    }
  };

  const handleDeleteCourse = async () => {
    try {
      await courseApi.deleteCourse(deleteModal.course._id);
      setCourses(courses.filter(course => course._id !== deleteModal.course._id));
      setDeleteModal({ isOpen: false, course: null });
      toast.success('Course deleted successfully');
    } catch (error) {
      console.error('Error deleting course:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="mt-20" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-600">Manage and track your courses</p>
        </div>
        <Link to="/instructor/create-course">
          <Button>
            <Plus size={16} className="mr-2" />
            Create Course
          </Button>
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-gray-500">
              <Plus className="mx-auto h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first course to start teaching and earning
              </p>
              <Link to="/instructor/create-course">
                <Button>
                  <Plus size={16} className="mr-2" />
                  Create Your First Course
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course._id} className="bg-white rounded-lg shadow overflow-hidden transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg">
              <div className="relative">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 right-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    course.isPublished
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {course.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {course.title}
                </h3>
                
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    {course.category}
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {course.level}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3 mb-4 text-center">
                  <div>
                    <div className="flex items-center justify-center text-gray-600 mb-1">
                      <Users size={16} />
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {course.enrolledStudents.length}
                    </p>
                    <p className="text-xs text-gray-500">Students</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-center text-gray-600 mb-1">
                      <MessageSquare size={16} />
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {discussionCounts[course._id] || 0}
                    </p>
                    <p className="text-xs text-gray-500">Questions</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-center text-gray-600 mb-1">
                      <DollarSign size={16} />
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      ${course.price}
                    </p>
                    <p className="text-xs text-gray-500">Price</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-center text-gray-600 mb-1">
                      <Star size={16} />
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {course.rating || '0.0'}
                    </p>
                    <p className="text-xs text-gray-500">Rating</p>
                  </div>
                </div>

                {/* Total Earnings */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-green-600 font-medium">Total Earnings</p>
                    <p className="text-lg font-bold text-green-800">
                      ${(course.enrolledStudents.length * course.price).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Link
                        to={`/course/${course._id}`}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Course"
                      >
                        <Eye size={16} />
                      </Link>
                      
                      <Link
                        to={`/instructor/course/${course._id}/edit`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Course"
                      >
                        <Edit size={16} />
                      </Link>
                      
                      <Link
                        to={`/instructor/course/${course._id}/discussions`}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Manage Discussions"
                      >
                        <MessageSquare size={16} />
                      </Link>
                      
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, course })}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Course"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {!course.isPublished && (
                      <Button
                        size="sm"
                        onClick={() => handlePublishToggle(course._id, course.isPublished)}
                      >
                        Publish
                      </Button>
                    )}
                  </div>
                  
                  {/* Discussion Quick Actions */}
                  {discussionCounts[course._id] > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-700 font-medium">
                          {discussionCounts[course._id]} student question{discussionCounts[course._id] !== 1 ? 's' : ''}
                        </span>
                        <Link
                          to={`/instructor/course/${course._id}/discussions`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Answer →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, course: null })}
        title="Delete Course"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete "{deleteModal.course?.title}"? This action cannot be undone.
          </p>
          <div className="flex space-x-4 justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ isOpen: false, course: null })}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteCourse}
            >
              Delete Course
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MyCourses;