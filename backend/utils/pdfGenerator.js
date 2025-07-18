const PDFDocument = require('pdfkit');

/**
 * Generates a PDF resume from the provided data
 * @param {Object} resumeData - The resume data
 * @param {Object} studentInfo - The student information
 * @param {Stream} stream - The stream to write the PDF to
 * @param {String} template - The template to use (classic, executive, minimalist, creative, technical)
 * @param {String} layout - The layout to use (single-column, two-column)
 */
function generateResumePDF(resumeData, studentInfo, stream, template = 'classic', layout = 'single-column') {
  // Normalize the template parameter
  const normalizedTemplate = (template || 'classic').toLowerCase().trim();
  
  // Normalize the layout parameter
  const normalizedLayout = (layout || 'single-column').toLowerCase().trim();
  
  // Log the template and layout being used for debugging
  console.log(`PDF Generator: Using template "${normalizedTemplate}" with layout "${normalizedLayout}"`);
  
  // Check if resumeData is properly structured
  if (!resumeData || typeof resumeData !== 'object') {
    console.error('Invalid resume data format:', resumeData);
    resumeData = {}; // Provide empty object as fallback
  }
  
  // Check if studentInfo is properly structured
  if (!studentInfo || typeof studentInfo !== 'object') {
    console.error('Invalid student info format:', studentInfo);
    studentInfo = {}; // Provide empty object as fallback
  }
  
  // Ensure resumeData has all required fields with proper string values
  const safeResumeData = {
    objective: typeof resumeData.objective === 'string' ? resumeData.objective : '',
    education: typeof resumeData.education === 'string' ? resumeData.education : '',
    skills: typeof resumeData.skills === 'string' ? resumeData.skills : '',
    languages: typeof resumeData.languages === 'string' ? resumeData.languages : '',
    experience: typeof resumeData.experience === 'string' ? resumeData.experience : '',
    projects: typeof resumeData.projects === 'string' ? resumeData.projects : '',
    certifications: typeof resumeData.certifications === 'string' ? resumeData.certifications : '',
    achievements: typeof resumeData.achievements === 'string' ? resumeData.achievements : '',
    references_info: typeof resumeData.references_info === 'string' ? resumeData.references_info : '',
    additional_info: typeof resumeData.additional_info === 'string' ? resumeData.additional_info : ''
  };
  
  // Ensure studentInfo has all required fields with proper string values
  const safeStudentInfo = {
    name: typeof studentInfo.name === 'string' ? studentInfo.name : 'Student',
    email: typeof studentInfo.email === 'string' ? studentInfo.email : '',
    branch: typeof studentInfo.branch === 'string' ? studentInfo.branch : ''
  };
  
  // Select the appropriate template function
  try {
    switch (normalizedTemplate) {
      case 'classic':
        generateClassicTemplate(safeResumeData, safeStudentInfo, stream, normalizedLayout);
        break;
      case 'executive':
        generateExecutiveTemplate(safeResumeData, safeStudentInfo, stream, normalizedLayout);
        break;
      case 'minimalist':
        generateMinimalistTemplate(safeResumeData, safeStudentInfo, stream, normalizedLayout);
        break;
      case 'creative':
        generateCreativeTemplate(safeResumeData, safeStudentInfo, stream, normalizedLayout);
        break;
      case 'technical':
        generateTechnicalTemplate(safeResumeData, safeStudentInfo, stream, normalizedLayout);
        break;
      case 'professional':
        generateProfessionalTemplate(safeResumeData, safeStudentInfo, stream, normalizedLayout);
        break;
      case 'academic':
        generateAcademicTemplate(safeResumeData, safeStudentInfo, stream, normalizedLayout);
        break;
      case 'elegant':
        generateElegantTemplate(safeResumeData, safeStudentInfo, stream, normalizedLayout);
        break;
      case 'newTemplate1Name': // Give your new template a unique name
        generateNewTemplate1(safeResumeData, safeStudentInfo, stream, normalizedLayout); // Call your new function
        break;
      case 'newTemplate2Name':
        generateNewTemplate2(safeResumeData, safeStudentInfo, stream, normalizedLayout);
        break;
      default:
        console.log(`Unknown template "${normalizedTemplate}", falling back to Classic template`);
        generateClassicTemplate(safeResumeData, safeStudentInfo, stream, normalizedLayout);
    }
    console.log('PDF generation completed successfully');
  } catch (error) {
    console.error('Error generating PDF:', error);
    
    // Create a simple error PDF
    const doc = new PDFDocument();
    doc.pipe(stream);
    
    doc.fontSize(20).text('Error Generating Resume PDF', {
      align: 'center',
      y: 200
    });
    
    doc.fontSize(12).text(`There was an error generating your resume: ${error.message}`, {
      align: 'center',
      y: 250
    });
    
    doc.end();
  }
}



/**
 * Classic template - Distinct: Top header, horizontal section dividers, serif fonts, no sidebar, gold accents
 */
