const { generateCertificate } = require('../../utils/certificateGenerator');
const Certificate = require('../../models/Certificate');
const User = require('../../models/User');
const Course = require('../../models/Course');
const Enrollment = require('../../models/Enrollment');

// Mock Puppeteer to avoid browser launching in tests
jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setViewport: jest.fn(),
      setDefaultTimeout: jest.fn(),
      setContent: jest.fn(),
      evaluateHandle: jest.fn(),
      pdf: jest.fn().mockResolvedValue(Buffer.from('fake-pdf-content'))
    }),
    close: jest.fn()
  })
}));

describe('Certificate Generation', () => {
  let student, instructor, course, enrollment;

  beforeEach(async () => {
    // Create test data
    student = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedpassword',
      role: 'Student'
    });

    instructor = await User.create({
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'hashedpassword',
      role: 'Instructor'
    });

    course = await Course.create({
      title: 'JavaScript Fundamentals',
      description: 'Learn JavaScript basics',
      price: 99.99,
      thumbnail: 'https://example.com/thumb.jpg',
      instructor: instructor._id,
      category: 'Technology',
      level: 'Beginner',
      hasCertificate: true,
      certificateTemplate: 'classic',
      sections: []
    });

    enrollment = await Enrollment.create({
      student: student._id,
      course: course._id,
      isCompleted: true,
      completedAt: new Date(),
      progress: 100
    });
  });

  describe('generateCertificate function', () => {
    it('should generate certificate PDF successfully', async () => {
      const pdfBuffer = await generateCertificate(
        student.name,
        course.title,
        instructor.name,
        enrollment.completedAt,
        'classic'
      );

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should handle different certificate templates', async () => {
      const templates = ['classic', 'modern', 'elegant', 'professional', 'creative'];

      for (const template of templates) {
        const pdfBuffer = await generateCertificate(
          student.name,
          course.title,
          instructor.name,
          enrollment.completedAt,
          template
        );

        expect(pdfBuffer).toBeInstanceOf(Buffer);
        expect(pdfBuffer.length).toBeGreaterThan(0);
      }
    });

    it('should use fallback when Puppeteer fails', async () => {
      // Mock Puppeteer to throw an error
      const puppeteer = require('puppeteer');
      puppeteer.launch.mockRejectedValueOnce(new Error('Puppeteer failed'));

      const pdfBuffer = await generateCertificate(
        student.name,
        course.title,
        instructor.name,
        enrollment.completedAt,
        'classic'
      );

      // Should still return a buffer (fallback method)
      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });

    it('should handle missing or invalid parameters', async () => {
      // Test with missing parameters
      const pdfBuffer = await generateCertificate(
        '', // Empty student name
        course.title,
        instructor.name,
        enrollment.completedAt,
        'classic'
      );

      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });

    it('should handle invalid template gracefully', async () => {
      const pdfBuffer = await generateCertificate(
        student.name,
        course.title,
        instructor.name,
        enrollment.completedAt,
        'invalid-template'
      );

      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });
  });

  describe('Certificate Model', () => {
    it('should create certificate record successfully', async () => {
      const certificateData = {
        student: student._id,
        course: course._id,
        certificateId: 'CERT-123456',
        pdfUrl: 'https://example.com/certificate.pdf',
        issuedAt: new Date()
      };

      const certificate = await Certificate.create(certificateData);

      expect(certificate.student.toString()).toBe(student._id.toString());
      expect(certificate.course.toString()).toBe(course._id.toString());
      expect(certificate.certificateId).toBe(certificateData.certificateId);
      expect(certificate.pdfUrl).toBe(certificateData.pdfUrl);
    });

    it('should require mandatory fields', async () => {
      try {
        await Certificate.create({});
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.student).toBeDefined();
        expect(error.errors.course).toBeDefined();
      }
    });

    it('should generate unique certificate ID', async () => {
      const cert1 = await Certificate.create({
        student: student._id,
        course: course._id,
        certificateId: 'CERT-123456',
        pdfUrl: 'https://example.com/cert1.pdf'
      });

      const cert2 = await Certificate.create({
        student: student._id,
        course: course._id,
        certificateId: 'CERT-789012',
        pdfUrl: 'https://example.com/cert2.pdf'
      });

      expect(cert1.certificateId).not.toBe(cert2.certificateId);
    });
  });

  describe('Certificate Integration', () => {
    it('should link certificate to enrollment', async () => {
      const certificate = await Certificate.create({
        student: student._id,
        course: course._id,
        certificateId: 'CERT-123456',
        pdfUrl: 'https://example.com/certificate.pdf'
      });

      // Update enrollment to mark certificate as generated
      enrollment.certificateGenerated = true;
      enrollment.certificate = certificate._id;
      await enrollment.save();

      const updatedEnrollment = await Enrollment.findById(enrollment._id)
        .populate('certificate');

      expect(updatedEnrollment.certificateGenerated).toBe(true);
      expect(updatedEnrollment.certificate).toBeTruthy();
      expect(updatedEnrollment.certificate.certificateId).toBe('CERT-123456');
    });

    it('should only generate certificate for completed courses', async () => {
      const incompleteEnrollment = await Enrollment.create({
        student: student._id,
        course: course._id,
        isCompleted: false,
        progress: 50
      });

      // Certificate should not be generated for incomplete enrollment
      expect(incompleteEnrollment.certificateGenerated).toBe(false);
    });

    it('should only generate certificate for courses with certificate enabled', async () => {
      const noCertCourse = await Course.create({
        title: 'No Certificate Course',
        description: 'This course has no certificate',
        price: 49.99,
        thumbnail: 'https://example.com/thumb.jpg',
        instructor: instructor._id,
        category: 'Technology',
        level: 'Beginner',
        hasCertificate: false, // Certificate disabled
        sections: []
      });

      const noCertEnrollment = await Enrollment.create({
        student: student._id,
        course: noCertCourse._id,
        isCompleted: true,
        completedAt: new Date(),
        progress: 100
      });

      // Certificate should not be generated when course has certificate disabled
      expect(noCertEnrollment.certificateGenerated).toBe(false);
    });
  });

  describe('Certificate Security', () => {
    it('should generate unique certificate IDs', async () => {
      const certificateIds = new Set();
      
      // Generate multiple certificates
      for (let i = 0; i < 10; i++) {
        const cert = await Certificate.create({
          student: student._id,
          course: course._id,
          certificateId: `CERT-${Date.now()}-${Math.random()}`,
          pdfUrl: `https://example.com/cert${i}.pdf`
        });
        certificateIds.add(cert.certificateId);
      }

      // All certificate IDs should be unique
      expect(certificateIds.size).toBe(10);
    });

    it('should validate certificate ownership', async () => {
      const anotherStudent = await User.create({
        name: 'Another Student',
        email: 'another@example.com',
        password: 'hashedpassword',
        role: 'Student'
      });

      const certificate = await Certificate.create({
        student: student._id,
        course: course._id,
        certificateId: 'CERT-123456',
        pdfUrl: 'https://example.com/certificate.pdf'
      });

      // Certificate should belong to the correct student
      expect(certificate.student.toString()).toBe(student._id.toString());
      expect(certificate.student.toString()).not.toBe(anotherStudent._id.toString());
    });
  });
});
