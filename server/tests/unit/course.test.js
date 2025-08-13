const request = require('supertest');
const express = require('express');
const Course = require('../../models/Course');
const User = require('../../models/User');
const courseController = require('../../controllers/courseController');
const auth = require('../../middlewares/auth');

// Mock auth middleware
jest.mock('../../middlewares/auth');

// Create express app for testing
const app = express();
app.use(express.json());

// Mock routes with auth
app.post('/courses', auth, courseController.createCourse);
app.get('/courses', courseController.getAllCourses);
app.get('/courses/:id', courseController.getCourseById);
app.put('/courses/:id', auth, courseController.updateCourse);
app.delete('/courses/:id', auth, courseController.deleteCourse);

describe('Course Controller', () => {
  let instructorUser;
  let studentUser;

  beforeEach(async () => {
    // Create test users
    instructorUser = await User.create({
      name: 'Test Instructor',
      email: 'instructor@example.com',
      password: 'hashedpassword',
      role: 'Instructor'
    });

    studentUser = await User.create({
      name: 'Test Student',
      email: 'student@example.com',
      password: 'hashedpassword',
      role: 'Student'
    });

    // Mock auth middleware to return instructor user
    auth.mockImplementation((req, res, next) => {
      req.user = instructorUser;
      next();
    });
  });

  describe('POST /courses', () => {
    it('should create a new course successfully', async () => {
      const courseData = {
        title: 'Test Course',
        description: 'A test course description',
        price: 99.99,
        category: 'Technology',
        level: 'Beginner',
        sections: [{
          title: 'Introduction',
          lectures: [{
            title: 'Welcome',
            description: 'Welcome to the course',
            videoUrl: 'https://example.com/video.mp4',
            duration: 300,
            order: 1
          }],
          order: 1
        }]
      };

      const response = await request(app)
        .post('/courses')
        .send(courseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.course.title).toBe(courseData.title);
      expect(response.body.course.instructor).toBe(instructorUser._id.toString());
      expect(response.body.course.sections).toHaveLength(1);

      // Verify course was created in database
      const course = await Course.findById(response.body.course._id);
      expect(course).toBeTruthy();
      expect(course.title).toBe(courseData.title);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/courses')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should validate course level enum', async () => {
      const courseData = {
        title: 'Test Course',
        description: 'A test course description',
        price: 99.99,
        category: 'Technology',
        level: 'InvalidLevel', // Invalid level
        sections: []
      };

      const response = await request(app)
        .post('/courses')
        .send(courseData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should only allow instructors to create courses', async () => {
      // Mock auth to return student user
      auth.mockImplementation((req, res, next) => {
        req.user = studentUser;
        next();
      });

      const courseData = {
        title: 'Test Course',
        description: 'A test course description',
        price: 99.99,
        category: 'Technology',
        level: 'Beginner',
        sections: []
      };

      const response = await request(app)
        .post('/courses')
        .send(courseData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only instructors');
    });
  });

  describe('GET /courses', () => {
    beforeEach(async () => {
      // Create test courses
      await Course.create({
        title: 'JavaScript Basics',
        description: 'Learn JavaScript fundamentals',
        price: 49.99,
        thumbnail: 'https://example.com/thumb1.jpg',
        instructor: instructorUser._id,
        category: 'Technology',
        level: 'Beginner',
        isPublished: true,
        sections: []
      });

      await Course.create({
        title: 'Advanced React',
        description: 'Master React development',
        price: 99.99,
        thumbnail: 'https://example.com/thumb2.jpg',
        instructor: instructorUser._id,
        category: 'Technology',
        level: 'Advanced',
        isPublished: true,
        sections: []
      });

      await Course.create({
        title: 'Unpublished Course',
        description: 'This course is not published',
        price: 79.99,
        thumbnail: 'https://example.com/thumb3.jpg',
        instructor: instructorUser._id,
        category: 'Technology',
        level: 'Intermediate',
        isPublished: false,
        sections: []
      });
    });

    it('should get all published courses', async () => {
      const response = await request(app)
        .get('/courses')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.courses).toHaveLength(2); // Only published courses
      expect(response.body.courses.every(course => course.isPublished)).toBe(true);
    });

    it('should filter courses by category', async () => {
      const response = await request(app)
        .get('/courses?category=Technology')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.courses.every(course => course.category === 'Technology')).toBe(true);
    });

    it('should filter courses by level', async () => {
      const response = await request(app)
        .get('/courses?level=Beginner')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.courses.every(course => course.level === 'Beginner')).toBe(true);
    });

    it('should search courses by title', async () => {
      const response = await request(app)
        .get('/courses?search=JavaScript')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.courses).toHaveLength(1);
      expect(response.body.courses[0].title).toContain('JavaScript');
    });
  });

  describe('GET /courses/:id', () => {
    let testCourse;

    beforeEach(async () => {
      testCourse = await Course.create({
        title: 'Test Course',
        description: 'A test course',
        price: 99.99,
        thumbnail: 'https://example.com/thumb.jpg',
        instructor: instructorUser._id,
        category: 'Technology',
        level: 'Beginner',
        isPublished: true,
        sections: [{
          title: 'Section 1',
          lectures: [{
            title: 'Lecture 1',
            description: 'First lecture',
            videoUrl: 'https://example.com/video1.mp4',
            duration: 600,
            order: 1
          }],
          order: 1
        }]
      });
    });

    it('should get course by ID with populated instructor', async () => {
      const response = await request(app)
        .get(`/courses/${testCourse._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.course._id).toBe(testCourse._id.toString());
      expect(response.body.course.instructor.name).toBe(instructorUser.name);
      expect(response.body.course.sections).toHaveLength(1);
    });

    it('should return 404 for non-existent course', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/courses/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should return 400 for invalid course ID', async () => {
      const response = await request(app)
        .get('/courses/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /courses/:id', () => {
    let testCourse;

    beforeEach(async () => {
      testCourse = await Course.create({
        title: 'Original Title',
        description: 'Original description',
        price: 99.99,
        thumbnail: 'https://example.com/thumb.jpg',
        instructor: instructorUser._id,
        category: 'Technology',
        level: 'Beginner',
        sections: []
      });
    });

    it('should update course successfully', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
        price: 149.99
      };

      const response = await request(app)
        .put(`/courses/${testCourse._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.course.title).toBe(updateData.title);
      expect(response.body.course.price).toBe(updateData.price);

      // Verify update in database
      const updatedCourse = await Course.findById(testCourse._id);
      expect(updatedCourse.title).toBe(updateData.title);
    });

    it('should only allow course instructor to update', async () => {
      const anotherInstructor = await User.create({
        name: 'Another Instructor',
        email: 'another@example.com',
        password: 'hashedpassword',
        role: 'Instructor'
      });

      // Mock auth to return different instructor
      auth.mockImplementation((req, res, next) => {
        req.user = anotherInstructor;
        next();
      });

      const response = await request(app)
        .put(`/courses/${testCourse._id}`)
        .send({ title: 'Unauthorized Update' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('authorized');
    });
  });

  describe('DELETE /courses/:id', () => {
    let testCourse;

    beforeEach(async () => {
      testCourse = await Course.create({
        title: 'Course to Delete',
        description: 'This course will be deleted',
        price: 99.99,
        thumbnail: 'https://example.com/thumb.jpg',
        instructor: instructorUser._id,
        category: 'Technology',
        level: 'Beginner',
        sections: []
      });
    });

    it('should delete course successfully', async () => {
      const response = await request(app)
        .delete(`/courses/${testCourse._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify deletion in database
      const deletedCourse = await Course.findById(testCourse._id);
      expect(deletedCourse).toBeNull();
    });

    it('should only allow course instructor to delete', async () => {
      // Mock auth to return student user
      auth.mockImplementation((req, res, next) => {
        req.user = studentUser;
        next();
      });

      const response = await request(app)
        .delete(`/courses/${testCourse._id}`)
        .expect(403);

      expect(response.body.success).toBe(false);

      // Verify course still exists
      const course = await Course.findById(testCourse._id);
      expect(course).toBeTruthy();
    });
  });
});
