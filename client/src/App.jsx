import React, { useEffect, useRef, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { authApi } from './api/authApi';
import useAuthStore from './store/authStore';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Code-split pages
const Landing = lazy(() => import('./pages/Landing'));
const Courses = lazy(() => import('./pages/Courses'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Register = lazy(() => import('./pages/auth/Register'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));
const Login = lazy(() => import('./pages/auth/Login'));
const InterestSelection = lazy(() => import('./pages/auth/InterestSelection'));

// Protected Pages - Student
const StudentDashboard = lazy(() => import('./pages/dashboard/StudentDashboard'));
const StudentCourses = lazy(() => import('./pages/student/MyCourses'));
const StudentDiscussions = lazy(() => import('./pages/student/Discussions'));
const CourseViewer = lazy(() => import('./pages/CourseViewer'));
const CourseDiscussion = lazy(() => import('./pages/CourseDiscussion'));
const Certificates = lazy(() => import('./pages/student/Certificates'));

// Protected Pages - Instructor
const InstructorDashboard = lazy(() => import('./pages/dashboard/InstructorDashboard'));
const CreateCourse = lazy(() => import('./pages/instructor/CreateCourse'));
const MyCourses = lazy(() => import('./pages/instructor/MyCourses'));
const EditCourse = lazy(() => import('./pages/instructor/EditCourse'));
const CourseDiscussions = lazy(() => import('./pages/instructor/CourseDiscussions'));
const StudentManagement = lazy(() => import('./pages/instructor/StudentManagement'));
const InstructorAnalytics = lazy(() => import('./pages/instructor/Analytics'));

// Protected Routes Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route Component (redirect if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Dashboard Route (redirect based on role)
const DashboardRoute = () => {
  const { user } = useAuthStore();

  if (user?.role === 'Student') {
    return <StudentDashboard />;
  } else if (user?.role === 'Instructor') {
    return <InstructorDashboard />;
  }

  return <Navigate to="/" replace />;
};

function App() {
  const { login, logout } = useAuthStore();
  const [initialLoading, setInitialLoading] = React.useState(true);
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return; // prevent repeated calls under StrictMode/remounts
    didInit.current = true;
    // Attempt to rehydrate auth state from server session (cookie)
    const initAuth = async () => {
      try {
        const response = await authApi.getProfile();
        // If server returns profile, user is authenticated
        login(response.data);
      } catch (error) {
        // Token might be missing/expired/invalid
        logout();
      } finally {
        setInitialLoading(false);
      }
    };

    initAuth();
  }, []);

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Router>
      <ErrorBoundary>
        <div className="App">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <LoadingSpinner size="lg" />
          </div>
        }>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="courses" element={<Courses />} />
            <Route path="course/:id" element={<CourseDetail />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            
            {/* Auth Routes */}
            <Route path="register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />
            <Route path="verify-email" element={
              <PublicRoute>
                <VerifyEmail />
              </PublicRoute>
            } />
            <Route path="login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="select-interests" element={
              <ProtectedRoute allowedRoles={['Student']}>
                <InterestSelection />
              </ProtectedRoute>
            } />

            {/* Protected Routes - Common */}
            <Route path="dashboard" element={
              <ProtectedRoute>
                <DashboardRoute />
              </ProtectedRoute>
            } />
            <Route path="profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />

            {/* Protected Routes - Student */}
            <Route path="student">
              <Route path="courses" element={
                <ProtectedRoute allowedRoles={['Student']}>
                  <StudentCourses />
                </ProtectedRoute>
              } />
              <Route path="certificates" element={
                <ProtectedRoute allowedRoles={['Student']}>
                  <Certificates />
                </ProtectedRoute>
              } />
              <Route path="discussions" element={
                <ProtectedRoute allowedRoles={['Student']}>
                  <StudentDiscussions />
                </ProtectedRoute>
              } />
            </Route>

            {/* Course Learning Routes */}
            <Route path="course/:id/learn" element={
              <ProtectedRoute allowedRoles={['Student']}>
                <CourseViewer />
              </ProtectedRoute>
            } />
            <Route path="course/:id/discussion" element={
              <ProtectedRoute>
                <CourseDiscussion />
              </ProtectedRoute>
            } />

            {/* Protected Routes - Instructor */}
            <Route path="instructor">
              <Route path="courses" element={
                <ProtectedRoute allowedRoles={['Instructor']}>
                  <MyCourses />
                </ProtectedRoute>
              } />
              <Route path="create-course" element={
                <ProtectedRoute allowedRoles={['Instructor']}>
                  <CreateCourse />
                </ProtectedRoute>
              } />
              <Route path="course/:id/edit" element={
                <ProtectedRoute allowedRoles={['Instructor']}>
                  <EditCourse />
                </ProtectedRoute>
              } />
              <Route path="course/:courseId/discussions" element={
                <ProtectedRoute allowedRoles={['Instructor']}>
                  <CourseDiscussions />
                </ProtectedRoute>
              } />
              <Route path="students" element={
                <ProtectedRoute allowedRoles={['Instructor']}>
                  <StudentManagement />
                </ProtectedRoute>
              } />
              <Route path="analytics" element={
                <ProtectedRoute allowedRoles={['Instructor']}>
                  <InstructorAnalytics />
                </ProtectedRoute>
              } />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                  <p className="text-gray-600 mb-6">Page not found</p>
                  <a href="/" className="text-primary-600 hover:text-primary-700">
                    Return to Home
                  </a>
                </div>
              </div>
            } />
          </Route>
        </Routes>
        </Suspense>

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        </div>
      </ErrorBoundary>
    </Router>
  );
}

export default App;