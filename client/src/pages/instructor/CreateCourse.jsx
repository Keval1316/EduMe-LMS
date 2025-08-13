import React, { useState, useEffect, useRef } from 'react';

import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Upload, X, Plus, ArrowRight, ArrowLeft, Edit, Check } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { courseApi } from '../../api/courseApi';
import toast from 'react-hot-toast';

const CreateCourse = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [courseData, setCourseData] = useState({});
    const [sections, setSections] = useState([]);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [settings, setSettings] = useState({
        hasGroupDiscussion: false,
        hasCertificate: true,
        isPublished: false
    });
    const navigate = useNavigate();

    const steps = [
        { id: 1, name: 'Basic Info', description: 'Course details and thumbnail' },
        { id: 2, name: 'Sections', description: 'Course structure and sections' },
        { id: 3, name: 'Lectures', description: 'Add video content' },
        { id: 4, name: 'Quizzes', description: 'Create assessments' },
        { id: 5, name: 'Settings', description: 'Final configuration' }
    ];

    // Determine if a step is completed (used to color-fill the step and its connector)
    const isStepCompleted = (stepId) => {
        switch (stepId) {
            case 1:
                return Boolean(
                    courseData?.title &&
                    courseData?.description &&
                    courseData?.price !== undefined && courseData?.price !== '' &&
                    courseData?.category &&
                    courseData?.level
                );
            case 2:
                return sections.length > 0;
            case 3:
                return sections.some((s) => (s.lectures?.length || 0) > 0);
            case 4:
                return sections.some((s) => (s.quiz?.questions?.length || 0) > 0);
            case 5:
                // Final step considered complete when reached; creation happens on submit
                return false;
            default:
                return false;
        }
    };

    // Basic Info Form
    const BasicInfoForm = () => {
        const [localThumbnailPreview, setLocalThumbnailPreview] = useState(null);
        
        const {
            register,
            handleSubmit,
            formState: { errors },
            watch,
            setValue,
            getValues
        } = useForm({
            defaultValues: {
                title: '',
                description: '',
                price: '',
                category: '',
                level: '',
                thumbnail: null
            }
        });

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

        const onSubmit = (data) => {
            setCourseData({ ...courseData, ...data });
            setCurrentStep(2);
        };

        const handleThumbnailChange = (e) => {
            const file = e.target.files[0];
            if (file) {
                // Set thumbnail in form state first
                setValue('thumbnail', file, { shouldValidate: false, shouldDirty: true });
                
                // Set local preview to avoid parent re-renders
                const reader = new FileReader();
                reader.onloadend = () => {
                    setLocalThumbnailPreview(reader.result);
                };
                reader.readAsDataURL(file);
            }
        };

        const handleThumbnailRemove = () => {
            setValue('thumbnail', null, { shouldValidate: false, shouldDirty: true });
            setLocalThumbnailPreview(null);
        };

        return (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Basic Information</h2>

                    <div className="space-y-4">
                        <Input
                            label="Course Title"
                            placeholder="Enter course title"
                            {...register('title', {
                                required: 'Course title is required',
                                minLength: {
                                    value: 10,
                                    message: 'Title must be at least 10 characters'
                                }
                            })}
                            error={errors.title?.message}
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Course Description
                            </label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                rows={4}
                                placeholder="Describe what students will learn in this course"
                                {...register('description', {
                                    required: 'Course description is required',
                                    minLength: {
                                        value: 50,
                                        message: 'Description must be at least 50 characters'
                                    }
                                })}
                            />
                            {errors.description && (
                                <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Price ($)"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                {...register('price', {
                                    required: 'Price is required',
                                    min: {
                                        value: 0,
                                        message: 'Price must be a positive number'
                                    }
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
                        </div>

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

                        {/* Thumbnail Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Course Thumbnail
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                                {localThumbnailPreview ? (
                                    <div className="relative">
                                        <img
                                            src={localThumbnailPreview}
                                            alt="Course thumbnail"
                                            className="w-full h-48 object-cover rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleThumbnailRemove}
                                            className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="mt-4">
                                            <label htmlFor="thumbnail" className="cursor-pointer">
                                                <span className="mt-2 block text-sm font-medium text-gray-900">
                                                    Upload course thumbnail
                                                </span>
                                                <span className="mt-1 block text-xs text-gray-500">
                                                    PNG, JPG up to 5MB
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
                </div>

                <div className="flex justify-end">
                    <Button type="submit">
                        Next Step
                        <ArrowRight size={16} className="ml-2" />
                    </Button>
                </div>
            </form>
        );
    };

    // Sections Form
    const SectionsForm = () => {
        const [newSectionTitle, setNewSectionTitle] = useState('');

        const addSection = () => {
            if (!newSectionTitle.trim()) return;

            const newSection = {
                id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
                title: newSectionTitle,
                order: sections.length + 1,
                lectures: [],
                quiz: { questions: [] }
            };

            setSections([...sections, newSection]);
            setNewSectionTitle('');
        };

        const removeSection = (sectionId) => {
            setSections(sections.filter(section => section.id !== sectionId));
        };

        const updateSectionTitle = (sectionId, title) => {
            setSections(sections.map(section =>
                section.id === sectionId ? { ...section, title } : section
            ));
        };

        const handleNext = () => {
            if (sections.length === 0) {
                toast.error('Please add at least one section');
                return;
            }
            setCurrentStep(3);
        };

        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Course Sections</h2>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        Organize your course content into logical sections. Each section will contain lectures and quizzes.
                    </p>
                </div>

                {/* Add New Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex gap-4">
                        <Input
                            placeholder="Section title (e.g., Introduction to React)"
                            value={newSectionTitle}
                            onChange={(e) => setNewSectionTitle(e.target.value)}
                            className="flex-1"
                        />
                        <Button onClick={addSection} disabled={!newSectionTitle.trim()}>
                            <Plus size={16} className="mr-2" />
                            Add Section
                        </Button>
                    </div>
                </div>

                {/* Sections List */}
                <div className="space-y-4">
                    {sections.map((section, index) => (
                        <div key={section.id} className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center flex-1">
                                    <span className="text-sm font-medium text-gray-500 mr-4">
                                        Section {index + 1}
                                    </span>
                                    <Input
                                        value={section.title}
                                        onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                                        className="flex-1"
                                    />
                                </div>
                                <button
                                    onClick={() => removeSection(section.id)}
                                    className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {sections.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <div className="text-gray-500">
                            <Plus className="mx-auto h-12 w-12 mb-4" />
                            <p>No sections added yet</p>
                            <p className="text-sm">Add your first section to get started</p>
                        </div>
                    </div>
                )}

                <div className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                    >
                        <ArrowLeft size={16} className="mr-2" />
                        Previous
                    </Button>
                    <Button onClick={handleNext}>
                        Next Step
                        <ArrowRight size={16} className="ml-2" />
                    </Button>
                </div>
            </div>
        );
    };

    // Lectures Form
    const LecturesForm = () => {
        const [selectedSection, setSelectedSection] = useState(sections[0]?.id || '');
        const [newLecture, setNewLecture] = useState({
            title: '',
            description: '',
            video: null
        });

        // Ensure a valid selection when sections change
        useEffect(() => {
            if (sections.length === 0) {
                setSelectedSection('');
                return;
            }
            const exists = sections.some(s => s.id === selectedSection);
            if (!exists) {
                setSelectedSection(sections[0].id);
            }
        }, [sections, selectedSection]);

        const addLecture = () => {
            if (!newLecture.title.trim() || !newLecture.video) {
                toast.error('Please provide lecture title and video');
                return;
            }

            const lecture = {
                id: Date.now(),
                title: newLecture.title,
                description: newLecture.description,
                video: newLecture.video,
                order: (sections.find(s => String(s.id) === String(selectedSection))?.lectures.length || 0) + 1
            };

            setSections(sections.map(section =>
                String(section.id) === String(selectedSection)
                    ? { ...section, lectures: [...section.lectures, lecture] }
                    : section
            ));

            setNewLecture({ title: '', description: '', video: null });
        };

        const removeLecture = (sectionId, lectureId) => {
            setSections(sections.map(section =>
                String(section.id) === String(sectionId)
                    ? { ...section, lectures: section.lectures.filter(l => l.id !== lectureId) }
                    : section
            ));
        };

        const handleNext = () => {
            const hasLectures = sections.some(section => section.lectures.length > 0);
            if (!hasLectures) {
                toast.error('Please add at least one lecture');
                return;
            }
            setCurrentStep(4);
        };

        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Add Lectures</h2>

                {sections.length > 0 ? (
                    <>
                        {/* Section Selector */}
                        <Select
                            label="Select Section"
                            value={selectedSection || ''}
                            onChange={(e) => setSelectedSection(e.target.value)}
                        >
                            <option value="">Choose a section</option>
                            {sections.map((section) => (
                                <option key={section.id} value={section.id}>
                                    {section.title}
                                </option>
                            ))}
                        </Select>

                        {selectedSection && (
                            <>
                                {/* Add New Lecture */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Lecture</h3>
                                    <div className="space-y-4">
                                        <Input
                                            label="Lecture Title"
                                            placeholder="Enter lecture title"
                                            value={newLecture.title}
                                            onChange={(e) => setNewLecture({ ...newLecture, title: e.target.value })}
                                        />

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Description (Optional)
                                            </label>
                                            <textarea
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                rows={3}
                                                placeholder="Describe what this lecture covers"
                                                value={newLecture.description}
                                                onChange={(e) => setNewLecture({ ...newLecture, description: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Video Upload
                                            </label>
                                            <input
                                                type="file"
                                                accept="video/*"
                                                onChange={(e) => setNewLecture({ ...newLecture, video: e.target.files[0] })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            />
                                            {newLecture.video && (
                                                <p className="text-sm text-green-600 mt-1">
                                                    Video selected: {newLecture.video.name}
                                                </p>
                                            )}
                                        </div>

                                        <Button onClick={addLecture}>
                                            <Plus size={16} className="mr-2" />
                                            Add Lecture
                                        </Button>
                                    </div>
                                </div>

                                {/* Existing Lectures */}
                                <div className="space-y-4">
                                    {sections.find(s => String(s.id) === String(selectedSection))?.lectures.map((lecture, index) => (
                                        <div key={lecture.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-medium text-gray-900">
                                                        Lecture {index + 1}: {lecture.title}
                                                    </h4>
                                                    {lecture.description && (
                                                        <p className="text-sm text-gray-600 mt-1">{lecture.description}</p>
                                                    )}
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Video: {lecture.video?.name || 'Uploaded'}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => removeLecture(selectedSection, lecture.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">Please add sections first before creating lectures</p>
                    </div>
                )}

                <div className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentStep(2)}
                    >
                        <ArrowLeft size={16} className="mr-2" />
                        Previous
                    </Button>
                    <Button onClick={handleNext}>
                        Next Step
                        <ArrowRight size={16} className="ml-2" />
                    </Button>
                </div>
            </div>
        );
    };

    // Quizzes Form (rewritten)
    const QuizzesForm = () => {
        const [selectedSection, setSelectedSection] = useState('');
        const [questions, setQuestions] = useState([]);
        const [passingScore, setPassingScore] = useState(70);
        const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
        const [editingId, setEditingId] = useState(null);

        const [form, setForm] = useState({
            question: '',
            options: [
                { text: '', isCorrect: false },
                { text: '', isCorrect: false },
                { text: '', isCorrect: false },
                { text: '', isCorrect: false }
            ],
            explanation: ''
        });

        // Ensure a valid selected section
        useEffect(() => {
            if (sections.length === 0) {
                setSelectedSection('');
                return;
            }
            const exists = sections.some(s => String(s.id) === String(selectedSection));
            if (!exists) {
                setSelectedSection(sections[0].id);
            }
        }, [sections, selectedSection]);

        // Load data for selected section
        useEffect(() => {
            if (!selectedSection) return;
            const sec = sections.find(s => String(s.id) === String(selectedSection));
            const secQuestions = sec?.quiz?.questions || [];
            const secPassing = sec?.quiz?.passingScore ?? 70;
            setQuestions([...secQuestions]);
            setPassingScore(secPassing);
            setHasUnsavedChanges(false);
            resetForm();
        }, [selectedSection, sections]);

        const resetForm = () => {
            setForm({
                question: '',
                options: [
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false }
                ],
                explanation: ''
            });
            setEditingId(null);
        };

        const validate = () => {
            if (!form.question.trim()) {
                toast.error('Please enter a question');
                return false;
            }
            const filled = form.options.filter(o => o.text.trim());
            if (filled.length < 2) {
                toast.error('Provide at least 2 options');
                return false;
            }
            if (!form.options.some(o => o.isCorrect && o.text.trim())) {
                toast.error('Mark at least one correct option');
                return false;
            }
            // prevent duplicate in current list (ignore when editing same item)
            const dup = questions.some(q => q.question.trim().toLowerCase() === form.question.trim().toLowerCase() && q.id !== editingId);
            if (dup) {
                toast.error('This question already exists in this section');
                return false;
            }
            return true;
        };

        const addOrUpdate = () => {
            if (!validate()) return;
            const normalizedOptions = form.options.filter(o => o.text.trim());
            if (editingId) {
                setQuestions(qs => qs.map(q => q.id === editingId ? { ...q, question: form.question, options: normalizedOptions, explanation: form.explanation } : q));
                toast.success('Question updated');
            } else {
                const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
                setQuestions(qs => [...qs, { id, question: form.question, options: normalizedOptions, explanation: form.explanation }]);
                toast.success('Question added');
            }
            setHasUnsavedChanges(true);
            resetForm();
        };

        const edit = (q) => {
            setForm({
                question: q.question,
                options: [...q.options, ...Array(Math.max(0, 4 - q.options.length)).fill({ text: '', isCorrect: false })].slice(0, 4),
                explanation: q.explanation || ''
            });
            setEditingId(q.id);
        };

        const remove = (id) => {
            setQuestions(qs => qs.filter(q => q.id !== id));
            setHasUnsavedChanges(true);
        };

        const saveToSection = () => {
            if (!selectedSection) {
                toast.error('Select a section');
                return;
            }
            setSections(sections.map(sec =>
                String(sec.id) === String(selectedSection)
                    ? { ...sec, quiz: { questions: [...questions], passingScore: Number(passingScore) || 70 } }
                    : sec
            ));
            setHasUnsavedChanges(false);
            toast.success('Quiz saved to section');
        };

        const onChangeSection = (e) => {
            const newId = e.target.value;
            if (hasUnsavedChanges) {
                const ok = window.confirm('You have unsaved changes for this section. Save them before switching?');
                if (ok) {
                    // save before switching
                    setSections(sections.map(sec =>
                        String(sec.id) === String(selectedSection)
                            ? { ...sec, quiz: { questions: [...questions], passingScore: Number(passingScore) || 70 } }
                            : sec
                    ));
                    toast.success('Changes saved');
                }
                // Either saved or user chose to discard
                setHasUnsavedChanges(false);
            }
            setSelectedSection(newId);
        };

        const goNext = () => {
            if (hasUnsavedChanges) {
                const ok = window.confirm('You have unsaved changes. Save before proceeding to next step?');
                if (ok) saveToSection();
            }
            setCurrentStep(5);
        };

        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Create Quizzes</h2>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">Select a section, add questions, save them to that section, then switch sections and repeat.</p>
                </div>

                {sections.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">Please add sections first before creating quizzes</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <Select label="Select Section" value={selectedSection} onChange={onChangeSection}>
                                <option value="">Choose a section</option>
                                {sections.map(sec => (
                                    <option key={sec.id} value={sec.id}>
                                        {sec.title}{sec.quiz?.questions?.length ? ` (${sec.quiz.questions.length} questions)` : ''}
                                    </option>
                                ))}
                            </Select>
                            <Input
                                label="Passing Score (%)"
                                type="number"
                                min="1"
                                max="100"
                                value={passingScore}
                                onChange={e => { setPassingScore(e.target.value); setHasUnsavedChanges(true); }}
                            />
                        </div>

                        {selectedSection && (
                            <>
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-medium text-gray-900">{editingId ? 'Edit Question' : 'Add Question'}</h3>
                                        {hasUnsavedChanges && (
                                            <span className="text-sm text-orange-600 font-medium">Unsaved changes</span>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                                            <textarea
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                rows={3}
                                                placeholder="Enter your question"
                                                value={form.question}
                                                onChange={(e) => { setForm({ ...form, question: e.target.value }); setHasUnsavedChanges(true); }}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Options (check correct answers)</label>
                                            <div className="space-y-2">
                                                {form.options.map((opt, i) => (
                                                    <div key={i} className="flex items-center space-x-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={opt.isCorrect}
                                                            onChange={(e) => {
                                                                const opts = [...form.options];
                                                                opts[i] = { ...opts[i], isCorrect: e.target.checked };
                                                                setForm({ ...form, options: opts });
                                                                setHasUnsavedChanges(true);
                                                            }}
                                                            className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder={`Option ${i + 1}`}
                                                            value={opt.text}
                                                            onChange={(e) => {
                                                                const opts = [...form.options];
                                                                opts[i] = { ...opts[i], text: e.target.value };
                                                                setForm({ ...form, options: opts });
                                                                setHasUnsavedChanges(true);
                                                            }}
                                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Explanation (Optional)</label>
                                            <textarea
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                rows={2}
                                                placeholder="Explain the correct answer"
                                                value={form.explanation}
                                                onChange={(e) => { setForm({ ...form, explanation: e.target.value }); setHasUnsavedChanges(true); }}
                                            />
                                        </div>

                                        <div className="flex gap-3">
                                            <Button onClick={addOrUpdate}>{editingId ? (<><Edit size={16} className="mr-2" /> Update Question</>) : (<><Plus size={16} className="mr-2" /> Add Question</>)}</Button>
                                            {editingId && (<Button variant="outline" onClick={resetForm}>Cancel</Button>)}
                                            <Button variant="outline" onClick={saveToSection}>Save to this Section</Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Existing questions */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-medium text-gray-900">Questions for this Section ({questions.length})</h3>
                                        {hasUnsavedChanges && <span className="text-sm text-orange-600">Unsaved changes</span>}
                                    </div>
                                    {questions.map((q, idx) => (
                                        <div key={q.id} className={`border rounded-lg p-4 ${editingId === q.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900 mb-2">Question {idx + 1}: {q.question}</h4>
                                                    <div className="space-y-1">
                                                        {q.options.map((o, oi) => (
                                                            <div key={oi} className={`text-sm ${o.isCorrect ? 'text-green-600 font-medium' : 'text-gray-600'}`}>{o.isCorrect ? '✓' : '○'} {o.text}</div>
                                                        ))}
                                                    </div>
                                                    {q.explanation && (<p className="text-sm text-gray-500 mt-2"><span className="font-medium">Explanation:</span> {q.explanation}</p>)}
                                                </div>
                                                <div className="flex gap-2 ml-4">
                                                    <button onClick={() => edit(q)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Edit size={16} /></button>
                                                    <button onClick={() => remove(q.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><X size={16} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}

                <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep(3)}>
                        <ArrowLeft size={16} className="mr-2" />
                        Previous
                    </Button>
                    <Button onClick={goNext}>
                        Next Step
                        <ArrowRight size={16} className="ml-2" />
                    </Button>
                </div>
            </div>
        );
    };

    // Final Settings Form
    const SettingsForm = () => {
        const handleSubmit = async () => {
            setLoading(true);
            try {
                // Create the course with all data
                const formData = new FormData();

                // Add basic course data
                Object.keys(courseData).forEach(key => {
                    if (key !== 'thumbnail') {
                        formData.append(key, courseData[key]);
                    }
                });

                // Add thumbnail if exists
                if (courseData.thumbnail) {
                    formData.append('thumbnail', courseData.thumbnail);
                }

                // Add settings
                Object.keys(settings).forEach(key => {
                    formData.append(key, settings[key]);
                });

                // Create the course first
                const courseResponse = await courseApi.createCourse(formData);
                const courseId = courseResponse.data.course._id;

                // Add sections, lectures, and quizzes
                for (const section of sections) {
                    const sectionResponse = await courseApi.addSection(courseId, {
                        title: section.title,
                        order: section.order
                    });

                    const sectionId = sectionResponse.data.course.sections[sectionResponse.data.course.sections.length - 1]._id;

                    // Add lectures to section
                    for (const lecture of section.lectures) {
                        const lectureFormData = new FormData();
                        lectureFormData.append('title', lecture.title);
                        lectureFormData.append('description', lecture.description);
                        lectureFormData.append('order', lecture.order);
                        lectureFormData.append('video', lecture.video);

                        await courseApi.addLecture(courseId, sectionId, lectureFormData);
                    }

                    // Add quiz to section
                    if (section.quiz && section.quiz.questions.length > 0) {
                        await courseApi.addQuiz(courseId, sectionId, section.quiz);
                    }
                }

                // Ensure publish if requested
                if (settings.isPublished) {
                    try {
                        await courseApi.publishCourse(courseId);
                    } catch (e) {
                        console.warn('Publish on create failed, course may already be published:', e?.response?.data || e?.message);
                    }
                }

                toast.success('Course created successfully!');
                navigate('/instructor/courses');
            } catch (error) {
                console.error('Error creating course:', error);
                toast.error('Failed to create course');
            } finally {
                setLoading(false);
            }
        };

        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Final Settings</h2>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Course Features</h3>
                    <div className="space-y-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={settings.hasGroupDiscussion}
                                onChange={(e) => setSettings({ ...settings, hasGroupDiscussion: e.target.checked })}
                                className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                            />
                            <span className="ml-3 text-sm text-gray-900">
                                Enable Group Discussion
                            </span>
                        </label>
                        <p className="text-xs text-gray-500 ml-7">
                            Allow students to interact and ask questions in a course forum
                        </p>

                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={settings.hasCertificate}
                                onChange={(e) => setSettings({ ...settings, hasCertificate: e.target.checked })}
                                className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                            />
                            <span className="ml-3 text-sm text-gray-900">
                                Generate Certificates
                            </span>
                        </label>
                        <p className="text-xs text-gray-500 ml-7">
                            Automatically generate certificates when students complete the course
                        </p>

                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={settings.isPublished}
                                onChange={(e) => setSettings({ ...settings, isPublished: e.target.checked })}
                                className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                            />
                            <span className="ml-3 text-sm text-gray-900">
                                Publish Course
                            </span>
                        </label>
                        <p className="text-xs text-gray-500 ml-7">
                            Make the course visible to students (you can publish later if unchecked)
                        </p>
                    </div>
                </div>

                {/* Course Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Course Summary</h3>
                    <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Title:</span> {courseData.title}</p>
                        <p><span className="font-medium">Category:</span> {courseData.category}</p>
                        <p><span className="font-medium">Price:</span> ${courseData.price}</p>
                        <p><span className="font-medium">Level:</span> {courseData.level}</p>
                        <p><span className="font-medium">Sections:</span> {sections.length}</p>
                        <p><span className="font-medium">Total Lectures:</span> {sections.reduce((acc, section) => acc + section.lectures.length, 0)}</p>
                        <p><span className="font-medium">Total Quizzes:</span> {sections.filter(section => section.quiz?.questions?.length > 0).length}</p>
                    </div>
                </div>

                <div className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentStep(4)}
                    >
                        <ArrowLeft size={16} className="mr-2" />
                        Previous
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        loading={loading}
                        disabled={loading}
                    >
                        Create Course
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Step Indicator - Horizontal Stepper */}
            <div className="mb-8">
                <nav aria-label="Progress">
                    <ol className="flex items-center w-full">
                        {steps.map((step, idx) => {
                            const completed = isStepCompleted(step.id) && step.id < currentStep;
                            const active = step.id === currentStep;
                            return (
                                <li key={step.id} className="flex items-center w-full">
                                    {/* Step node */}
                                    <div className="flex flex-col items-center text-center">
                                        <div
                                            className={
                                                `flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors duration-200 ` +
                                                (completed
                                                    ? 'bg-primary-600 border-primary-600 text-white'
                                                    : active
                                                        ? 'bg-white border-primary-600 text-primary-600'
                                                        : 'bg-white border-gray-300 text-gray-500')
                                            }
                                            aria-current={active ? 'step' : undefined}
                                        >
                                            {completed ? <Check size={18} /> : <span className="text-sm font-semibold">{step.id}</span>}
                                        </div>
                                        <div className="mt-2 px-2">
                                            <p className={`text-sm font-semibold ${active ? 'text-primary-700' : completed ? 'text-gray-800' : 'text-gray-600'}`}>{step.name}</p>
                                            <p className="text-xs text-gray-500 hidden sm:block">{step.description}</p>
                                        </div>
                                    </div>

                                    {/* Connector */}
                                    {idx !== steps.length - 1 && (
                                        <div className="flex-1 mx-4 hidden sm:block">
                                            <div className="h-1 w-full bg-gray-200 rounded">
                                                <div className={`h-1 rounded bg-gradient-to-r from-primary-600 to-purple-600 transition-all duration-300 ${isStepCompleted(step.id) ? 'w-full' : 'w-0'}`}></div>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </nav>
            </div>

            {/* Form Content */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-8">
                    {currentStep === 1 && <BasicInfoForm />}
                    {currentStep === 2 && <SectionsForm />}
                    {currentStep === 3 && <LecturesForm />}
                    {currentStep === 4 && <QuizzesForm />}
                    {currentStep === 5 && <SettingsForm />}
                </div>
            </div>
        </div>
    );
};

export default CreateCourse;