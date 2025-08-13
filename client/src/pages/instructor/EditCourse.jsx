import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Save, ArrowLeft, Plus, Edit, Trash2, Upload } from 'lucide-react';
import { courseApi } from '../../api/courseApi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

const EditCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  // Modals & forms for in-page editing (no alerts/prompts)
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null); // null => add, object => edit
  const [sectionForm, setSectionForm] = useState({ title: '', order: 0 });

  const [lectureModalOpen, setLectureModalOpen] = useState(false);
  const [lectureContext, setLectureContext] = useState({ sectionId: null, lectureId: null });
  const [lectureForm, setLectureForm] = useState({ title: '', description: '', order: 0 });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset
  } = useForm();

  const categories = [
    'Web Development',
    'Data Science',
    'AI & Machine Learning',
    'Mobile Development',
    'DevOps',
    'Cybersecurity',
    'UI/UX Design',
    'Business',
    'Marketing',
    'Other'
  ];

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const response = await courseApi.getCourse(id);
      const courseData = response.data;
      setCourse(courseData);
      setThumbnailPreview(courseData.thumbnail);
      
      // Populate form with existing data
      reset({
        title: courseData.title,
        description: courseData.description,
        price: courseData.price,
        category: courseData.category,
        level: courseData.level,
        hasGroupDiscussion: courseData.hasGroupDiscussion,
        hasCertificate: courseData.hasCertificate,
        isPublished: courseData.isPublished,
        certificateTemplate: courseData.certificateTemplate || 'classic'
      });
    } catch (error) {
      console.error('Error fetching course:', error);
      navigate('/instructor/courses');
    } finally {
      setLoading(false);
    }
  };

  // Content tab handlers (modal-based)
  const openSectionModal = (mode, section = null) => {
    if (mode === 'add') {
      const nextOrder = Array.isArray(course.sections) ? course.sections.length : 0;
      setEditingSection(null);
      setSectionForm({ title: '', order: nextOrder });
    } else {
      setEditingSection(section);
      setSectionForm({ title: section.title, order: section.order ?? 0 });
    }
    setSectionModalOpen(true);
  };

  const submitSectionModal = async () => {
    try {
      if (!sectionForm.title.trim()) {
        toast.error('Section title is required');
        return;
      }
      if (editingSection) {
        const res = await courseApi.updateSection(id, editingSection._id, {
          title: sectionForm.title.trim(),
          order: Number(sectionForm.order) || 0
        });
        setCourse(res.data.course);
        toast.success('Section updated');
      } else {
        const res = await courseApi.addSection(id, {
          title: sectionForm.title.trim(),
          order: Number(sectionForm.order) || 0
        });
        setCourse(res.data.course);
        toast.success('Section added');
      }
      setSectionModalOpen(false);
    } catch (e) {
      console.error('Save section failed:', e);
      toast.error('Failed to save section');
    }
  };

  const handleDeleteSection = async (section) => {
    try {
      const res = await courseApi.deleteSection(id, section._id);
      setCourse(res.data.course);
      toast.success('Section deleted');
    } catch (e) {
      console.error('Delete section failed:', e);
      toast.error('Failed to delete section');
    }
  };

  const openLectureModal = (section, lecture) => {
    setLectureContext({ sectionId: section._id, lectureId: lecture._id });
    setLectureForm({
      title: lecture.title || '',
      description: lecture.description || '',
      order: lecture.order ?? 0
    });
    setLectureModalOpen(true);
  };

  const submitLectureModal = async () => {
    try {
      if (!lectureForm.title.trim()) {
        toast.error('Lecture title is required');
        return;
      }
      const res = await courseApi.updateLecture(id, lectureContext.sectionId, lectureContext.lectureId, {
        title: lectureForm.title.trim(),
        description: lectureForm.description,
        order: Number(lectureForm.order) || 0
      });
      setCourse(res.data.course);
      setLectureModalOpen(false);
      toast.success('Lecture updated');
    } catch (e) {
      console.error('Save lecture failed:', e);
      toast.error('Failed to save lecture');
    }
  };

  const handleDeleteLecture = async (section, lecture) => {
    try {
      const res = await courseApi.deleteLecture(id, section._id, lecture._id);
      setCourse(res.data.course);
      toast.success('Lecture deleted');
    } catch (e) {
      console.error('Delete lecture failed:', e);
      toast.error('Failed to delete lecture');
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const formData = new FormData();
      
      // Add form data
      Object.keys(data).forEach(key => {
        if (key !== 'thumbnail') {
          formData.append(key, data[key]);
        }
      });

      // Add thumbnail if new one was selected
      if (data.thumbnail && data.thumbnail[0]) {
        formData.append('thumbnail', data.thumbnail[0]);
      }

      await courseApi.updateCourse(id, formData);
      toast.success('Course updated successfully!');
      navigate('/instructor/courses');
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error('Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublishToggle = async () => {
    try {
      if (!course.isPublished) {
        await courseApi.publishCourse(id);
        setCourse({ ...course, isPublished: true });
        toast.success('Course published successfully!');
      }
    } catch (error) {
      console.error('Error publishing course:', error);
      toast.error('Failed to publish course');
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="mt-20" />;
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Course not found</h2>
        <p className="text-gray-600 mt-2">The course you're trying to edit doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/instructor/courses')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Course</h1>
            <p className="text-gray-600">{course.title}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            course.isPublished
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {course.isPublished ? 'Published' : 'Draft'}
          </span>
          
          {!course.isPublished && (
            <Button onClick={handlePublishToggle}>
              Publish Course
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'basic', name: 'Basic Info' },
              { id: 'content', name: 'Course Content' },
              { id: 'settings', name: 'Settings' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'basic' && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input
                    label="Course Title"
                    {...register('title', {
                      required: 'Course title is required'
                    })}
                    error={errors.title?.message}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    rows={4}
                    {...register('description', {
                      required: 'Course description is required'
                    })}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
                  )}
                </div>

                <Input
                  label="Price ($)"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('price', {
                    required: 'Price is required',
                    min: { value: 0, message: 'Price must be positive' }
                  })}
                  error={errors.price?.message}
                />

                <Select
                  label="Category"
                  {...register('category', {
                    required: 'Category is required'
                  })}
                  error={errors.category?.message}
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Difficulty Level"
                  {...register('level', {
                    required: 'Level is required'
                  })}
                  error={errors.level?.message}
                >
                  <option value="">Select level</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </Select>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Thumbnail
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {thumbnailPreview ? (
                      <div className="relative">
                        <img
                          src={thumbnailPreview}
                          alt="Course thumbnail"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setThumbnailPreview(null)}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <div className="mt-2">
                          <label htmlFor="thumbnail" className="cursor-pointer">
                            <span className="text-sm font-medium text-gray-900">
                              Upload new thumbnail
                            </span>
                          </label>
                          <input
                            id="thumbnail"
                            type="file"
                            accept="image/*"
                            {...register('thumbnail')}
                            onChange={handleThumbnailChange}
                            className="sr-only"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" loading={saving} disabled={saving}>
                  <Save size={16} className="mr-2" />
                  Save Changes
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'content' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Course Content</h3>
                <Button size="sm" onClick={() => openSectionModal('add')}>
                  <Plus size={16} className="mr-2" />
                  Add Section
                </Button>
              </div>

              {course.sections && course.sections.length > 0 ? (
                <div className="space-y-4">
                  {course.sections.map((section, index) => (
                    <div key={section._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">
                          Section {index + 1}: {section.title}
                        </h4>
                        <div className="flex space-x-2">
                          <button onClick={() => openSectionModal('edit', section)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDeleteSection(section)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          {section.lectures?.length || 0} lectures
                          {section.quiz?.questions?.length > 0 && ` • 1 quiz`}
                        </p>
                        
                        {section.lectures?.map((lecture, lectureIndex) => (
                          <div key={lecture._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-700">
                              {lectureIndex + 1}. {lecture.title}
                            </span>
                            <div className="flex space-x-1">
                              <button onClick={() => openLectureModal(section, lecture)} className="p-1 text-gray-400 hover:text-blue-600">
                                <Edit size={14} />
                              </button>
                              <button onClick={() => handleDeleteLecture(section, lecture)} className="p-1 text-gray-400 hover:text-red-600">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No sections added yet</p>
                  <Button size="sm" className="mt-4">
                    <Plus size={16} className="mr-2" />
                    Add First Section
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Course Settings</h3>
              
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('hasGroupDiscussion')}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-900">Enable Group Discussion</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('hasCertificate')}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-900">Generate Certificates</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('isPublished')}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-900">Publish Course</span>
                </label>

                <div className="max-w-xs">
                  <Select label="Certificate Template" {...register('certificateTemplate')}>
                    <option value="classic">Classic</option>
                    <option value="modern">Modern</option>
                    <option value="elegant">Elegant</option>
                    <option value="professional">Professional</option>
                    <option value="creative">Creative</option>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" loading={saving} disabled={saving}>
                  <Save size={16} className="mr-2" />
                  Save Settings
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Section Modal */}
      <Modal
        isOpen={sectionModalOpen}
        onClose={() => setSectionModalOpen(false)}
        title={editingSection ? 'Edit Section' : 'Add Section'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Section Title"
            value={sectionForm.title}
            onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
          />
          <Input
            label="Order"
            type="number"
            min={0}
            value={sectionForm.order}
            onChange={(e) => setSectionForm({ ...sectionForm, order: e.target.value })}
          />
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" onClick={() => setSectionModalOpen(false)}>Cancel</Button>
            <Button onClick={submitSectionModal}>{editingSection ? 'Save Changes' : 'Add Section'}</Button>
          </div>
        </div>
      </Modal>

      {/* Lecture Modal */}
      <Modal
        isOpen={lectureModalOpen}
        onClose={() => setLectureModalOpen(false)}
        title="Edit Lecture"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Lecture Title"
            value={lectureForm.title}
            onChange={(e) => setLectureForm({ ...lectureForm, title: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              rows={4}
              value={lectureForm.description}
              onChange={(e) => setLectureForm({ ...lectureForm, description: e.target.value })}
            />
          </div>
          <Input
            label="Order"
            type="number"
            min={0}
            value={lectureForm.order}
            onChange={(e) => setLectureForm({ ...lectureForm, order: e.target.value })}
          />
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" onClick={() => setLectureModalOpen(false)}>Cancel</Button>
            <Button onClick={submitLectureModal}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EditCourse;