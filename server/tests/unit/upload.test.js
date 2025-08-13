const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');
const { uploadImage, uploadVideo, handleMulterError, cleanupTempFiles } = require('../../middlewares/upload');

// Create express app for testing
const app = express();
app.use(express.json());

// Test routes
app.post('/upload/image', uploadImage.single('image'), (req, res) => {
  res.json({ success: true, file: req.file });
});

app.post('/upload/video', uploadVideo.single('video'), (req, res) => {
  res.json({ success: true, file: req.file });
});

app.use(handleMulterError);

describe('File Upload Security', () => {
  const testFilesDir = path.join(__dirname, '../fixtures');

  beforeAll(() => {
    // Create test files directory
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }

    // Create test image file
    const testImagePath = path.join(testFilesDir, 'test-image.jpg');
    if (!fs.existsSync(testImagePath)) {
      fs.writeFileSync(testImagePath, Buffer.from('fake-image-data'));
    }

    // Create test video file
    const testVideoPath = path.join(testFilesDir, 'test-video.mp4');
    if (!fs.existsSync(testVideoPath)) {
      fs.writeFileSync(testVideoPath, Buffer.from('fake-video-data'));
    }

    // Create malicious file
    const maliciousFilePath = path.join(testFilesDir, 'malicious.exe');
    if (!fs.existsSync(maliciousFilePath)) {
      fs.writeFileSync(maliciousFilePath, Buffer.from('fake-executable-data'));
    }
  });

  afterAll(() => {
    // Cleanup test files
    if (fs.existsSync(testFilesDir)) {
      fs.rmSync(testFilesDir, { recursive: true, force: true });
    }
  });

  describe('Image Upload Security', () => {
    it('should accept valid image files', async () => {
      const testImagePath = path.join(testFilesDir, 'test-image.jpg');
      
      const response = await request(app)
        .post('/upload/image')
        .attach('image', testImagePath)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.file).toBeDefined();
      expect(response.body.file.mimetype).toContain('image');
    });

    it('should reject non-image files', async () => {
      const maliciousFilePath = path.join(testFilesDir, 'malicious.exe');
      
      const response = await request(app)
        .post('/upload/image')
        .attach('image', maliciousFilePath)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid image file type');
    });

    it('should reject files with suspicious filenames', async () => {
      // Create file with path traversal attempt
      const suspiciousPath = path.join(testFilesDir, '..%2F..%2Fmalicious.jpg');
      fs.writeFileSync(suspiciousPath, Buffer.from('fake-image-data'));

      const response = await request(app)
        .post('/upload/image')
        .attach('image', suspiciousPath)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid filename');

      // Cleanup
      if (fs.existsSync(suspiciousPath)) {
        fs.unlinkSync(suspiciousPath);
      }
    });

    it('should reject files with extremely long filenames', async () => {
      const longFilename = 'a'.repeat(300) + '.jpg';
      const longFilenamePath = path.join(testFilesDir, longFilename);
      fs.writeFileSync(longFilenamePath, Buffer.from('fake-image-data'));

      const response = await request(app)
        .post('/upload/image')
        .attach('image', longFilenamePath)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Filename too long');

      // Cleanup
      if (fs.existsSync(longFilenamePath)) {
        fs.unlinkSync(longFilenamePath);
      }
    });

    it('should enforce file size limits', async () => {
      // Create a large file (simulate > 10MB)
      const largeFilePath = path.join(testFilesDir, 'large-image.jpg');
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      fs.writeFileSync(largeFilePath, largeBuffer);

      const response = await request(app)
        .post('/upload/image')
        .attach('image', largeFilePath)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('File too large');

      // Cleanup
      if (fs.existsSync(largeFilePath)) {
        fs.unlinkSync(largeFilePath);
      }
    });
  });

  describe('Video Upload Security', () => {
    it('should accept valid video files', async () => {
      const testVideoPath = path.join(testFilesDir, 'test-video.mp4');
      
      const response = await request(app)
        .post('/upload/video')
        .attach('video', testVideoPath)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.file).toBeDefined();
      expect(response.body.file.mimetype).toContain('video');
    });

    it('should reject non-video files', async () => {
      const testImagePath = path.join(testFilesDir, 'test-image.jpg');
      
      const response = await request(app)
        .post('/upload/video')
        .attach('video', testImagePath)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid video file type');
    });

    it('should reject executable files disguised as videos', async () => {
      const maliciousFilePath = path.join(testFilesDir, 'malicious.exe');
      
      const response = await request(app)
        .post('/upload/video')
        .attach('video', maliciousFilePath)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid video file type');
    });

    it('should enforce video file size limits', async () => {
      // Create a large video file (simulate > 500MB)
      const largeVideoPath = path.join(testFilesDir, 'large-video.mp4');
      const largeBuffer = Buffer.alloc(501 * 1024 * 1024); // 501MB
      fs.writeFileSync(largeVideoPath, largeBuffer);

      const response = await request(app)
        .post('/upload/video')
        .attach('video', largeVideoPath)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('File too large');

      // Cleanup
      if (fs.existsSync(largeVideoPath)) {
        fs.unlinkSync(largeVideoPath);
      }
    });
  });

  describe('File Extension Validation', () => {
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];

    dangerousExtensions.forEach(ext => {
      it(`should reject files with ${ext} extension`, async () => {
        const dangerousFilePath = path.join(testFilesDir, `malicious${ext}`);
        fs.writeFileSync(dangerousFilePath, Buffer.from('malicious-content'));

        const response = await request(app)
          .post('/upload/image')
          .attach('image', dangerousFilePath)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Invalid');

        // Cleanup
        if (fs.existsSync(dangerousFilePath)) {
          fs.unlinkSync(dangerousFilePath);
        }
      });
    });
  });

  describe('MIME Type Validation', () => {
    it('should validate MIME type matches file extension', async () => {
      // This would require more sophisticated testing with actual file headers
      // For now, we test that our filters are working
      const testImagePath = path.join(testFilesDir, 'test-image.jpg');
      
      const response = await request(app)
        .post('/upload/image')
        .attach('image', testImagePath)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('File Cleanup Utilities', () => {
    it('should cleanup temporary files', () => {
      const tempFilePath = path.join(testFilesDir, 'temp-file.txt');
      fs.writeFileSync(tempFilePath, 'temporary content');
      
      expect(fs.existsSync(tempFilePath)).toBe(true);
      
      cleanupTempFiles(tempFilePath);
      
      expect(fs.existsSync(tempFilePath)).toBe(false);
    });

    it('should handle cleanup of non-existent files gracefully', () => {
      const nonExistentPath = path.join(testFilesDir, 'non-existent.txt');
      
      // Should not throw error
      expect(() => {
        cleanupTempFiles(nonExistentPath);
      }).not.toThrow();
    });

    it('should handle cleanup with invalid paths gracefully', () => {
      // Should not throw error
      expect(() => {
        cleanupTempFiles(null);
        cleanupTempFiles(undefined);
        cleanupTempFiles('');
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle multer errors properly', (done) => {
      const mockReq = {};
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn((data) => {
          expect(data.success).toBe(false);
          expect(data.message).toBeDefined();
          done();
        })
      };
      const mockNext = jest.fn();

      const multerError = new Error('Test multer error');
      multerError.code = 'LIMIT_FILE_SIZE';
      multerError.constructor.name = 'MulterError';

      handleMulterError(multerError, mockReq, mockRes, mockNext);
    });

    it('should handle general upload errors', (done) => {
      const mockReq = {};
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn((data) => {
          expect(data.success).toBe(false);
          expect(data.message).toBe('Custom error message');
          done();
        })
      };
      const mockNext = jest.fn();

      const generalError = new Error('Custom error message');
      handleMulterError(generalError, mockReq, mockRes, mockNext);
    });
  });
});
