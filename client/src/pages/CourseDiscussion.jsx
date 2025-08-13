import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Plus, Reply, Edit, Trash2, Send, ArrowLeft, User, Clock, CheckCircle } from 'lucide-react';
import { discussionApi } from '../api/discussionApi';
import { courseApi } from '../api/courseApi';
import { enrollmentApi } from '../api/enrollmentApi';
import useAuthStore from '../store/authStore';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';

const CourseDiscussion = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, discussion: null });

  useEffect(() => {
    const initializeData = async () => {
      await fetchCourseData();
      if (user?.role === 'Student') {
        await checkEnrollment();
      }
      setLoading(false);
    };
    
    initializeData();
  }, [id]);

  // Check access after course and enrollment data are loaded
  useEffect(() => {
    if (!loading && course) {
      if (!checkAccess()) {
        navigate(`/course/${id}`);
        toast.error('You must be enrolled in this course to access discussions');
        return;
      }
      // Only fetch discussions if access is granted
      fetchDiscussions();
    }
  }, [loading, course, enrollment]);

  const fetchCourseData = async () => {
    try {
      const response = await courseApi.getCourse(id);
      setCourse(response.data);
    } catch (error) {
      console.error('Error fetching course:', error);
      navigate('/courses');
    }
  };

  const checkEnrollment = async () => {
    try {
      const response = await enrollmentApi.getEnrollment(id);
      const data = response.data;
      if (data && typeof data.enrolled === 'boolean') {
        setEnrollment(data.enrolled ? data.enrollment : null);
      } else {
        // Backward compatibility if API returns raw enrollment
        setEnrollment(data || null);
      }
    } catch (error) {
      // If request fails (e.g., unauthorized), treat as not enrolled
      setEnrollment(null);
    }
  };

  const checkAccess = () => {
    if (!course) return false;
    
    // If user is instructor of this course, allow access
    if (user?.role === 'Instructor' && course.instructor._id === user.id) {
      return true;
    }
    
    // If user is student and enrolled, allow access
    if (user?.role === 'Student' && enrollment) {
      return true;
    }
    
    return false;
  };

  const fetchDiscussions = async () => {
    try {
      const response = await discussionApi.getDiscussions(id);
      setDiscussions(response.data.discussions);
    } catch (error) {
      console.error('Error fetching discussions:', error);
      if (error.response?.status === 403) {
        toast.error('Access denied to discussions');
        navigate(`/course/${id}`);
      }
    }
  };

  const handleCreateMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await discussionApi.createDiscussion(id, {
        message: newMessage,
        parentMessage: replyingTo?.id || null
      });

      if (replyingTo) {
        // Update the parent discussion with the new reply
        setDiscussions(discussions.map(discussion => {
          if (discussion._id === replyingTo.id) {
            return {
              ...discussion,
              replies: [...discussion.replies, response.data.discussion]
            };
          }
          return discussion;
        }));
        setReplyingTo(null);
      } else {
        // Add new main discussion
        setDiscussions([response.data.discussion, ...discussions]);
      }

      setNewMessage('');
      toast.success('Message posted successfully');
    } catch (error) {
      console.error('Error creating message:', error);
    }
  };

  const handleEditMessage = async (discussionId, newText) => {
    try {
      await discussionApi.updateDiscussion(discussionId, { message: newText });
      
      // Update local state
      setDiscussions(discussions.map(discussion => {
        if (discussion._id === discussionId) {
          return { ...discussion, message: newText };
        }
        
        // Check replies
        if (discussion.replies) {
          return {
            ...discussion,
            replies: discussion.replies.map(reply =>
              reply._id === discussionId ? { ...reply, message: newText } : reply
            )
          };
        }
        
        return discussion;
      }));

      setEditingMessage(null);
      toast.success('Message updated successfully');
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  const handleDeleteMessage = async () => {
    try {
      await discussionApi.deleteDiscussion(deleteModal.discussion._id);
      
      // Remove from local state
      if (deleteModal.discussion.parentMessage) {
        // It's a reply
        setDiscussions(discussions.map(discussion => ({
          ...discussion,
          replies: discussion.replies.filter(reply => reply._id !== deleteModal.discussion._id)
        })));
      } else {
        // It's a main discussion
        setDiscussions(discussions.filter(d => d._id !== deleteModal.discussion._id));
      }

      setDeleteModal({ isOpen: false, discussion: null });
      toast.success('Message deleted successfully');
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const MessageItem = ({ discussion, isReply = false }) => {
    const isOwner = discussion.author._id === user?.id;
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(discussion.message);

    const handleEdit = () => {
      setIsEditing(true);
      setEditText(discussion.message);
    };

    const handleSaveEdit = () => {
      handleEditMessage(discussion._id, editText);
      setIsEditing(false);
    };

    const handleCancelEdit = () => {
      setIsEditing(false);
      setEditText(discussion.message);
    };

    return (
      <div className={`${isReply ? 'ml-12 mt-4' : 'mb-6'} bg-white rounded-lg shadow p-6`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-semibold">
                {discussion.author.fullName.charAt(0)}
              </span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                {discussion.author.fullName}
                {discussion.author.role === 'Instructor' && (
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    Instructor
                  </span>
                )}
              </h4>
              <p className="text-sm text-gray-500">{formatDate(discussion.createdAt)}</p>
            </div>
          </div>
          
          {isOwner && (
            <div className="flex space-x-2">
              <button
                onClick={handleEdit}
                className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => setDeleteModal({ isOpen: true, discussion })}
                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
            />
            <div className="flex space-x-2">
              <Button size="sm" onClick={handleSaveEdit}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-gray-700 mb-4 whitespace-pre-wrap">{discussion.message}</p>
            
            {!isReply && (
              <button
                onClick={() => setReplyingTo({ id: discussion._id, author: discussion.author.fullName })}
                className="flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                <Reply size={16} className="mr-1" />
                Reply
              </button>
            )}
          </>
        )}

        {/* Replies */}
        {!isReply && discussion.replies && discussion.replies.length > 0 && (
          <div className="mt-6 space-y-4">
            {discussion.replies.map((reply) => (
              <MessageItem key={reply._id} discussion={reply} isReply={true} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="mt-20" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/course/${id}`)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Course Discussion</h1>
              <p className="text-gray-600">{course?.title}</p>
            </div>
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <MessageSquare size={16} className="mr-2" />
            {discussions.length} discussions
          </div>
        </div>
      </div>

      {/* New Message Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {replyingTo ? `Reply to ${replyingTo.author}` : 'Start a New Discussion'}
        </h3>
        
        {replyingTo && (
          <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-300 rounded">
            <p className="text-sm text-blue-800">
              Replying to {replyingTo.author}
            </p>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-xs text-blue-600 hover:text-blue-700 mt-1"
            >
              Cancel reply
            </button>
          </div>
        )}
        
        <form onSubmit={handleCreateMessage} className="space-y-4">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={replyingTo ? 'Write your reply...' : 'Share your thoughts, ask questions, or help other students...'}
            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={4}
            required
          />
          
          <div className="flex justify-end">
            <Button type="submit" disabled={!newMessage.trim()}>
              <Send size={16} className="mr-2" />
              {replyingTo ? 'Reply' : 'Post Message'}
            </Button>
          </div>
        </form>
      </div>

      {/* Discussion List */}
      <div className="space-y-6">
        {discussions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No discussions yet</h3>
            <p className="text-gray-600 mb-6">
              Be the first to start a discussion about this course
            </p>
          </div>
        ) : (
          discussions.map((discussion) => (
            <MessageItem key={discussion._id} discussion={discussion} />
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, discussion: null })}
        title="Delete Message"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this message? This action cannot be undone.
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
              onClick={handleDeleteMessage}
            >
              Delete Message
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CourseDiscussion;