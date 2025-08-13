import React from 'react';
import { Star, StarHalf } from 'lucide-react';

const StarRating = ({ 
  rating = 0, 
  onRatingChange = null, 
  size = 20, 
  readonly = false,
  showValue = false,
  className = ""
}) => {
  const handleStarClick = (starIndex) => {
    if (readonly || !onRatingChange) return;
    onRatingChange(starIndex + 1);
  };

  const renderStar = (index) => {
    const starValue = index + 1;
    const isFilled = rating >= starValue;
    const isHalfFilled = rating >= starValue - 0.5 && rating < starValue;
    
    return (
      <button
        key={index}
        type="button"
        className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} 
                   transition-transform duration-150 ${className}`}
        onClick={() => handleStarClick(index)}
        disabled={readonly}
      >
        {isFilled ? (
          <Star 
            size={size} 
            className="fill-yellow-400 text-yellow-400" 
          />
        ) : isHalfFilled ? (
          <StarHalf 
            size={size} 
            className="fill-yellow-400 text-yellow-400" 
          />
        ) : (
          <Star 
            size={size} 
            className="text-gray-300 hover:text-yellow-400 transition-colors" 
          />
        )}
      </button>
    );
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[0, 1, 2, 3, 4].map(renderStar)}
      </div>
      {showValue && (
        <span className="ml-2 text-sm text-gray-600 font-medium">
          {rating > 0 ? rating.toFixed(1) : '0.0'}
        </span>
      )}
    </div>
  );
};

export default StarRating;
