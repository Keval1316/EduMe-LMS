import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { authApi } from '../../api/authApi';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const InterestSelection = () => {
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { updateInterests } = useAuthStore();

  const interests = [
    'AI',
    'Machine Learning',
    'Web Development',
    'Data Science',
    'Mobile Development',
    'DevOps',
    'Cybersecurity',
    'UI/UX Design'
  ];

  const toggleInterest = (interest) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async () => {
    if (selectedInterests.length === 0) {
      toast.error('Please select at least one interest');
      return;
    }

    setLoading(true);
    try {
      await authApi.updateInterests(selectedInterests);
      updateInterests(selectedInterests);
      toast.success('Interests updated successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Update interests error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            What are you interested in learning?
          </h2>
          <p className="mt-2 text-gray-600">
            Help us recommend the best courses for you
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {interests.map((interest) => (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedInterests.includes(interest)
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="font-medium">{interest}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={loading || selectedInterests.length === 0}
            size="lg"
          >
            Continue ({selectedInterests.length} selected)
          </Button>
          <Button
            onClick={handleSkip}
            variant="outline"
            size="lg"
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterestSelection;