import React, { useState, useEffect } from 'react';
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import StarRating from './StarRating';
import { reviewApi } from '../api/reviewApi';
import { toast } from 'react-hot-toast';

const ReviewList = ({ courseId, className = "" }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const fetchReviews = async (page = 1) => {
    try {
      setLoading(true);
      const response = await reviewApi.getCourseReviews(courseId, {
        page,
        limit: 5
      });
      
      if (page === 1) {
        setReviews(response.data.reviews);
      } else {
        setReviews(prev => [...prev, ...response.data.reviews]);
      }
      
      setPagination(response.data.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('Failed to load reviews');
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [courseId]);

  const loadMore = () => {
    if (pagination?.hasNext) {
      fetchReviews(currentPage + 1);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && reviews.length === 0) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="w-24 h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="w-32 h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-3 bg-gray-200 rounded"></div>
                <div className="w-3/4 h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500">No reviews yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Be the first to share your experience!
        </p>
      </div>
    );
  }

  const displayedReviews = expanded ? reviews : reviews.slice(0, 3);

  return (
    <div className={className}>
      <div className="space-y-4">
        {displayedReviews.map((review) => (
          <div key={review._id} className="border border-gray-200 rounded-lg p-4 bg-white">
            {/* Review Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {review.student?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {review.student?.name || 'Anonymous'}
                  </p>
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} readonly size={14} />
                    <span className="text-xs text-gray-500">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Review Comment */}
            <p className="text-gray-700 leading-relaxed">
              {review.comment}
            </p>

            {/* Updated indicator */}
            {review.updatedAt !== review.createdAt && (
              <p className="text-xs text-gray-400 mt-2">
                Updated {formatDate(review.updatedAt)}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {reviews.length > 3 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 mx-auto px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp size={16} />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                Show More ({reviews.length - 3} more)
              </>
            )}
          </button>
        </div>
      )}

      {/* Load More Button */}
      {expanded && pagination?.hasNext && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More Reviews'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewList;
