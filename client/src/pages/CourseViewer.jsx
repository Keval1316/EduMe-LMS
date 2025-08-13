import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle, Play, Award, MessageSquare, Menu, X } from 'lucide-react';
// import ReactPlayer from 'react-player'; // Replaced with native HTML5 video
import { courseApi } from '../api/courseApi';
import { enrollmentApi } from '../api/enrollmentApi';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import QuizComponent from '../components/course/QuizComponent';
import toast from 'react-hot-toast';

const CourseViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [currentLecture, setCurrentLecture] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [requiresGesture, setRequiresGesture] = useState(false);
  const videoRef = useRef(null);
  const currentVideoIdRef = useRef(null);
  const completionNotifiedRef = useRef(new Set()); // Track which lectures have shown completion toast
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseData();
  }, [id]);

  useEffect(() => {
    if (course && enrollment) {
      // Auto-advance to first incomplete lecture
      findNextIncompleteContent();
    }
  }, [course, enrollment]);

  // Update video element when lecture changes
  useEffect(() => {
    if (showQuiz || !videoRef.current) return;
    const vid = course?.sections?.[currentSection]?.lectures?.[currentLecture]?._id;
    if (!vid) return;
    
    // Reset playback state for new lecture
    setPlaying(false);
    setRequiresGesture(true); // require gesture for new lecture
    
    // Reset video element
    const video = videoRef.current;
    video.currentTime = 0;
    video.pause();
    
    // Clear completion notification flag for new lecture
    if (vid) {
      completionNotifiedRef.current.delete(vid);
    }
  }, [course, currentSection, currentLecture, showQuiz]);

  const fetchCourseData = async () => {
    try {
      const [courseResponse, enrollmentResponse] = await Promise.all([
        courseApi.getCourse(id),
        enrollmentApi.getEnrollment(id)
      ]);
      
      setCourse(courseResponse.data);
      // Normalize enrollment payload (API returns { enrolled, enrollment })
      const rawEnrollment = enrollmentResponse?.data?.enrollment ?? enrollmentResponse?.data ?? null;
      if (!rawEnrollment) {
        setEnrollment(null);
      } else {
        // If enrollment is already completed, ensure UI shows 100% and all items completed
        if (rawEnrollment.isCompleted) {
          const fullyCompleted = { ...rawEnrollment };
          // Force progress to 100 for display
          fullyCompleted.progress = 100;

          try {
            // Build full lectureProgress covering all lectures as completed
            const allLectures = (courseResponse.data?.sections || []).flatMap(sec => sec.lectures || []);
            const completedMap = new Map(
              (rawEnrollment.lectureProgress || []).map(lp => [lp.lectureId?.toString?.() || String(lp.lectureId), lp])
            );
            fullyCompleted.lectureProgress = allLectures.map(lec => {
              const key = lec._id?.toString?.() || String(lec._id);
              const existing = completedMap.get(key);
              return existing ? { ...existing, completed: true, completedAt: existing.completedAt || new Date() } : {
                lectureId: lec._id,
                completed: true,
                completedAt: new Date(),
                watchTime: 0
              };
            });

            // Mark all section quizzes as passed for UI purposes if quiz exists
            const sectionsWithQuizzes = (courseResponse.data?.sections || []).filter(s => s.quiz && s.quiz.questions && s.quiz.questions.length > 0);
            const attemptMap = new Map(
              (rawEnrollment.quizAttempts || []).map(qa => [qa.sectionId?.toString?.() || String(qa.sectionId), qa])
            );
            const completedAttempts = sectionsWithQuizzes.map(sec => {
              const key = sec._id?.toString?.() || String(sec._id);
              const existing = attemptMap.get(key);
              return existing ? { ...existing, passed: true, attemptedAt: existing.attemptedAt || new Date() } : {
                sectionId: sec._id,
                answers: [],
                score: 100,
                passed: true,
                attemptedAt: new Date()
              };
            });
            // Keep any attempts from sections without quizzes
            fullyCompleted.quizAttempts = [
              ...completedAttempts,
              ...(rawEnrollment.quizAttempts || []).filter(qa => !sectionsWithQuizzes.find(s => (s._id?.toString?.() || String(s._id)) === (qa.sectionId?.toString?.() || String(qa.sectionId))))
            ];
          } catch {}

          setEnrollment(fullyCompleted);
        } else {
          setEnrollment(rawEnrollment);
        }
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
      navigate('/student/courses');
    } finally {
      setLoading(false);
    }
  };

  const findNextIncompleteContent = () => {
    // If course already completed, keep current indices and avoid jumping
    if (enrollment?.isCompleted) return;
    for (let sectionIdx = 0; sectionIdx < course.sections.length; sectionIdx++) {
      const section = course.sections[sectionIdx];
      
      for (let lectureIdx = 0; lectureIdx < section.lectures.length; lectureIdx++) {
        const lecture = section.lectures[lectureIdx];
        const isCompleted = enrollment.lectureProgress?.find(
          lp => lp.lectureId.toString() === lecture._id.toString()
        )?.completed || false;
        
        if (!isCompleted) {
          setCurrentSection(sectionIdx);
          setCurrentLecture(lectureIdx);
          currentVideoIdRef.current = lecture._id;
          return;
        }
      }
    }
  };

  const markLectureComplete = async (lectureId, watchTime = 0) => {
    try {
      // Ensure watchTime is a valid integer
      const validWatchTime = Math.floor(Math.max(0, watchTime || 0));
      
      const resp = await enrollmentApi.markLectureComplete(id, lectureId, { watchTime: validWatchTime });
      const updated = resp?.data?.enrollment;
      if (updated) {
        setEnrollment(updated);
        try {
          window.dispatchEvent(new CustomEvent('courseProgressUpdated'));
        } catch {}
      } else {
        // Fallback local update if API didn't include updated enrollment
        setEnrollment(prev => ({
          ...prev,
          lectureProgress: [
            ...prev.lectureProgress.filter(lp => lp.lectureId.toString() !== lectureId.toString()),
            {
              lectureId,
              completed: true,
              completedAt: new Date(),
              watchTime: validWatchTime
            }
          ]
        }));
      }
      
      toast.success('Video completed! 🎉');
    } catch (error) {
      console.error('Error marking lecture complete:', error);
      if (error.response?.status === 400) {
        console.error('Bad request details:', error.response.data);
      }
    }
  };

  const handleVideoProgress = (progress) => {
    setVideoProgress(progress.played);
    
    // Auto-mark as complete when 90% watched
    if (progress.played > 0.9) {
      const currentLectureData = course.sections[currentSection].lectures[currentLecture];
      const lectureId = currentLectureData._id;
      
      const isCompleted = enrollment.lectureProgress?.find(
        lp => lp.lectureId.toString() === lectureId.toString()
      )?.completed || false;
      
      // Only mark complete if not already completed AND not already notified
      if (!isCompleted && !completionNotifiedRef.current.has(lectureId)) {
        completionNotifiedRef.current.add(lectureId);
        markLectureComplete(lectureId, progress.playedSeconds);
      }
    }
  };

  const navigateToNext = () => {
    const currentSectionData = course.sections[currentSection];
    
    if (currentLecture < currentSectionData.lectures.length - 1) {
      // Next lecture in same section
      setCurrentLecture(currentLecture + 1);
    } else if (currentSection < course.sections.length - 1) {
      // First lecture of next section
      setCurrentSection(currentSection + 1);
      setCurrentLecture(0);
    } else {
      // Check if there's a quiz for current section
      if (currentSectionData.quiz && currentSectionData.quiz.questions.length > 0) {
        const quizAttempted = enrollment.quizAttempts?.find(
          qa => qa.sectionId.toString() === currentSectionData._id.toString()
        );
        
        if (!quizAttempted) {
          setShowQuiz(true);
          return;
        }
      }
      
      toast.success('Course completed! 🎉');
    }
    
    setVideoProgress(0);
  };

  const navigateToPrevious = () => {
    if (currentLecture > 0) {
      // Previous lecture in same section
      setCurrentLecture(currentLecture - 1);
    } else if (currentSection > 0) {
      // Last lecture of previous section
      setCurrentSection(currentSection - 1);
      setCurrentLecture(course.sections[currentSection - 1].lectures.length - 1);
    }
    
    setVideoProgress(0);
  };

  const selectContent = (sectionIdx, lectureIdx) => {
    setCurrentSection(sectionIdx);
    setCurrentLecture(lectureIdx);
    setShowQuiz(false);
    setSidebarOpen(false);
    setVideoProgress(0);
    setPlaying(false);
    setMuted(true); // allow muted autoplay per browser policy
    setRequiresGesture(true); // require gesture for new lecture
    // track the target video to guard onReady/onError
    try {
      const nextLecture = course?.sections?.[sectionIdx]?.lectures?.[lectureIdx];
      currentVideoIdRef.current = nextLecture?._id || null;
    } catch {}
  };

  const openSectionQuiz = (sectionIdx) => {
    setCurrentSection(sectionIdx);
    setShowQuiz(true);
    setSidebarOpen(false);
    setPlaying(false);
    setRequiresGesture(false);
  };

  // Keep ref in sync if indices change due to other effects
  useEffect(() => {
    const vid = course?.sections?.[currentSection]?.lectures?.[currentLecture]?._id;
    if (vid) currentVideoIdRef.current = vid;
  }, [course, currentSection, currentLecture]);

  const isLectureCompleted = (lectureId) => {
    if (enrollment?.isCompleted) return true;
    return enrollment?.lectureProgress?.find(
      lp => lp.lectureId.toString() === lectureId.toString()
    )?.completed || false;
  };

  const isQuizCompleted = (sectionId) => {
    if (enrollment?.isCompleted) return true;
    return enrollment?.quizAttempts?.find(
      qa => qa.sectionId.toString() === sectionId.toString()
    ) || false;
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="mt-20" />;
  }

  if (!course || !enrollment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-600 mt-2">You need to be enrolled in this course to access the content.</p>
      </div>
    );
  }

  const currentSectionData = course.sections[currentSection];
  const currentLectureData = showQuiz ? null : currentSectionData?.lectures[currentLecture];

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 truncate">Course Content</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {course.sections.map((section, sectionIdx) => (
              <div key={section._id} className="border border-gray-200 rounded-lg">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900">
                    Section {sectionIdx + 1}: {section.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {section.lectures.length} lectures
                    {section.quiz?.questions?.length > 0 && ' • 1 quiz'}
                  </p>
                </div>
                
                <div className="p-2">
                  {section.lectures.map((lecture, lectureIdx) => {
                    const isCompleted = isLectureCompleted(lecture._id);
                    const isCurrent = sectionIdx === currentSection && lectureIdx === currentLecture && !showQuiz;
                    
                    return (
                      <button
                        key={lecture._id}
                        onClick={() => selectContent(sectionIdx, lectureIdx)}
                        className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                          isCurrent
                            ? 'bg-primary-100 border-primary-300'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center">
                          {isCompleted ? (
                            <CheckCircle size={20} className="text-green-500 mr-3 flex-shrink-0" />
                          ) : (
                            <Play size={20} className="text-gray-400 mr-3 flex-shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-medium truncate ${
                              isCurrent ? 'text-primary-700' : 'text-gray-900'
                            }`}>
                              {lectureIdx + 1}. {lecture.title}
                            </p>
                            {lecture.duration && (
                              <p className="text-xs text-gray-500">
                                {Math.floor(lecture.duration / 60)}:{(lecture.duration % 60).toString().padStart(2, '0')}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  
                  {section.quiz && section.quiz.questions.length > 0 && (
                    <button
                      onClick={() => openSectionQuiz(sectionIdx)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        showQuiz && sectionIdx === currentSection
                          ? 'bg-blue-100 border-blue-300'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        {isQuizCompleted(section._id) ? (
                          <CheckCircle size={20} className="text-green-500 mr-3 flex-shrink-0" />
                        ) : (
                          <Award size={20} className="text-blue-500 mr-3 flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium ${
                            showQuiz && sectionIdx === currentSection ? 'text-blue-700' : 'text-gray-900'
                          }`}>
                            Section Quiz
                          </p>
                          <p className="text-xs text-gray-500">
                            {section.quiz.questions.length} questions
                          </p>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Progress Summary */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-sm text-gray-600 mb-2">
            Course Progress: {enrollment?.isCompleted ? 100 : enrollment?.progress}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${enrollment?.isCompleted ? 100 : enrollment?.progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 mr-4"
            >
              <Menu size={20} />
            </button>
            
            <div>
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {showQuiz ? `Section ${currentSection + 1} Quiz` : currentLectureData?.title}
              </h1>
              <p className="text-sm text-gray-600">
                {currentSectionData?.title}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {course.hasGroupDiscussion && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/course/${id}/discussion`)}
              >
                <MessageSquare size={16} className="mr-2" />
                Discussion
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/student/courses')}
            >
              Exit Course
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {showQuiz ? (
            <div className="h-full overflow-y-auto">
              <QuizComponent
                quiz={currentSectionData.quiz}
                courseId={id}
                sectionId={currentSectionData._id}
                existingAttempt={enrollment?.quizAttempts?.find(
                  qa => qa.sectionId.toString() === currentSectionData._id.toString()
                )}
                onComplete={() => {
                  setShowQuiz(false);
                  fetchCourseData(); // Refresh enrollment data
                  // Trigger a dashboard refresh by dispatching a custom event
                  try {
                    window.dispatchEvent(new CustomEvent('courseProgressUpdated'));
                  } catch (e) {
                    // Fallback for older browsers
                    console.debug('Course progress updated');
                  }
                }}
              />
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Video Player */}
              <div className="relative flex-1 min-h-[320px] bg-black flex items-center justify-center">
                {currentLectureData?.videoUrl ? (
                  (() => { try { console.debug('Playing lecture URL:', currentLectureData.videoUrl); } catch {} return null; })()
                  ||
                  <video
                    ref={videoRef}
                    src={currentLectureData.videoUrl}
                    controls
                    muted={muted}
                    playsInline
                    controlsList="nodownload"
                    crossOrigin="anonymous"
                    style={{ width: '100%', height: '100%', backgroundColor: 'black' }}
                    onPlay={() => {
                      setRequiresGesture(false);
                      setPlaying(true);
                    }}
                    onPause={() => {
                      setPlaying(false);
                    }}
                    onTimeUpdate={(e) => {
                      const video = e.target;
                      if (video.duration > 0) {
                        const progress = {
                          played: video.currentTime / video.duration,
                          playedSeconds: video.currentTime
                        };
                        handleVideoProgress(progress);
                      }
                    }}
                    onError={(e) => {
                      console.error('Native video load error:', e?.currentTarget?.error, currentLectureData?.videoUrl);
                      setRequiresGesture(true);
                    }}
                    onLoadedData={() => {
                      console.debug('Video loaded successfully:', currentLectureData.videoUrl);
                    }}
                  />
                ) : (
                  <div className="text-white text-center p-6">
                    <Play size={64} className="mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No video available for this lecture</p>
                    <p className="text-sm text-gray-300 mt-2">Ask the instructor to upload a video file for this lecture.</p>
                  </div>
                )}

                {/* Overlay requiring user gesture when autoplay is blocked */}
                {requiresGesture && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <button
                      className="px-6 py-3 rounded-full bg-white text-gray-900 font-semibold shadow hover:shadow-md transition"
                      onClick={() => {
                        setRequiresGesture(false);
                        setMuted(false);
                        if (videoRef.current) {
                          videoRef.current.muted = false;
                          videoRef.current.play().catch(e => {
                            console.warn('Play failed:', e);
                          });
                        }
                      }}
                    >
                      Click to Play
                    </button>
                  </div>
                )}

                {/* Unmute helper when playing muted */}
                {playing && muted && !requiresGesture && (
                  <div className="absolute bottom-4 right-4">
                    <button
                      className="px-3 py-1.5 rounded bg-white/90 text-gray-900 text-sm font-medium shadow hover:bg-white transition"
                      onClick={() => {
                        setMuted(false);
                        if (videoRef.current) {
                          videoRef.current.muted = false;
                        }
                      }}
                    >
                      Unmute
                    </button>
                  </div>
                )}


              </div>

              {/* Lecture Info */}
              <div className="bg-white border-t border-gray-200 p-6">
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {currentLectureData?.title}
                  </h2>
                  {currentLectureData?.description && (
                    <p className="text-gray-600 mb-4">
                      {currentLectureData.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {!isLectureCompleted(currentLectureData?._id) && (
                        <Button
                          size="sm"
                          onClick={() => markLectureComplete(currentLectureData._id)}
                        >
                          <CheckCircle size={16} className="mr-2" />
                          Mark as Complete
                        </Button>
                      )}
                      
                      {isLectureCompleted(currentLectureData?._id) && (
                        <span className="flex items-center text-green-600 text-sm font-medium">
                          <CheckCircle size={16} className="mr-2" />
                          Completed
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={navigateToPrevious}
                        disabled={currentSection === 0 && currentLecture === 0}
                      >
                        <ChevronLeft size={16} className="mr-2" />
                        Previous
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={navigateToNext}
                        disabled={
                          currentSection === course.sections.length - 1 &&
                          currentLecture === course.sections[currentSection].lectures.length - 1
                        }
                      >
                        Next
                        <ChevronRight size={16} className="ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default CourseViewer;