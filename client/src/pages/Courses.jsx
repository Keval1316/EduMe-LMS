import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Star, Users, Clock, ChevronDown } from 'lucide-react';
import { courseApi } from '../api/courseApi';
import { getRecommendedCourses } from '../api/recommendationApi';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import StarRating from '../components/StarRating';
import useAuthStore from '../store/authStore';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [recommendedLoading, setRecommendedLoading] = useState(false);
  const [showAllRecommended, setShowAllRecommended] = useState(false);
  // Advanced filter state
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [hasCertificate, setHasCertificate] = useState(false);
  const [hasGroupDiscussion, setHasGroupDiscussion] = useState(false);
  const [interestInput, setInterestInput] = useState(
    () => (JSON.parse(localStorage.getItem('userInterests')) || ['Web Development', 'Data Science', 'Python']).join(', ')
  );
  const { user } = useAuthStore();

  const categories = [
    'Web Development',
    'Data Science', 
    'AI & Machine Learning',
    'Mobile Development',
    'DevOps',
    'Cybersecurity',
    'UI/UX Design',
    'Business',
    'Marketing'
  ];

  const levels = ['Beginner', 'Intermediate', 'Advanced'];

  // Helpers for recommended course thumbnail styling
  const getPastelBgClass = (seed) => {
    const colors = [
      'bg-yellow-100',
      'bg-blue-100',
      'bg-green-100',
      'bg-pink-100',
      'bg-purple-100',
      'bg-red-100',
      'bg-indigo-100',
      'bg-teal-100',
    ];
    const hash = (seed || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Apply current search and filters to recommended list and limit to 12 cards
  const filteredRecommended = useMemo(() => {
    const all = Array.isArray(recommendedCourses) ? [...recommendedCourses] : [];
    let filtered = [...all];

    const term = (searchTerm || '').trim().toLowerCase();
    if (term) {
      filtered = filtered.filter((c) =>
        (c.course_title && c.course_title.toLowerCase().includes(term)) ||
        (c.subject && c.subject.toLowerCase().includes(term))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((c) => c.subject === selectedCategory);
    }

    if (selectedLevel) {
      filtered = filtered.filter((c) => String(c.level).toLowerCase() === String(selectedLevel).toLowerCase());
    }

    if (minPrice) {
      const min = Number(minPrice);
      filtered = filtered.filter((c) => Number(c.price) >= min);
    }

    if (maxPrice) {
      const max = Number(maxPrice);
      filtered = filtered.filter((c) => Number(c.price) <= max);
    }

    if (minRating) {
      const mr = Number(minRating);
      filtered = filtered.filter((c) => Number(c.rating || 0) >= mr);
    }

    // Primary: items that match filters
    let result = filtered;

    // Fill: if fewer than 12, append from full list excluding already included
    if (result.length < 12 && all.length > 0) {
      const have = new Set(result.map((c) => c.course_id ?? c.id));
      const fillers = all.filter((c) => !have.has(c.course_id ?? c.id)).slice(0, 12 - result.length);
      result = result.concat(fillers);
    }

    // Show 12 initially, or all if "Explore More" was clicked
    return showAllRecommended ? result : result.slice(0, 12);
  }, [
    recommendedCourses,
    searchTerm,
    selectedCategory,
    selectedLevel,
    minPrice,
    maxPrice,
    minRating,
    showAllRecommended,
  ]);

  const getFirstWord = (title) => {
    if (!title) return 'Course';
    const word = title.trim().split(/\s+/)[0];
    return word || 'Course';
  };

  useEffect(() => {
    fetchCourses();
  }, [
    searchTerm,
    selectedCategory,
    selectedLevel,
    sortBy,
    currentPage,
    minPrice,
    maxPrice,
    minRating,
    hasCertificate,
    hasGroupDiscussion,
  ]);

  useEffect(() => {
    // Prefer user interests if logged in; fallback to localStorage/defaults
    const saved = (user?.interests && user.interests.length > 0)
      ? user.interests
      : JSON.parse(localStorage.getItem('userInterests')) || ['Web Development', 'Data Science', 'Python'];
    fetchRecommendedCourses(saved);
    // Only run on mount or when user.interests changes meaningfully
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(user?.interests || [])]);

  const fetchRecommendedCourses = async (interests) => {
    setRecommendedLoading(true);
    try {
      const recommendations = await getRecommendedCourses(interests);
      setRecommendedCourses(recommendations);
    } catch (error) {
      console.error('Error fetching recommended courses:', error);
      // Silently fail for now, so the main page still works
      setRecommendedCourses([]);
    } finally {
      setRecommendedLoading(false);
    }
  };

  const handleSaveInterests = (e) => {
    e.preventDefault();
    const parsed = interestInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    localStorage.setItem('userInterests', JSON.stringify(parsed));
    fetchRecommendedCourses(parsed);
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 12,
        search: searchTerm,
        category: selectedCategory,
        level: selectedLevel,
        sort: sortBy,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        minRating: minRating || undefined,
        hasCertificate: hasCertificate || undefined,
        hasGroupDiscussion: hasGroupDiscussion || undefined
      };

      const response = await courseApi.getCourses(params);
      setCourses(response.data.courses);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCourses();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedLevel('');
    setSortBy('newest');
    setCurrentPage(1);
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setHasCertificate(false);
    setHasGroupDiscussion(false);
  };

  const applyFilters = () => {
    setCurrentPage(1);
    fetchCourses();
    setShowFilters(false);
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

    const RecommendedCourseCard = ({ course, index }) => {
    const [visible, setVisible] = React.useState(false);
    const cardRef = React.useRef(null);
    React.useEffect(() => {
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      }, { threshold: 0.18 });
      if (cardRef.current) obs.observe(cardRef.current);
      return () => obs.disconnect();
    }, []);
    return (
      <div
        ref={cardRef}
        className={`group bg-white rounded-xl shadow-md overflow-hidden transform transition-all duration-500 ease-out hover:scale-[1.01] hover:shadow-lg cursor-pointer ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
        style={{ transitionDelay: `${Math.min(index, 8) * 60}ms` }}
      >
        {/* Custom banner color */}
        <div className={`relative w-full h-44 flex items-center justify-center bg-[#090040] border-b overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-t from-[#090040]/0 via-[#090040]/12 to-[#090040]/0 transition-opacity group-hover:via-[#090040]/20"></div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white text-center px-4 line-clamp-2 transition-transform duration-300 ease-out group-hover:scale-[1.01]">
            {getFirstWord(course.course_title)}
          </h1>
        </div>
        <div className="p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-semibold">
              {course.subject}
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-100">${course.price}</span>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
            {course.course_title}
          </h3>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-50 border">{course.level}</span>
            {course.rating ? (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500" />
                <span className="font-medium text-gray-700">{course.rating.toFixed ? course.rating.toFixed(1) : course.rating}</span>
              </span>
            ) : <span />}
          </div>
        </div>
      </div>
    );
  };

  const CourseCard = ({ course, index }) => {
    const [visible, setVisible] = React.useState(false);
    const cardRef = React.useRef(null);
    React.useEffect(() => {
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      }, { threshold: 0.18 });
      if (cardRef.current) obs.observe(cardRef.current);
      return () => obs.disconnect();
    }, []);
    return (
      <Link to={`/course/${course._id}`} className="block">
        <div
          ref={cardRef}
          className={`group bg-white rounded-xl shadow-md overflow-hidden transform transition-all duration-500 ease-out hover:scale-[1.01] hover:shadow-lg cursor-pointer ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: `${Math.min(index, 8) * 60}ms` }}
        >
          <div className="relative overflow-hidden">
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-48 object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
            />
            <div className="absolute top-4 left-4">
              <span className="bg-primary-600/90 backdrop-blur text-white px-2 py-1 rounded text-xs font-semibold shadow-sm">
                {course.category}
              </span>
            </div>
            <div className="absolute top-4 right-4">
              <span className={`px-2 py-1 rounded text-xs font-semibold shadow-sm ${
                course.level === 'Beginner' ? 'bg-green-100 text-green-800' :
                course.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {course.level}
              </span>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
              {course.title}
            </h3>
            <p className="text-gray-600 text-sm mb-3">by {course.instructor.fullName}</p>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>

            {/* Course Stats */}
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <div className="flex items-center">
                <Users size={14} className="mr-1" />
                <span>{course.enrolledStudents.length}</span>
              </div>
              {course.rating > 0 && (
                <div className="flex items-center">
                  <StarRating rating={course.rating} readonly size={14} showValue />
                </div>
              )}
              <div className="flex items-center">
                <Clock size={14} className="mr-1" />
                <span>
                  {course.sections?.reduce((total, section) => total + (section.lectures?.length || 0), 0)} lectures
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-primary-600">${course.price}</div>
              <div className="text-xs font-medium text-primary-700 bg-primary-50 border border-primary-100 px-2 py-1 rounded-full">
                View details
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  const SkeletonCourseCard = () => (
    <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
      <div className="w-full h-48 bg-gray-200" />
      <div className="p-6 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="flex items-center justify-between mt-4">
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-16" />
        </div>
        <div className="h-6 bg-gray-200 rounded w-24 ml-auto" />
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Explore Courses</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover thousands of courses from expert instructors and advance your skills today
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-3 items-stretch">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search courses (title, description)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Button type="submit" className="h-11 px-5 flex items-center">
              <Search size={16} className="mr-2" />
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="h-11 flex items-center"
            >
              <Filter size={16} className="mr-2" />
              Filters
              <ChevronDown size={16} className={`ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {/* Active Filter Chips */}
          {(searchTerm || selectedCategory || selectedLevel || minPrice || maxPrice || minRating || hasCertificate || hasGroupDiscussion) && (
            <div className="flex flex-wrap gap-2 pt-2">
              {searchTerm && (
                <span className="inline-flex items-center bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                  Search: {searchTerm}
                  <button className="ml-2" type="button" onClick={() => setSearchTerm('')}>×</button>
                </span>
              )}
              {selectedCategory && (
                <span className="inline-flex items-center bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                  Category: {selectedCategory}
                  <button className="ml-2" type="button" onClick={() => setSelectedCategory('')}>×</button>
                </span>
              )}
              {selectedLevel && (
                <span className="inline-flex items-center bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                  Level: {selectedLevel}
                  <button className="ml-2" type="button" onClick={() => setSelectedLevel('')}>×</button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="inline-flex items-center bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                  Price: {minPrice || 0} - {maxPrice || '∞'}
                  <button className="ml-2" type="button" onClick={() => { setMinPrice(''); setMaxPrice(''); }}>×</button>
                </span>
              )}
              {minRating && (
                <span className="inline-flex items-center bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                  Rating: {minRating}+
                  <button className="ml-2" type="button" onClick={() => setMinRating('')}>×</button>
                </span>
              )}
              {hasCertificate && (
                <span className="inline-flex items-center bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                  Has Certificate
                  <button className="ml-2" type="button" onClick={() => setHasCertificate(false)}>×</button>
                </span>
              )}
              {hasGroupDiscussion && (
                <span className="inline-flex items-center bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                  Group Discussion
                  <button className="ml-2" type="button" onClick={() => setHasGroupDiscussion(false)}>×</button>
                </span>
              )}
              <Button type="button" variant="ghost" onClick={clearFilters} className="text-sm">
                Clear all
              </Button>
            </div>
          )}

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <Select
                label="Category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>

              <Select
                label="Level"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
              >
                <option value="">All Levels</option>
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </Select>

              <Select
                label="Sort By"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="popular">Most Popular</option>
              </Select>

              {/* Advanced Filters: Price */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Min Price</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Max Price</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="1000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Advanced Filters: Rating */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Minimum Rating</label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                >
                  <option value="">Any</option>
                  <option value="3">3.0+</option>
                  <option value="4">4.0+</option>
                  <option value="4.5">4.5+</option>
                </select>
              </div>

              {/* Advanced Filters: Features */}
              <div className="flex flex-col justify-end space-y-2">
                <label className="inline-flex items-center space-x-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={hasCertificate}
                    onChange={(e) => setHasCertificate(e.target.checked)}
                  />
                  <span>Has Certificate</span>
                </label>
                <label className="inline-flex items-center space-x-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={hasGroupDiscussion}
                    onChange={(e) => setHasGroupDiscussion(e.target.checked)}
                  />
                  <span>Group Discussion</span>
                </label>
                <div className="flex gap-2 pt-1">
                  <Button type="button" onClick={applyFilters}>
                    Apply Filters
                  </Button>
                  <Button type="button" variant="outline" onClick={clearFilters}>
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Our Pupular Courses - moved directly under search */}
      {loading ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Our Pupular Courses</h2>
            <div className="h-1 w-24 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full mt-2"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCourseCard key={i} />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Our Pupular Courses</h2>
            <div className="h-1 w-24 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full mt-2"></div>
          </div>
          {courses.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {courses.map((course, idx) => (
                  <CourseCard key={course._id} course={course} index={idx} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'primary' : 'outline'}
                        onClick={() => setCurrentPage(page)}
                        size="sm"
                      >
                        {page}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="bg-white rounded-lg shadow p-8">
                <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search criteria or browse all courses
                </p>
                <Button onClick={clearFilters}>View All Courses</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recommended For You - moved under instructor courses */}
      {recommendedLoading ? (
        <LoadingSpinner size="lg" />
      ) : (
        filteredRecommended.length > 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Recommended For You</h2>
              <div className="h-1 w-24 bg-gradient-to-r from-purple-600 to-primary-600 rounded-full mt-2"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredRecommended.map((course, index) => (
                <RecommendedCourseCard key={`${course.course_id}-${index}`} course={course} index={index} />
              ))}
            </div>
            
            {/* Explore More Button */}
            {!showAllRecommended && recommendedCourses.length > 12 && (
              <div className="flex justify-center mt-6">
                <Button
                  onClick={() => setShowAllRecommended(true)}
                  className="bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Explore More Recommendations
                </Button>
              </div>
            )}
            
            {/* Show Less Button when all are shown */}
            {showAllRecommended && (
              <div className="flex justify-center mt-6">
                <Button
                  onClick={() => setShowAllRecommended(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Show Less
                </Button>
              </div>
            )}
            
            <hr className="my-8" />
          </div>
        )
      )}

      {/* Interests Editor - moved below recommended */}
      {/* Interests management moved to Profile page */}
      <div className="mt-4 text-sm text-gray-600">
        Manage your interests in your
        <Link to="/profile" className="text-primary-600 hover:text-primary-700 font-medium ml-1">Profile</Link>
        . Recommendations use your selected interests.
      </div>

    </div>
  );
};

export default Courses