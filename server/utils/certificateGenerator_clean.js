const puppeteer = require('puppeteer');

const generateCertificate = async (studentName, courseName, instructorName, completionDate, template = 'classic') => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
    const html = getTemplateHTML(template, studentName, courseName, instructorName, completionDate);
    await page.setContent(html);
    
    const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' }
    });
    
    await browser.close();
    return pdfBuffer;
};

const getTemplateHTML = (template, studentName, courseName, instructorName, completionDate) => {
    const templates = {
        classic: generateClassicTemplate(studentName, courseName, instructorName, completionDate),
        modern: generateModernTemplate(studentName, courseName, instructorName, completionDate),
        elegant: generateElegantTemplate(studentName, courseName, instructorName, completionDate),
        professional: generateProfessionalTemplate(studentName, courseName, instructorName, completionDate),
        creative: generateCreativeTemplate(studentName, courseName, instructorName, completionDate)
    };
    return templates[template] || templates.classic;
};

const generateClassicTemplate = (studentName, courseName, instructorName, completionDate) => {
    return `<!DOCTYPE html><html><head><style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lora:wght@400;500&display=swap');
        body { font-family: 'Lora', serif; margin: 0; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .certificate { background: white; padding: 80px 60px; border-radius: 15px; box-shadow: 0 25px 50px rgba(0,0,0,0.15); text-align: center; max-width: 900px; width: 100%; border: 12px solid #f8f9fa; position: relative; overflow: hidden; }
        .certificate::before { content: ''; position: absolute; top: 20px; left: 20px; right: 20px; bottom: 20px; border: 3px solid #e74c3c; border-radius: 8px; pointer-events: none; }
        .header { font-family: 'Playfair Display', serif; color: #2c3e50; font-size: 56px; margin-bottom: 15px; font-weight: 700; letter-spacing: 4px; }
        .subheader { color: #7f8c8d; font-size: 28px; margin-bottom: 50px; font-weight: 400; letter-spacing: 2px; }
        .student-name { font-family: 'Playfair Display', serif; color: #e74c3c; font-size: 48px; margin: 40px 0; font-weight: 700; text-transform: capitalize; letter-spacing: 1px; text-decoration: underline; text-decoration-color: #e74c3c; text-underline-offset: 10px; }
        .course-name { color: #2c3e50; font-size: 32px; margin: 30px 0; font-style: italic; font-weight: 500; }
        .completion-text { color: #5a6c7d; font-size: 20px; margin: 35px 0; font-weight: 400; }
        .instructor-info { margin-top: 80px; display: flex; justify-content: space-between; align-items: center; }
        .instructor-name, .date { color: #2c3e50; font-size: 18px; border-top: 3px solid #e74c3c; padding-top: 15px; flex: 1; font-weight: 500; }
        .decoration { width: 120px; height: 6px; background: linear-gradient(90deg, #e74c3c, #c0392b); margin: 25px auto; border-radius: 3px; }
        .logo { position: absolute; top: 40px; right: 40px; font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; color: #e74c3c; }
    </style></head><body><div class="certificate">
        <div class="logo">EduMe</div>
        <div class="header">CERTIFICATE</div>
        <div class="subheader">OF COMPLETION</div>
        <div class="decoration"></div>
        <div class="completion-text">This is to certify that</div>
        <div class="student-name">${studentName}</div>
        <div class="completion-text">has successfully completed the course</div>
        <div class="course-name">"${courseName}"</div>
        <div class="decoration"></div>
        <div class="instructor-info">
            <div class="instructor-name"><strong>Instructor:</strong><br>${instructorName}</div>
            <div class="date"><strong>Date:</strong><br>${new Date(completionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
    </div></body></html>`;
};

const generateModernTemplate = (studentName, courseName, instructorName, completionDate) => {
    return `<!DOCTYPE html><html><head><style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Space+Grotesk:wght@400;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .certificate { background: white; padding: 60px; border-radius: 20px; box-shadow: 0 30px 60px rgba(0,0,0,0.12); text-align: center; max-width: 900px; width: 100%; position: relative; overflow: hidden; }
        .certificate::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 8px; background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899); }
        .header { font-family: 'Space Grotesk', sans-serif; color: #1f2937; font-size: 48px; margin-bottom: 10px; font-weight: 700; letter-spacing: -1px; }
        .subheader { color: #6b7280; font-size: 20px; margin-bottom: 60px; font-weight: 300; letter-spacing: 3px; text-transform: uppercase; }
        .achievement-section { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 50px 40px; border-radius: 16px; margin: 40px 0; border-left: 6px solid #6366f1; }
        .student-name { font-family: 'Space Grotesk', sans-serif; color: #6366f1; font-size: 42px; margin: 20px 0; font-weight: 600; text-transform: capitalize; }
        .course-name { color: #1f2937; font-size: 28px; margin: 25px 0; font-weight: 600; line-height: 1.3; }
        .completion-text { color: #4b5563; font-size: 18px; margin: 20px 0; font-weight: 400; }
        .instructor-info { margin-top: 60px; display: flex; justify-content: space-between; align-items: center; padding-top: 30px; border-top: 2px solid #e5e7eb; }
        .instructor-name, .date { color: #374151; font-size: 16px; font-weight: 500; }
        .logo { position: absolute; top: 30px; right: 30px; font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .badge { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 8px 20px; border-radius: 25px; font-size: 14px; font-weight: 600; margin-top: 20px; letter-spacing: 1px; }
    </style></head><body><div class="certificate">
        <div class="logo">EduMe</div>
        <div class="header">CERTIFICATE</div>
        <div class="subheader">OF ACHIEVEMENT</div>
        <div class="achievement-section">
            <div class="completion-text">Awarded to</div>
            <div class="student-name">${studentName}</div>
            <div class="completion-text">for successfully completing</div>
            <div class="course-name">${courseName}</div>
            <div class="badge">COMPLETED</div>
        </div>
        <div class="instructor-info">
            <div class="instructor-name"><strong>Instructor:</strong> ${instructorName}</div>
            <div class="date"><strong>Completed:</strong> ${new Date(completionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
        </div>
    </div></body></html>`;
};

const generateElegantTemplate = (studentName, courseName, instructorName, completionDate) => {
    return `<!DOCTYPE html><html><head><style>
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=Montserrat:wght@300;400;500;600&display=swap');
        body { font-family: 'Montserrat', sans-serif; margin: 0; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .certificate { background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%); padding: 80px 70px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; max-width: 900px; width: 100%; position: relative; border: 1px solid #d4af37; }
        .certificate::before { content: ''; position: absolute; top: 15px; left: 15px; right: 15px; bottom: 15px; border: 2px solid #d4af37; pointer-events: none; }
        .header { font-family: 'Cormorant Garamond', serif; color: #2c3e50; font-size: 52px; margin-bottom: 10px; font-weight: 600; letter-spacing: 3px; }
        .subheader { color: #7f8c8d; font-size: 22px; margin-bottom: 40px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; }
        .student-name { font-family: 'Cormorant Garamond', serif; color: #2c3e50; font-size: 46px; margin: 35px 0; font-weight: 600; text-transform: capitalize; font-style: italic; position: relative; }
        .student-name::after { content: ''; position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 60%; height: 1px; background: #d4af37; }
        .course-name { color: #34495e; font-size: 28px; margin: 30px 0; font-weight: 400; font-style: italic; line-height: 1.4; }
        .completion-text { color: #5a6c7d; font-size: 18px; margin: 25px 0; font-weight: 300; letter-spacing: 1px; }
        .instructor-info { margin-top: 60px; display: flex; justify-content: space-between; align-items: center; }
        .instructor-name, .date { color: #2c3e50; font-size: 16px; font-weight: 400; border-top: 1px solid #d4af37; padding-top: 10px; flex: 1; margin: 0 20px; }
        .logo { position: absolute; top: 50px; right: 50px; font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 700; color: #d4af37; font-style: italic; }
        .ornament { font-size: 40px; color: #d4af37; margin: 20px 0; }
    </style></head><body><div class="certificate">
        <div class="logo">EduMe</div>
        <div class="ornament">❦</div>
        <div class="header">CERTIFICATE</div>
        <div class="subheader">of Excellence</div>
        <div class="completion-text">This is to certify that</div>
        <div class="student-name">${studentName}</div>
        <div class="completion-text">has successfully completed the course</div>
        <div class="course-name">"${courseName}"</div>
        <div class="completion-text">with distinction and excellence</div>
        <div class="ornament">❦</div>
        <div class="instructor-info">
            <div class="instructor-name">${instructorName}<br><small style="font-size: 12px; color: #7f8c8d;">Course Instructor</small></div>
            <div class="date">${new Date(completionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}<br><small style="font-size: 12px; color: #7f8c8d;">Date of Completion</small></div>
        </div>
    </div></body></html>`;
};

const generateProfessionalTemplate = (studentName, courseName, instructorName, completionDate) => {
    return `<!DOCTYPE html><html><head><style>
        @import url('https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;600;700&family=Merriweather:wght@300;400;700&display=swap');
        body { font-family: 'Source Sans Pro', sans-serif; margin: 0; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .certificate { background: white; padding: 60px; border-radius: 8px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); text-align: center; max-width: 900px; width: 100%; position: relative; border-left: 8px solid #2c5aa0; }
        .header { font-family: 'Merriweather', serif; color: #2c5aa0; font-size: 44px; margin-bottom: 8px; font-weight: 700; letter-spacing: 1px; }
        .subheader { color: #6c757d; font-size: 18px; margin-bottom: 40px; font-weight: 400; letter-spacing: 2px; text-transform: uppercase; }
        .student-name { font-family: 'Merriweather', serif; color: #2c5aa0; font-size: 38px; margin: 30px 0; font-weight: 700; text-transform: capitalize; border-bottom: 2px solid #2c5aa0; padding-bottom: 10px; display: inline-block; }
        .course-name { color: #495057; font-size: 26px; margin: 25px 0; font-weight: 600; line-height: 1.4; }
        .completion-text { color: #6c757d; font-size: 16px; margin: 20px 0; font-weight: 400; line-height: 1.5; }
        .instructor-info { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 30px; border-top: 2px solid #e9ecef; }
        .instructor-name, .date { color: #495057; font-size: 14px; font-weight: 600; text-align: center; flex: 1; margin: 0 20px; }
        .signature-line { border-top: 2px solid #2c5aa0; margin-bottom: 10px; width: 200px; margin-left: auto; margin-right: auto; }
        .logo { position: absolute; top: 30px; left: 30px; font-family: 'Merriweather', serif; font-size: 24px; font-weight: 700; color: #2c5aa0; }
    </style></head><body><div class="certificate">
        <div class="logo">EduMe</div>
        <div class="header">CERTIFICATE</div>
        <div class="subheader">of Professional Completion</div>
        <div class="completion-text">This certificate is awarded to</div>
        <div class="student-name">${studentName}</div>
        <div class="completion-text">for the successful completion of the professional course</div>
        <div class="course-name">${courseName}</div>
        <div class="instructor-info">
            <div class="instructor-name"><div class="signature-line"></div>Course Instructor<br>${instructorName}</div>
            <div class="date"><div class="signature-line"></div>Date of Completion<br>${new Date(completionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
    </div></body></html>`;
};

const generateCreativeTemplate = (studentName, courseName, instructorName, completionDate) => {
    return `<!DOCTYPE html><html><head><style>
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One:wght@400&family=Open+Sans:wght@300;400;600;700&display=swap');
        body { font-family: 'Open Sans', sans-serif; margin: 0; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .certificate { background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%); padding: 60px; border-radius: 25px; box-shadow: 0 25px 50px rgba(0,0,0,0.15); text-align: center; max-width: 900px; width: 100%; position: relative; overflow: hidden; border: 8px solid white; }
        .header { font-family: 'Fredoka One', cursive; color: #fff; font-size: 52px; margin-bottom: 10px; text-shadow: 3px 3px 0px #ff6b9d, 6px 6px 0px #c44569; transform: rotate(-2deg); }
        .subheader { color: #fff; font-size: 22px; margin-bottom: 40px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .student-name { font-family: 'Fredoka One', cursive; color: #fff; font-size: 44px; margin: 30px 0; text-transform: capitalize; text-shadow: 3px 3px 0px #ff6b9d; background: rgba(255,255,255,0.2); padding: 20px; border-radius: 15px; transform: rotate(1deg); }
        .course-name { color: #fff; font-size: 28px; margin: 25px 0; font-weight: 700; line-height: 1.4; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); background: rgba(255,255,255,0.15); padding: 15px; border-radius: 10px; }
        .completion-text { color: #fff; font-size: 18px; margin: 20px 0; font-weight: 600; text-shadow: 1px 1px 2px rgba(0,0,0,0.3); }
        .achievement-badges { display: flex; justify-content: center; gap: 20px; margin: 40px 0; flex-wrap: wrap; }
        .badge { background: linear-gradient(135deg, #ffd700, #ffed4e); color: #333; padding: 12px 20px; border-radius: 25px; font-size: 14px; font-weight: 700; box-shadow: 0 5px 15px rgba(0,0,0,0.2); transform: rotate(-5deg); }
        .instructor-info { margin-top: 50px; display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.2); padding: 20px; border-radius: 15px; }
        .instructor-name, .date { color: #fff; font-size: 16px; font-weight: 600; text-shadow: 1px 1px 2px rgba(0,0,0,0.3); }
        .logo { position: absolute; top: 30px; right: 30px; font-family: 'Fredoka One', cursive; font-size: 28px; color: #fff; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); transform: rotate(10deg); }
        .fun-element { font-size: 60px; margin: 20px 0; }
    </style></head><body><div class="certificate">
        <div class="logo">EduMe</div>
        <div class="fun-element">🎉</div>
        <div class="header">AWESOME!</div>
        <div class="subheader">Certificate of Achievement</div>
        <div class="completion-text">Congratulations to</div>
        <div class="student-name">${studentName}</div>
        <div class="completion-text">for crushing the course</div>
        <div class="course-name">${courseName}</div>
        <div class="achievement-badges">
            <div class="badge">🏆 COMPLETED</div>
            <div class="badge">⭐ EXCELLENT</div>
            <div class="badge">🎯 ACHIEVED</div>
        </div>
        <div class="fun-element">🚀</div>
        <div class="instructor-info">
            <div class="instructor-name"><strong>Instructor:</strong><br>${instructorName}</div>
            <div class="date"><strong>Completed:</strong><br>${new Date(completionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
        </div>
    </div></body></html>`;
};

module.exports = { generateCertificate };