function generateClassicTemplate(resumeData, studentInfo, stream, layout = 'single-column') {
  // OPTIMIZED CLASSIC LAYOUT - Better content distribution with proper spacing
  const doc = new PDFDocument({
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    size: 'A4',
  });
  doc.pipe(stream);

  // Classic color palette
  const gold = '#bfa14a';
  const dark = '#222';
  const light = '#f9f6f2';
  const watermark = '#f5ecd7';
  const sectionLine = '#e0c97f';
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // Subtle watermark background
  doc.save();
  doc.fontSize(80).fillColor(watermark).opacity(0.15)
    .text('RESUME', 60, 300, { angle: 25, align: 'center', width: pageWidth - 120 });
  doc.restore();

  // Top header with better proportions
  doc.rect(0, 0, pageWidth, 90).fill(gold);
  
  // Header border
  doc.rect(0, 85, pageWidth, 5).fill(dark);
  
  doc.fontSize(26)
     .font('Times-Bold')
     .fillColor(dark)
     .text(studentInfo.name.toUpperCase(), 0, 25, { align: 'center' });
  
  let contactInfo = [];
  if (studentInfo.email) contactInfo.push(studentInfo.email);
  if (studentInfo.branch) contactInfo.push(studentInfo.branch);
  
  doc.fontSize(11)
     .font('Times-Roman')
     .fillColor(dark)
     .text(contactInfo.join(' â€¢ '), 0, 58, { align: 'center' });

  // MAIN CONTENT AREA - Properly distributed
  const contentStartY = 110;
  const leftMargin = 40;
  const contentWidth = pageWidth - (leftMargin * 2);
  let currentY = contentStartY;

  // Helper function for section headers
  function addSectionHeader(title, y) {
    doc.rect(leftMargin, y, contentWidth, 2).fill(sectionLine);
    doc.fontSize(14)
       .font('Times-Bold')
       .fillColor(gold)
       .text(title, leftMargin, y + 8);
    return y + 32;
  }

  // Helper function for content
  function addSectionContent(content, y) {
    if (!content) return y;
    doc.fontSize(10)
       .font('Times-Roman')
       .fillColor(dark)
       .text(content, leftMargin, y, { 
         width: contentWidth,
         align: 'justify',
         lineGap: 3
       });
    return doc.y + 15;
  }

  // PROPERLY DISTRIBUTED SECTIONS
  
  // Professional Summary
  if (resumeData.objective) {
    currentY = addSectionHeader('PROFESSIONAL SUMMARY', currentY);
    currentY = addSectionContent(resumeData.objective, currentY);
  }

  // Education and Experience in two columns for better balance
  if (resumeData.education || resumeData.experience) {
    const col1Width = (contentWidth - 20) / 2;
    const col2X = leftMargin + col1Width + 20;
    
    if (resumeData.education) {
      currentY = addSectionHeader('EDUCATION', currentY);
      doc.fontSize(10)
         .font('Times-Roman')
         .fillColor(dark)
         .text(resumeData.education, leftMargin, currentY, { 
           width: col1Width,
           lineGap: 3
         });
    }
    
    if (resumeData.experience) {
      doc.fontSize(14)
         .font('Times-Bold')
         .fillColor(gold)
         .text('EXPERIENCE', col2X, currentY - 32);
      doc.fontSize(10)
         .font('Times-Roman')
         .fillColor(dark)
         .text(resumeData.experience, col2X, currentY, { 
           width: col1Width,
           lineGap: 3
         });
    }
    
    currentY = doc.y + 20;
  }

  // Skills and Languages in two columns
  if (resumeData.skills || resumeData.languages) {
    const col1Width = (contentWidth - 20) / 2;
    const col2X = leftMargin + col1Width + 20;
    
    if (resumeData.skills) {
      currentY = addSectionHeader('CORE SKILLS', currentY);
      doc.fontSize(10)
         .font('Times-Roman')
         .fillColor(dark)
         .text(resumeData.skills, leftMargin, currentY, { 
           width: col1Width,
           lineGap: 3
         });
    }
    
    if (resumeData.languages) {
      doc.fontSize(14)
         .font('Times-Bold')
         .fillColor(gold)
         .text('LANGUAGES', col2X, currentY - 32);
      doc.fontSize(10)
         .font('Times-Roman')
         .fillColor(dark)
         .text(resumeData.languages, col2X, currentY, { 
           width: col1Width,
           lineGap: 3
         });
    }
    
    currentY = doc.y + 20;
  }

  // Single column sections
  const singleColumnSections = [
    { title: 'PROJECTS', content: resumeData.projects },
    { title: 'CERTIFICATIONS', content: resumeData.certifications },
    { title: 'ACHIEVEMENTS', content: resumeData.achievements },
    { title: 'ADDITIONAL INFORMATION', content: resumeData.additional_info }
  ];

  singleColumnSections.forEach(section => {
    if (section.content) {
      currentY = addSectionHeader(section.title, currentY);
      currentY = addSectionContent(section.content, currentY);
    }
  });

  // Footer
  doc.rect(0, pageHeight - 40, pageWidth, 40).fill(light);
  doc.fontSize(8).font('Times-Roman').fillColor(gold)
     .text(`${studentInfo.name} â€¢ Classic Resume â€¢ ${new Date().toLocaleDateString()}`, 0, pageHeight - 25, { align: 'center' });
  doc.end();
}

