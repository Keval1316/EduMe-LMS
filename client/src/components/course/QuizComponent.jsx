import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Award, RotateCcw } from 'lucide-react';
import { enrollmentApi } from '../../api/enrollmentApi';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

const QuizComponent = ({ quiz, courseId, sectionId, onComplete, existingAttempt }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // Initialize with existing attempt if available
  useEffect(() => {
    if (existingAttempt) {
      setSubmitted(true);
      setResults({
        score: existingAttempt.score,
        passed: existingAttempt.passed,
        correctAnswers: existingAttempt.correctAnswers || Math.round((existingAttempt.score / 100) * quiz.questions.length),
        totalQuestions: quiz.questions.length
      });
      
      // Reconstruct answers from existing attempt
      const reconstructedAnswers = {};
      existingAttempt.answers?.forEach((answer, index) => {
        reconstructedAnswers[index] = answer.selectedOption;
      });
      setAnswers(reconstructedAnswers);
    }
  }, [existingAttempt, quiz.questions.length]);

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    if (submitted) return;
    
    setAnswers({
      ...answers,
      [questionIndex]: optionIndex
    });
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    const unansweredQuestions = quiz.questions.filter((_, index) => answers[index] === undefined);
    
    if (unansweredQuestions.length > 0) {
      toast.error('Please answer all questions before submitting');
      return;
    }

    setLoading(true);
    try {
      const answersArray = quiz.questions.map((_, index) => answers[index]);
      const response = await enrollmentApi.submitQuiz(courseId, sectionId, {
        answers: answersArray
      });
      
      setResults(response.data);
      setSubmitted(true);
      
      const retakeMessage = response.data.isRetake ? ' (Updated Score)' : '';
      if (response.data.passed) {
        toast.success(`Quiz passed! Score: ${response.data.score}%${retakeMessage}`);
      } else {
        toast.error(`Quiz failed. Score: ${response.data.score}% (Required: ${quiz.passingScore}%)${retakeMessage}`);
      }

      // Notify other parts of the app that progress may have changed or course may have completed
      try {
        window.dispatchEvent(new CustomEvent('courseProgressUpdated'));
      } catch {}
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setSubmitted(false);
    setResults(null);
  };

  const handleContinue = () => {
    onComplete();
  };

  const goToQuestion = (index) => {
    setCurrentQuestion(index);
  };

  const nextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const getOptionStatus = (questionIndex, optionIndex) => {
    if (!submitted) return '';
    
    const question = quiz.questions[questionIndex];
    const userAnswer = answers[questionIndex];
    const correctAnswer = question.options.findIndex(opt => opt.isCorrect);
    
    if (optionIndex === correctAnswer) {
      return 'correct';
    } else if (optionIndex === userAnswer && optionIndex !== correctAnswer) {
      return 'incorrect';
    }
    return '';
  };

  const getQuestionStatus = (index) => {
    if (answers[index] !== undefined) {
      if (submitted) {
        const question = quiz.questions[index];
        const userAnswer = answers[index];
        const correctAnswer = question.options.findIndex(opt => opt.isCorrect);
        return userAnswer === correctAnswer ? 'correct' : 'incorrect';
      }
      return 'answered';
    }
    return 'unanswered';
  };

  if (submitted && results) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            {results.passed ? (
              <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
            ) : (
              <XCircle size={64} className="text-red-500 mx-auto mb-4" />
            )}
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Quiz {results.passed ? 'Passed!' : 'Not Passed'}
            </h2>
            
            <div className="text-lg text-gray-600 mb-4">
              Your Score: <span className="font-bold">{results.score}%</span>
            </div>
            
            <div className="text-sm text-gray-500 mb-6">
              You got {results.correctAnswers} out of {results.totalQuestions} questions correct
              <br />
              Passing score: {quiz.passingScore}%
            </div>
          </div>

          <div className="space-y-4">
            {results.passed ? (
              <Button onClick={handleContinue} size="lg">
                <Award size={20} className="mr-2" />
                Continue Course
              </Button>
            ) : (
              <div className="space-x-4">
                <Button onClick={handleRetake} variant="outline" size="lg">
                  <RotateCcw size={20} className="mr-2" />
                  {existingAttempt ? 'Retake Quiz' : 'Retake Quiz'}
                </Button>
                <Button onClick={handleContinue} size="lg">
                  Continue Course
                </Button>
              </div>
            )}
          </div>

          {/* Review Answers */}
          <div className="mt-8 text-left">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {existingAttempt ? 'Your Previous Answers' : 'Review Your Answers'}
            </h3>
            <div className="space-y-6">
              {quiz.questions.map((question, qIndex) => {
                const userAnswer = answers[qIndex];
                const correctAnswer = question.options.findIndex(opt => opt.isCorrect);
                const isCorrect = userAnswer === correctAnswer;

                return (
                  <div key={qIndex} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start mb-3">
                      <div className="flex-shrink-0 mr-3">
                        {isCorrect ? (
                          <CheckCircle size={20} className="text-green-500" />
                        ) : (
                          <XCircle size={20} className="text-red-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Question {qIndex + 1}: {question.question}
                        </h4>
                        
                        <div className="space-y-2">
                          {question.options.map((option, oIndex) => (
                            <div
                              key={oIndex}
                              className={`p-2 rounded ${
                                oIndex === correctAnswer
                                  ? 'bg-green-100 border-green-300'
                                  : oIndex === userAnswer && !isCorrect
                                  ? 'bg-red-100 border-red-300'
                                  : 'bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center">
                                <span className="mr-2">
                                  {oIndex === correctAnswer ? '✓' : 
                                   oIndex === userAnswer ? '✗' : '○'}
                                </span>
                                {option.text}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {question.explanation && (
                          <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-300">
                            <p className="text-sm text-blue-800">
                              <span className="font-medium">Explanation:</span> {question.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Quiz Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Section Quiz</h2>
              <p className="text-gray-600">
                {quiz.questions.length} questions • Passing score: {quiz.passingScore}%
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500">Progress</div>
              <div className="text-lg font-semibold text-gray-900">
                {currentQuestion + 1} / {quiz.questions.length}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Navigation */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex flex-wrap gap-2">
            {quiz.questions.map((_, index) => {
              const status = getQuestionStatus(index);
              return (
                <button
                  key={index}
                  onClick={() => goToQuestion(index)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    index === currentQuestion
                      ? 'bg-primary-600 text-white'
                      : status === 'answered'
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : status === 'correct'
                      ? 'bg-green-500 text-white'
                      : status === 'incorrect'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Question {currentQuestion + 1}: {quiz.questions[currentQuestion].question}
            </h3>
            
            <div className="space-y-3">
              {quiz.questions[currentQuestion].options.map((option, optionIndex) => {
                const status = getOptionStatus(currentQuestion, optionIndex);
                const isSelected = answers[currentQuestion] === optionIndex;
                
                return (
                  <label
                    key={optionIndex}
                    className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      submitted
                        ? status === 'correct'
                          ? 'border-green-300 bg-green-50'
                          : status === 'incorrect'
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 bg-gray-50'
                        : isSelected
                        ? 'border-primary-300 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name={`question-${currentQuestion}`}
                        value={optionIndex}
                        checked={isSelected}
                        onChange={() => handleAnswerSelect(currentQuestion, optionIndex)}
                        disabled={submitted}
                        className="h-4 w-4 text-primary-600 border-gray-300"
                      />
                      <span className="ml-3 text-gray-900">{option.text}</span>
                      {submitted && status === 'correct' && (
                        <CheckCircle size={16} className="ml-auto text-green-500" />
                      )}
                      {submitted && status === 'incorrect' && (
                        <XCircle size={16} className="ml-auto text-red-500" />
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={previousQuestion}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>
            
            <div className="flex space-x-3">
              {currentQuestion < quiz.questions.length - 1 ? (
                <Button onClick={nextQuestion}>
                  Next Question
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={loading || Object.keys(answers).length !== quiz.questions.length}
                >
                  Submit Quiz
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizComponent;