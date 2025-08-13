import React, { useState, useEffect } from 'react';
import { Users, Search, Download, Mail, Filter } from 'lucide-react';
import { dashboardApi } from '../../api/dashboardApi';
import { courseApi } from '../../api/courseApi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

const StudentManagement = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [progressFilter, setProgressFilter] = useState('all');

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchStudents(selectedCourse);
    }
  }, [selectedCourse]);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, progressFilter]);

  const fetchCourses = async () => {
    try {
      const response = await courseApi.getInstructorCourses();
      setCourses(response.data);
      if (response.data.length > 0) {
        setSelectedCourse(response.data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (courseId) => {
    try {
      const response = await dashboardApi.getEnrolledStudents(courseId);
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Progress filter
    if (progressFilter === 'completed') {
      filtered = filtered.filter(student => student.isCompleted);
    } else if (progressFilter === 'in-progress') {
      filtered = filtered.filter(student => !student.isCompleted && student.progress > 0);
    } else if (progressFilter === 'not-started') {
      filtered = filtered.filter(student => student.progress === 0);
    }

    setFilteredStudents(filtered);
  };

  const exportStudentData = () => {
    const csvData = [
      ['Name', 'Email', 'Enrolled Date', 'Progress', 'Status', 'Quiz Scores'],
      ...filteredStudents.map(student => [
        student.studentName,
        student.studentEmail,
        new Date(student.enrolledAt).toLocaleDateString(),
        `${student.progress}%`,
        student.isCompleted ? 'Completed' : 'In Progress',
        student.quizScores.map(qs => `${qs.score}%`).join('; ')
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students-${selectedCourse}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getProgressColor = (progress) => {
    if (progress === 0) return 'bg-gray-300';
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusBadge = (student) => {
    if (student.isCompleted) {
      return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Completed</span>;
    } else if (student.progress > 0) {
      return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">In Progress</span>;
    } else {
      return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">Not Started</span>;
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="mt-20" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-600">Track and manage your students' progress</p>
        </div>
        
        {filteredStudents.length > 0 && (
          <Button onClick={exportStudentData} variant="outline">
            <Download size={16} className="mr-2" />
            Export Data
          </Button>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-white rounded-lg shadow p-8">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first course to start managing students
            </p>
            <Button onClick={() => window.location.href = '/instructor/create-course'}>
              Create Course
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Course Selection and Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                label="Select Course"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
              </Select>

              <div className="relative">
                <Search className="absolute left-3 top-8 text-gray-400" size={20} />
                <Input
                  label="Search Students"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select
                label="Filter by Progress"
                value={progressFilter}
                onChange={(e) => setProgressFilter(e.target.value)}
              >
                <option value="all">All Students</option>
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
                <option value="not-started">Not Started</option>
              </Select>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setProgressFilter('all');
                  }}
                  className="w-full"
                >
                  <Filter size={16} className="mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Student Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {students.filter(s => s.isCompleted).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Users className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {students.filter(s => !s.isCompleted && s.progress > 0).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Users className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {students.length > 0 
                      ? Math.round(students.reduce((acc, s) => acc + s.progress, 0) / students.length)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Students ({filteredStudents.length})
              </h3>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                <p className="text-gray-600">
                  {students.length === 0 
                    ? "No students have enrolled in this course yet"
                    : "Try adjusting your search or filter criteria"
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Enrolled Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quiz Scores
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student) => (
                      <tr key={student.studentId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary-600 font-semibold">
                                {student.studentName.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {student.studentName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {student.studentEmail}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(student.enrolledAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 mr-4">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-gray-900">
                                  {student.progress}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${getProgressColor(student.progress)}`}
                                  style={{ width: `${student.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(student)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {student.quizScores.length > 0 ? (
                              <div className="space-y-1">
                                {student.quizScores.map((quiz, index) => (
                                  <div key={index} className="flex items-center">
                                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                      quiz.passed ? 'bg-green-500' : 'bg-red-500'
                                    }`}></span>
                                    <span className="text-xs">
                                      Quiz {index + 1}: {quiz.score}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-500 text-xs">No quizzes taken</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            
                            <a  href={`mailto:${student.studentEmail}`}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Mail size={16} />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StudentManagement;