/**
 * Executive template - Professional with dark blue accents and formal layout
 */
function generateExecutiveTemplate(resumeData, studentInfo, stream, layout = 'single-column') {
  const doc = new PDFDocument({
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    size: 'A4',
  });

  doc.pipe(stream);

  // Executive color palette - Dark, professional
  const primaryColor = '#1e3a8a';    // Dark blue
  const secondaryColor = '#3b82f6';  // Medium blue
  const accentColor = '#60a5fa';     // Light blue
  const textDark = '#0f172a';        // Very dark text
  const textMedium = '#475569';      // Medium text
  const textLight = '#64748b';       // Light text
  const backgroundColor = '#ffffff';  // White background
  const cardBg = '#f8fafc';          // Light gray background

  // Clean background
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(backgroundColor);

  // Executive header with formal styling
  const headerHeight = 120;
  doc.rect(0, 0, doc.page.width, headerHeight).fill(primaryColor);
  
  // Header border accent
  doc.rect(0, headerHeight - 4, doc.page.width, 4).fill(accentColor);

  // Executive name styling
  doc.fontSize(32)
     .font('Helvetica-Bold')
     .fillColor('#ffffff')
     .text(studentInfo.name.toUpperCase(), 0, 25, { 
       width: doc.page.width,
       align: 'center',
       characterSpacing: 3
     });

  // Professional contact info
  let contactInfo = [];
  if (studentInfo.email) contactInfo.push(studentInfo.email);
  if (studentInfo.branch) contactInfo.push(studentInfo.branch);
  
  doc.fontSize(12)
     .font('Helvetica')
     .fillColor('#ffffff')
     .text(contactInfo.join(' â€¢ '), 0, 70, { 
       width: doc.page.width,
       align: 'center'
     });

  // Executive tagline
  doc.fontSize(10)
     .font('Helvetica-Oblique')
     .fillColor(accentColor)
     .text('EXECUTIVE PROFESSIONAL', 0, 90, { 
       width: doc.page.width,
       align: 'center'
     });

  // Content area with proper spacing
  const contentY = headerHeight + 30;
  const contentWidth = doc.page.width - 80;
  const leftMargin = 40;
  let currentY = contentY;

  // Helper function for executive sections
  function addExecutiveSection(title, content, yPos) {
    if (!content) return yPos;
    
    // Section header with executive styling
    doc.rect(leftMargin, yPos, contentWidth, 3).fill(primaryColor);
    yPos += 8;
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(primaryColor)
       .text(title, leftMargin, yPos);
    yPos += 25;
    
    // Content with proper formatting
    const lines = content.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      // Check if it's a header line (contains keywords)
      if (trimmedLine.includes('University') || trimmedLine.includes('College') || 
          trimmedLine.includes('Company') || trimmedLine.includes('Project') ||
          trimmedLine.includes('Certificate')) {
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor(textDark)
           .text(trimmedLine, leftMargin, yPos, { width: contentWidth });
        yPos += 18;
      } else {
        let displayLine = trimmedLine;
        if (displayLine.startsWith('â€¢') || displayLine.startsWith('-')) {
          displayLine = displayLine.substring(1).trim();
        }
        
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(textMedium)
           .text('â€¢ ' + displayLine, leftMargin + 15, yPos, { 
             width: contentWidth - 15,
             lineGap: 2
           });
        yPos = doc.y + 5;
      }
    });
    
    return yPos + 20;
  }

  // Executive sections in professional order
  currentY = addExecutiveSection('EXECUTIVE SUMMARY', resumeData.objective, currentY);
  currentY = addExecutiveSection('PROFESSIONAL EXPERIENCE', resumeData.experience, currentY);
  currentY = addExecutiveSection('EDUCATION & QUALIFICATIONS', resumeData.education, currentY);
  currentY = addExecutiveSection('CORE COMPETENCIES', resumeData.skills, currentY);
  currentY = addExecutiveSection('KEY PROJECTS', resumeData.projects, currentY);
  currentY = addExecutiveSection('CERTIFICATIONS', resumeData.certifications, currentY);
  currentY = addExecutiveSection('ACHIEVEMENTS', resumeData.achievements, currentY);
  currentY = addExecutiveSection('LANGUAGES', resumeData.languages, currentY);
  currentY = addExecutiveSection('ADDITIONAL INFORMATION', resumeData.additional_info, currentY);

  // Executive footer
  doc.rect(0, doc.page.height - 50, doc.page.width, 50).fill(cardBg);
  doc.fontSize(8)
     .font('Helvetica')
     .fillColor(textLight)
     .text('CONFIDENTIAL EXECUTIVE RESUME', 0, doc.page.height - 30, { 
       width: doc.page.width,
       align: 'center'
     });

  doc.end();
}

/**
 * Minimalist template - Clean, white-space focused design
 */
function generateMinimalistTemplate(resumeData, studentInfo, stream, layout = 'single-column') {
  // Create a new PDF document
  const doc = new PDFDocument({
    margins: { top: 60, bottom: 60, left: 60, right: 60 },
    size: 'A4',
  });
  
  // Pipe the PDF to the response
  doc.pipe(stream);

  // Colors
  const darkGray = '#2d3748';
  const mediumGray = '#4a5568';
  const lightGray = '#718096';
  const veryLightGray = '#e2e8f0';
  const white = '#ffffff';

  // Background
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(white);

  // Header
  let y = 60;
  
  // Name
  doc.fontSize(36)
     .font('Helvetica')
     .fillColor(darkGray)
     .text(studentInfo.name || 'Student Name', 0, y, { 
       width: doc.page.width,
       align: 'center'
     });
  y = doc.y + 10;

  // Separator line
  doc.moveTo(doc.page.width / 2 - 50, y)
     .lineTo(doc.page.width / 2 + 50, y)
     .strokeColor(veryLightGray)
     .lineWidth(1)
     .stroke();
  y += 20;

  // Contact info
  let contactInfo = [];
  if (studentInfo.email) contactInfo.push(studentInfo.email);
  if (studentInfo.branch) contactInfo.push(studentInfo.branch);
  
  doc.fontSize(11)
     .font('Helvetica')
     .fillColor(mediumGray)
     .text(contactInfo.join(' • '), 0, y, { 
       width: doc.page.width,
       align: 'center'
     });
  y = doc.y + 40;

  // Content area
  const contentWidth = doc.page.width - 120;
  const leftMargin = 60;

  // Add a section
  function addSection(title, content, yPos) {
    if (!content) return yPos;
    
    // Section title
    doc.fontSize(14)
       .font('Helvetica')
       .fillColor(darkGray)
       .text(title.toUpperCase(), leftMargin, yPos);
    yPos += 20;
    
    // Underline
    doc.moveTo(leftMargin, yPos)
       .lineTo(leftMargin + 100, yPos)
       .strokeColor(veryLightGray)
       .lineWidth(1)
       .stroke();
    yPos += 20;
    
    // Content
    const lines = content.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      // Handle bullet points
      let displayLine = trimmedLine;
      if (displayLine.startsWith('-') || displayLine.startsWith('*')) {
        displayLine = displayLine.substring(1).trim();
      }
      
      doc.fontSize(11)
         .font('Helvetica')
         .fillColor(mediumGray)
         .text(displayLine, leftMargin, yPos, { 
           width: contentWidth,
           lineGap: 4
         });
      yPos = doc.y + 8;
    });
    
    return yPos + 25;
  }

  // Add all sections
  y = addSection('About', resumeData.objective, y);
  y = addSection('Experience', resumeData.experience, y);
  y = addSection('Education', resumeData.education, y);
  y = addSection('Skills', resumeData.skills, y);
  y = addSection('Projects', resumeData.projects, y);
  y = addSection('Languages', resumeData.languages, y);
  y = addSection('Certifications', resumeData.certifications, y);
  y = addSection('Achievements', resumeData.achievements, y);
  y = addSection('Additional Information', resumeData.additional_info, y);

  // Finalize the PDF
  doc.end();
}

/**
 * Creative template - Vibrant colors and unique layout
 */
function generateCreativeTemplate(resumeData, studentInfo, stream, layout = 'single-column') {
  const doc = new PDFDocument({
    margins: { top: 30, bottom: 30, left: 30, right: 30 },
    size: 'A4',
  });
  
  doc.pipe(stream);

  // Creative color palette - Vibrant and modern
  const primaryColor = '#8b5cf6';    // Purple
  const secondaryColor = '#10b981';  // Green
  const accentColor = '#f59e0b';     // Orange
  const pinkColor = '#ec4899';       // Pink
  const blueColor = '#3b82f6';       // Blue
  const textDark = '#1f2937';        // Dark text
  const textMedium = '#6b7280';      // Medium text
  const backgroundColor = '#ffffff';  // White

  // Creative background with geometric shapes
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(backgroundColor);
  
  // Creative header with colorful accents
  const headerHeight = 140;
  
  // Colorful header background
  doc.rect(0, 0, doc.page.width, headerHeight).fill(primaryColor);
  
  // Creative geometric shapes
  doc.circle(doc.page.width - 80, 40, 25).fill(secondaryColor);
  doc.circle(doc.page.width - 120, 80, 15).fill(accentColor);
  doc.circle(50, 30, 20).fill(pinkColor);
  doc.circle(80, 70, 12).fill(blueColor);

  // Creative name styling
  doc.fontSize(32)
     .font('Helvetica-Bold')
     .fillColor('#ffffff')
     .text(studentInfo.name, 40, 40, { 
       width: doc.page.width - 80,
       align: 'left'
     });

  // Creative contact styling
  let contactY = 85;
  if (studentInfo.email) {
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#ffffff')
       .text('ðŸ“§ ' + studentInfo.email, 40, contactY);
    contactY += 20;
  }
  if (studentInfo.branch) {
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#ffffff')
       .text('ðŸŽ“ ' + studentInfo.branch, 40, contactY);
  }

  // Creative content area
  let currentY = headerHeight + 30;
  const contentWidth = doc.page.width - 60;
  const leftMargin = 30;

  // Helper function for creative sections
  function addCreativeSection(title, content, yPos, color) {
    if (!content) return yPos;
    
    // Creative section header with color
    doc.rect(leftMargin, yPos, 4, 20).fill(color);
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor(color)
       .text(title, leftMargin + 15, yPos + 2);
    yPos += 30;
    
    // Creative content styling
    const lines = content.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      // Creative bullet points with colors
      let displayLine = trimmedLine;
      if (displayLine.startsWith('â€¢') || displayLine.startsWith('-')) {
        displayLine = displayLine.substring(1).trim();
        // Add colored bullet point
        doc.circle(leftMargin + 8, yPos + 8, 3).fill(color);
        doc.fontSize(11)
           .font('Helvetica')
           .fillColor(textDark)
           .text(displayLine, leftMargin + 20, yPos, { 
             width: contentWidth - 20,
             lineGap: 3
           });
      } else {
        doc.fontSize(11)
           .font('Helvetica')
           .fillColor(textMedium)
           .text(displayLine, leftMargin, yPos, { 
             width: contentWidth,
             lineGap: 3
           });
      }
      yPos = doc.y + 8;
    });
    
    return yPos + 20;
  }

  // Creative sections with different colors
  currentY = addCreativeSection('CREATIVE SUMMARY', resumeData.objective, currentY, primaryColor);
  currentY = addCreativeSection('EXPERIENCE', resumeData.experience, currentY, secondaryColor);
  currentY = addCreativeSection('EDUCATION', resumeData.education, currentY, blueColor);
  currentY = addCreativeSection('SKILLS', resumeData.skills, currentY, accentColor);
  currentY = addCreativeSection('PROJECTS', resumeData.projects, currentY, pinkColor);
  currentY = addCreativeSection('LANGUAGES', resumeData.languages, currentY, primaryColor);
  currentY = addCreativeSection('CERTIFICATIONS', resumeData.certifications, currentY, secondaryColor);
  currentY = addCreativeSection('ACHIEVEMENTS', resumeData.achievements, currentY, blueColor);
  currentY = addCreativeSection('ADDITIONAL INFO', resumeData.additional_info, currentY, accentColor);

  // Creative footer
  doc.rect(0, doc.page.height - 40, doc.page.width, 40).fill('#f9fafb');
  doc.fontSize(10)
     .font('Helvetica-Oblique')
     .fillColor(textMedium)
     .text('Creative Resume Design', 0, doc.page.height - 25, { 
       width: doc.page.width,
       align: 'center'
     });

  doc.end();
}

/**
 * Technical template - Dark theme with coding focus
 */
function generateTechnicalTemplate(resumeData, studentInfo, stream, layout = 'single-column') {
  const doc = new PDFDocument({
    margins: { top: 30, bottom: 30, left: 30, right: 30 },
    size: 'A4',
  });
  
  doc.pipe(stream);

  // Technical color palette - Dark theme
  const primaryColor = '#00d4aa';    // Bright green
  const secondaryColor = '#4ecdc4';  // Teal
  const accentColor = '#ff6b6b';     // Red
  const darkBg = '#0f1419';          // Very dark background
  const cardBg = '#1a2332';          // Dark card background
  const textLight = '#ffffff';       // White text
  const textMedium = '#94a3b8';      // Gray text
  const borderColor = '#2d3748';     // Dark border

  // Dark background
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(darkBg);

  // Technical header with terminal-style
  const headerHeight = 120;
  doc.rect(0, 0, doc.page.width, headerHeight).fill(cardBg);
  
  // Terminal-style border
  doc.rect(0, headerHeight - 3, doc.page.width, 3).fill(primaryColor);

  // Technical name styling with monospace feel
  doc.fontSize(30)
     .font('Courier-Bold')
     .fillColor(primaryColor)
     .text('$ ' + studentInfo.name.toLowerCase(), 40, 30);

  // Technical contact info with terminal style
  let contactY = 70;
  if (studentInfo.email) {
    doc.fontSize(12)
       .font('Courier')
       .fillColor(textMedium)
       .text('> email: ' + studentInfo.email, 40, contactY);
    contactY += 16;
  }
  if (studentInfo.branch) {
    doc.fontSize(12)
       .font('Courier')
       .fillColor(textMedium)
       .text('> field: ' + studentInfo.branch, 40, contactY);
  }

  // Technical content area
  let currentY = headerHeight + 25;
  const contentWidth = doc.page.width - 60;
  const leftMargin = 30;

  // Helper function for technical sections
  function addTechnicalSection(title, content, yPos) {
    if (!content) return yPos;
    
    // Technical section header with code-like styling
    doc.rect(leftMargin, yPos, contentWidth, 25).fill(cardBg);
    doc.fontSize(14)
       .font('Courier-Bold')
       .fillColor(primaryColor)
       .text('/* ' + title.toUpperCase() + ' */', leftMargin + 10, yPos + 6);
    yPos += 35;
    
    // Technical content with code-like formatting
    const lines = content.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      // Code-like bullet points
      let displayLine = trimmedLine;
      if (displayLine.startsWith('â€¢') || displayLine.startsWith('-')) {
        displayLine = displayLine.substring(1).trim();
        doc.fontSize(11)
           .font('Courier')
           .fillColor(secondaryColor)
           .text('â–¶ ', leftMargin, yPos);
        doc.fontSize(11)
           .font('Courier')
           .fillColor(textLight)
           .text(displayLine, leftMargin + 15, yPos, { 
             width: contentWidth - 15,
             lineGap: 2
           });
      } else {
        doc.fontSize(11)
           .font('Courier')
           .fillColor(textMedium)
           .text(displayLine, leftMargin, yPos, { 
             width: contentWidth,
             lineGap: 2
           });
      }
      yPos = doc.y + 8;
    });
    
    return yPos + 20;
  }

  // Technical sections
  currentY = addTechnicalSection('ABOUT', resumeData.objective, currentY);
  currentY = addTechnicalSection('WORK_EXPERIENCE', resumeData.experience, currentY);
  currentY = addTechnicalSection('EDUCATION', resumeData.education, currentY);
  currentY = addTechnicalSection('TECH_STACK', resumeData.skills, currentY);
  currentY = addTechnicalSection('PROJECTS', resumeData.projects, currentY);
  currentY = addTechnicalSection('LANGUAGES', resumeData.languages, currentY);
  currentY = addTechnicalSection('CERTIFICATIONS', resumeData.certifications, currentY);
  currentY = addTechnicalSection('ACHIEVEMENTS', resumeData.achievements, currentY);
  currentY = addTechnicalSection('ADDITIONAL_INFO', resumeData.additional_info, currentY);

  // Technical footer
  doc.rect(0, doc.page.height - 30, doc.page.width, 30).fill(cardBg);
  doc.fontSize(10)
     .font('Courier')
     .fillColor(primaryColor)
     .text('$ exit # Technical Resume v1.0', 40, doc.page.height - 20);

  doc.end();
}

/**
 * Professional template - Dark theme with orange accents
 */
function generateProfessionalTemplate(resumeData, studentInfo, stream, layout = 'single-column') {
  const doc = new PDFDocument({
    margins: { top: 30, bottom: 30, left: 30, right: 30 },
    size: 'A4',
  });
  
  doc.pipe(stream);

  // Professional color palette - Dark with orange
  const primaryColor = '#f97316';    // Orange
  const darkBg = '#374151';          // Dark gray
  const cardBg = '#4b5563';          // Medium gray
  const textLight = '#ffffff';       // White text
  const textMedium = '#d1d5db';      // Light gray text
  const borderColor = '#6b7280';     // Gray border

  // Dark background
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(darkBg);

  // Professional header
  const headerHeight = 100;
  doc.rect(0, 0, doc.page.width, headerHeight).fill('#1f2937');
  
  // Orange accent line
  doc.rect(0, headerHeight - 4, doc.page.width, 4).fill(primaryColor);

  // Professional name styling
  doc.fontSize(28)
     .font('Helvetica-Bold')
     .fillColor(textLight)
     .text(studentInfo.name.toUpperCase(), 40, 25);

  // Professional contact info
  let contactY = 60;
  let contactInfo = [];
  if (studentInfo.email) contactInfo.push(studentInfo.email);
  if (studentInfo.branch) contactInfo.push(studentInfo.branch);
  
  doc.fontSize(12)
     .font('Helvetica')
     .fillColor(primaryColor)
     .text(contactInfo.join(' | '), 40, contactY);

  // Professional content area
  let currentY = headerHeight + 25;
  const contentWidth = doc.page.width - 60;
  const leftMargin = 30;

  // Helper function for professional sections
  function addProfessionalSection(title, content, yPos) {
    if (!content) return yPos;
    
    // Professional section header
    doc.rect(leftMargin, yPos, 5, 18).fill(primaryColor);
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(textLight)
       .text(title, leftMargin + 15, yPos + 2);
    yPos += 30;
    
    // Professional content
    const lines = content.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      let displayLine = trimmedLine;
      if (displayLine.startsWith('â€¢') || displayLine.startsWith('-')) {
        displayLine = displayLine.substring(1).trim();
        doc.fontSize(11)
           .font('Helvetica')
           .fillColor(primaryColor)
           .text('â–ª ', leftMargin, yPos);
        doc.fontSize(11)
           .font('Helvetica')
           .fillColor(textMedium)
           .text(displayLine, leftMargin + 15, yPos, { 
             width: contentWidth - 15,
             lineGap: 3
           });
      } else {
        doc.fontSize(11)
           .font('Helvetica')
           .fillColor(textMedium)
           .text(displayLine, leftMargin, yPos, { 
             width: contentWidth,
             lineGap: 3
           });
      }
      yPos = doc.y + 8;
    });
    
    return yPos + 20;
  }

  // Professional sections
  currentY = addProfessionalSection('PROFILE', resumeData.objective, currentY);
  currentY = addProfessionalSection('EXPERIENCE', resumeData.experience, currentY);
  currentY = addProfessionalSection('EDUCATION', resumeData.education, currentY);
  currentY = addProfessionalSection('SKILLS', resumeData.skills, currentY);
  currentY = addProfessionalSection('PROJECTS', resumeData.projects, currentY);
  currentY = addProfessionalSection('LANGUAGES', resumeData.languages, currentY);
  currentY = addProfessionalSection('CERTIFICATIONS', resumeData.certifications, currentY);
  currentY = addProfessionalSection('ACHIEVEMENTS', resumeData.achievements, currentY);
  currentY = addProfessionalSection('ADDITIONAL INFORMATION', resumeData.additional_info, currentY);

  doc.end();
}

/**
 * Academic template - Formal maroon theme
 */
function generateAcademicTemplate(resumeData, studentInfo, stream, layout = 'single-column') {
  const doc = new PDFDocument({
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    size: 'A4',
  });
  
  doc.pipe(stream);

  // Academic color palette - Formal maroon
  const primaryColor = '#7f1d1d';    // Dark maroon
  const secondaryColor = '#991b1b';  // Medium maroon
  const accentColor = '#b91c1c';     // Light maroon
  const textDark = '#1f2937';        // Dark text
  const textMedium = '#4b5563';      // Medium text
  const backgroundColor = '#fef2f2';  // Light maroon background

  // Academic background
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(backgroundColor);

  // Academic header with formal styling
  const headerHeight = 120;
  doc.rect(0, 0, doc.page.width, headerHeight).fill(primaryColor);
  
  // Formal border
  doc.rect(40, 40, doc.page.width - 80, headerHeight - 80).stroke(backgroundColor).lineWidth(2);

  // Academic name styling
  doc.fontSize(26)
     .font('Times-Bold')
     .fillColor('#ffffff')
     .text(studentInfo.name, 0, 60, { 
       width: doc.page.width,
       align: 'center'
     });

  // Academic credentials
  let contactY = 85;
  let contactInfo = [];
  if (studentInfo.email) contactInfo.push(studentInfo.email);
  if (studentInfo.branch) contactInfo.push(studentInfo.branch);
  
  doc.fontSize(12)
     .font('Times-Roman')
     .fillColor('#ffffff')
     .text(contactInfo.join(' â€¢ '), 0, contactY, { 
       width: doc.page.width,
       align: 'center'
     });

  // Academic content area
  let currentY = headerHeight + 30;
  const contentWidth = doc.page.width - 100;
  const leftMargin = 50;

  // Helper function for academic sections
  function addAcademicSection(title, content, yPos) {
    if (!content) return yPos;
    
    // Academic section header
    doc.fontSize(16)
       .font('Times-Bold')
       .fillColor(primaryColor)
       .text(title, leftMargin, yPos);
    yPos += 25;
    
    // Academic underline
    doc.moveTo(leftMargin, yPos)
       .lineTo(leftMargin + 150, yPos)
       .strokeColor(primaryColor)
       .lineWidth(1)
       .stroke();
    yPos += 15;
    
    // Academic content
    const lines = content.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      let displayLine = trimmedLine;
      if (displayLine.startsWith('â€¢') || displayLine.startsWith('-')) {
        displayLine = displayLine.substring(1).trim();
      }
      
      doc.fontSize(11)
         .font('Times-Roman')
         .fillColor(textDark)
         .text(displayLine, leftMargin, yPos, { 
           width: contentWidth,
           lineGap: 4,
           align: 'justify'
         });
      yPos = doc.y + 10;
    });
    
    return yPos + 20;
  }

  // Academic sections
  currentY = addAcademicSection('ACADEMIC PROFILE', resumeData.objective, currentY);
  currentY = addAcademicSection('EDUCATION', resumeData.education, currentY);
  currentY = addAcademicSection('RESEARCH EXPERIENCE', resumeData.experience, currentY);
  currentY = addAcademicSection('SKILLS', resumeData.skills, currentY);
  currentY = addAcademicSection('ACADEMIC PROJECTS', resumeData.projects, currentY);
  currentY = addAcademicSection('LANGUAGES', resumeData.languages, currentY);
  currentY = addAcademicSection('CERTIFICATIONS', resumeData.certifications, currentY);
  currentY = addAcademicSection('ACHIEVEMENTS', resumeData.achievements, currentY);
  currentY = addAcademicSection('ADDITIONAL INFORMATION', resumeData.additional_info, currentY);

  doc.end();
}

/**
 * Elegant template - Light blue and gold theme
 */
function generateElegantTemplate(resumeData, studentInfo, stream, layout = 'single-column') {
  const doc = new PDFDocument({
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    size: 'A4',
  });
  
  doc.pipe(stream);

  // Elegant color palette - Light blue and gold
  const primaryColor = '#1e40af';    // Deep blue
  const secondaryColor = '#3b82f6';  // Medium blue
  const accentColor = '#ca8a04';     // Gold
  const lightBg = '#fefce8';         // Light yellow background
  const textDark = '#1e293b';        // Dark text
  const textMedium = '#64748b';      // Medium text

  // Elegant background
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(lightBg);

  // Elegant header with gradient feel
  const headerHeight = 110;
  doc.rect(0, 0, doc.page.width, headerHeight).fill(primaryColor);
  
  // Gold accent border
  doc.rect(0, headerHeight - 5, doc.page.width, 5).fill(accentColor);

  // Elegant name styling
  doc.fontSize(30)
     .font('Helvetica-Bold')
     .fillColor('#ffffff')
     .text(studentInfo.name, 0, 30, { 
       width: doc.page.width,
       align: 'center'
     });

  // Elegant contact info
  let contactY = 70;
  let contactInfo = [];
  if (studentInfo.email) contactInfo.push(studentInfo.email);
  if (studentInfo.branch) contactInfo.push(studentInfo.branch);
  
  doc.fontSize(12)
     .font('Helvetica')
     .fillColor(accentColor)
     .text(contactInfo.join(' â€¢ '), 0, contactY, { 
       width: doc.page.width,
       align: 'center'
     });

  // Elegant content area
  let currentY = headerHeight + 25;
  const contentWidth = doc.page.width - 80;
  const leftMargin = 40;

  // Helper function for elegant sections
  function addElegantSection(title, content, yPos) {
    if (!content) return yPos;
    
    // Elegant section header with decorative elements
    doc.circle(leftMargin, yPos + 10, 4).fill(accentColor);
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(primaryColor)
       .text(title, leftMargin + 15, yPos + 5);
    yPos += 25;
    
    // Elegant decorative line
    doc.moveTo(leftMargin, yPos)
       .lineTo(leftMargin + 100, yPos)
       .strokeColor(accentColor)
       .lineWidth(1)
       .stroke();
    yPos += 15;
    
    // Elegant content
    const lines = content.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      let displayLine = trimmedLine;
      if (displayLine.startsWith('â€¢') || displayLine.startsWith('-')) {
        displayLine = displayLine.substring(1).trim();
        doc.fontSize(11)
           .font('Helvetica')
           .fillColor(accentColor)
           .text('â—† ', leftMargin, yPos);
        doc.fontSize(11)
           .font('Helvetica')
           .fillColor(textDark)
           .text(displayLine, leftMargin + 15, yPos, { 
             width: contentWidth - 15,
             lineGap: 3
           });
      } else {
        doc.fontSize(11)
           .font('Helvetica')
           .fillColor(textMedium)
           .text(displayLine, leftMargin, yPos, { 
             width: contentWidth,
             lineGap: 3
           });
      }
      yPos = doc.y + 8;
    });
    
    return yPos + 20;
  }

  // Elegant sections
  currentY = addElegantSection('PROFESSIONAL SUMMARY', resumeData.objective, currentY);
  currentY = addElegantSection('EXPERIENCE', resumeData.experience, currentY);
  currentY = addElegantSection('EDUCATION', resumeData.education, currentY);
  currentY = addElegantSection('SKILLS', resumeData.skills, currentY);
  currentY = addElegantSection('PROJECTS', resumeData.projects, currentY);
  currentY = addElegantSection('LANGUAGES', resumeData.languages, currentY);
  currentY = addElegantSection('CERTIFICATIONS', resumeData.certifications, currentY);
  currentY = addElegantSection('ACHIEVEMENTS', resumeData.achievements, currentY);
  currentY = addElegantSection('ADDITIONAL INFORMATION', resumeData.additional_info, currentY);

  // Elegant footer
  doc.rect(0, doc.page.height - 30, doc.page.width, 30).fill(primaryColor);
  doc.fontSize(10)
     .font('Helvetica-Oblique')
     .fillColor(accentColor)
     .text('Elegant Professional Resume', 0, doc.page.height - 20, { 
       width: doc.page.width,
       align: 'center'
     });

  doc.end();
}

function generateNewTemplate1(resumeData, studentInfo, stream, layout = 'single-column') {
  // Template placeholder - can be customized
  generateClassicTemplate(resumeData, studentInfo, stream, layout);
}

function generateNewTemplate2(resumeData, studentInfo, stream, layout = 'single-column') {
  // Template placeholder - can be customized
  generateClassicTemplate(resumeData, studentInfo, stream, layout);
}

module.exports = { generateResumePDF };
