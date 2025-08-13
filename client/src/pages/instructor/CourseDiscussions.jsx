import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Reply, Clock, User, AlertCircle, Send, Edit, Trash2, Check } from 'lucide-react';
import { discussionApi } from '../../api/discussionApi';
import useAuthStore from '../../store/authStore';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

const CourseDiscussions = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [discussions, setDiscussions] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [editingReply, setEditingReply] = useState(null);
  const [editText, setEditText] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, discussion: null });
  const [filter, setFilter] = useState('all'); // all, unanswered, answered

  useEffect(() => {
    fetchDiscussions();
  }, [courseId]);

  const fetchDiscussions = async () => {
    try {
      const response = await discussionApi.getInstructorDiscussions(courseId);
      setDiscussions(response.data.discussions);
      setCourse(response.data.course);
    } catch (error) {
      console.error('Error fetching discussions:', error);
      if (error.response?.status === 403) {
        toast.error('Access denied. You must be the instructor of this course.');
        navigate('/instructor/courses');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (discussionId) => {
    if (!replyText.trim()) return;

    try {
      const response = await discussionApi.createDiscussion(courseId, {
        message: replyText,
        parentMessage: discussionId
      });

      // Update the discussion with the new reply
      setDiscussions(discussions.map(discussion => {
        if (discussion._id === discussionId) {
          return {
            ...discussion,
            replies: [...discussion.replies, response.data.discussion],
            needsResponse: false
          };
        }
        return discussion;
      }));

      setReplyingTo(null);
      setReplyText('');
      toast.success('Reply posted successfully');
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply');
    }
  };

  const handleEditReply = async (replyId) => {
    if (!editText.trim()) return;

    try {
      await discussionApi.updateDiscussion(replyId, { message: editText });
      
      // Update the reply in the discussions
      setDiscussions(discussions.map(discussion => ({
        ...discussion,
        replies: discussion.replies.map(reply =>
          reply._id === replyId ? { ...reply, message: editText } : reply
        )
      })));

      setEditingReply(null);
      setEditText('');
      toast.success('Reply updated successfully');
    } catch (error) {
      console.error('Error updating reply:', error);
      toast.error('Failed to update reply');
    }
  };

  const handleDeleteDiscussion = async () => {
    try {
      await discussionApi.deleteDiscussion(deleteModal.discussion._id);
      setDiscussions(discussions.filter(d => d._id !== deleteModal.discussion._id));
      setDeleteModal({ isOpen: false, discussion: null });
      toast.success('Discussion deleted successfully');
    } catch (error) {
      console.error('Error deleting discussion:', error);
      toast.error('Failed to delete discussion');
    }
  };

  const filteredDiscussions = discussions.filter(discussion => {
    if (filter === 'unanswered') return discussion.needsResponse;
    if (filter === 'answered') return !discussion.needsResponse;
    return true;
  });

  const formatTimeAgo = (date) => {
    const now = new Date();
    const discussionDate = new Date(date);
    const diffInHours = Math.floor((now - discussionDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="mt-20" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/instructor/courses')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Course Discussions</h1>
            <p className="text-gray-600">{course?.title}</p>
          </div>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({discussions.length})
          </button>
          <button
            onClick={() => setFilter('unanswered')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'unanswered'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Unanswered ({discussions.filter(d => d.needsResponse).length})
          </button>
          <button
            onClick={() => setFilter('answered')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'answered'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Answered ({discussions.filter(d => !d.needsResponse).length})
          </button>
        </div>
      </div>

      {/* Discussions List */}
      {filteredDiscussions.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-white rounded-lg shadow p-8">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'unanswered' ? 'No unanswered questions' : 
               filter === 'answered' ? 'No answered questions' : 'No discussions yet'}
            </h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'Students haven\'t asked any questions yet.'
                : filter === 'unanswered'
                ? 'Great job! You\'ve answered all student questions.'
                : 'No questions have been answered yet.'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDiscussions.map((discussion) => (
            <div key={discussion._id} className="bg-white rounded-lg shadow">
              {/* Main Discussion */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">
                          {discussion.author.fullName}
                        </h3>
                        <span className="text-xs text-gray-500">Student</span>
                        {discussion.needsResponse && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertCircle size={12} className="mr-1" />
                            Needs Response
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                        <Clock size={14} />
                        <span>{formatTimeAgo(discussion.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setDeleteModal({ isOpen: true, discussion })}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete Discussion"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="ml-13">
                  <p className="text-gray-800 whitespace-pre-wrap">{discussion.message}</p>
                </div>

                {/* Replies */}
                {discussion.replies.length > 0 && (
                  <div className="mt-6 ml-13 space-y-4">
                    {discussion.replies.map((reply) => (
                      <div key={reply._id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              reply.author.role === 'instructor' 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-blue-100 text-blue-600'
                            }`}>
                              <User size={16} />
                            </div>
                            <div>
                              <span className="font-medium text-gray-900">
                                {reply.author.fullName}
                              </span>
                              <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                                reply.author.role === 'instructor'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {reply.author.role === 'instructor' ? 'Instructor' : 'Student'}
                              </span>
                            </div>
                          </div>
                          
                          {reply.author._id === user.id && (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => {
                                  setEditingReply(reply._id);
                                  setEditText(reply.message);
                                }}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Edit Reply"
                              >
                                <Edit size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                          <Clock size={12} />
                          <span>{formatTimeAgo(reply.createdAt)}</span>
                        </div>

                        {editingReply === reply._id ? (
                          <div className="space-y-3">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                              rows="3"
                              placeholder="Edit your reply..."
                            />
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleEditReply(reply._id)}
                                disabled={!editText.trim()}
                              >
                                <Check size={14} className="mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingReply(null);
                                  setEditText('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-700 whitespace-pre-wrap">{reply.message}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                {replyingTo === discussion._id ? (
                  <div className="mt-6 ml-13">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Reply size={16} className="text-blue-600" />
                        <span className="font-medium text-blue-900">Reply as Instructor</span>
                      </div>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        rows="3"
                        placeholder="Type your reply to help this student..."
                      />
                      <div className="flex space-x-2 mt-3">
                        <Button
                          size="sm"
                          onClick={() => handleReply(discussion._id)}
                          disabled={!replyText.trim()}
                        >
                          <Send size={14} className="mr-1" />
                          Post Reply
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 ml-13">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setReplyingTo(discussion._id)}
                      className="flex items-center"
                    >
                      <Reply size={14} className="mr-1" />
                      Reply
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, discussion: null })}
        title="Delete Discussion"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this discussion? This will also delete all replies. This action cannot be undone.
          </p>
          <div className="flex space-x-4 justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ isOpen: false, discussion: null })}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteDiscussion}
            >
              Delete Discussion
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CourseDiscussions;
