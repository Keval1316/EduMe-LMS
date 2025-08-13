import { create } from 'zustand';

const useCourseStore = create((set, get) => ({
  courses: [],
  currentCourse: null,
  enrollments: [],
  loading: false,
  error: null,

  setCourses: (courses) => set({ courses }),
  
  setCurrentCourse: (course) => set({ currentCourse: course }),
  
  setEnrollments: (enrollments) => set({ enrollments }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),

  addCourse: (course) => set((state) => ({
    courses: [course, ...state.courses]
  })),

  updateCourse: (courseId, updatedData) => set((state) => ({
    courses: state.courses.map(course =>
      course._id === courseId ? { ...course, ...updatedData } : course
    ),
    currentCourse: state.currentCourse?._id === courseId
      ? { ...state.currentCourse, ...updatedData }
      : state.currentCourse
  })),

  deleteCourse: (courseId) => set((state) => ({
    courses: state.courses.filter(course => course._id !== courseId),
    currentCourse: state.currentCourse?._id === courseId ? null : state.currentCourse
  })),

  enrollInCourse: (enrollment) => set((state) => ({
    enrollments: [enrollment, ...state.enrollments]
  })),

  updateEnrollmentProgress: (courseId, progress) => set((state) => ({
    enrollments: state.enrollments.map(enrollment =>
      enrollment.course._id === courseId
        ? { ...enrollment, progress }
        : enrollment
    )
  }))
}));

export default useCourseStore;