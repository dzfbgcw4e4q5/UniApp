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
  const doc = new PDFDocument({
    margins: { top: 60, bottom: 60, left: 60, right: 60 },
    size: 'A4',
  });
  
  doc.pipe(stream);

  // Minimalist color palette - Simple and clean
  const primaryColor = '#2d3748';    // Dark gray
  const accentColor = '#4a5568';     // Medium gray
  const lightColor = '#718096';      // Light gray
  const lineColor = '#e2e8f0';       // Very light gray
  const backgroundColor = '#ffffff';  // Pure white

  // Clean white background
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(backgroundColor);

  // Minimalist header - Simple and elegant
  let currentY = 60;
  
  // Name with minimalist typography
  doc.fontSize(36)
     .font('Helvetica-Light')
     .fillColor(primaryColor)
     .text(studentInfo.name, 0, currentY, { 
       width: doc.page.width,
       align: 'center'
     });
  currentY = doc.y + 10;

  // Simple separator line
  doc.moveTo(doc.page.width / 2 - 50, currentY)
     .lineTo(doc.page.width / 2 + 50, currentY)
     .strokeColor(lineColor)
     .lineWidth(1)
     .stroke();
  currentY += 20;

  // Contact information - minimalist style
  let contactInfo = [];
  if (studentInfo.email) contactInfo.push(studentInfo.email);
  if (studentInfo.branch) contactInfo.push(studentInfo.branch);
  
  doc.fontSize(11)
     .font('Helvetica')
     .fillColor(accentColor)
     .text(contactInfo.join(' â€¢ '), 0, currentY, { 
       width: doc.page.width,
       align: 'center'
     });
  currentY = doc.y + 40;

  // Content area
  const contentWidth = doc.page.width - 120;
  const leftMargin = 60;

  // Helper function for minimalist sections
  function addMinimalistSection(title, content, yPos) {
    if (!content) return yPos;
    
    // Clean section title
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(primaryColor)
       .text(title.toUpperCase(), leftMargin, yPos);
    yPos += 20;
    
    // Simple underline
    doc.moveTo(leftMargin, yPos)
       .lineTo(leftMargin + 100, yPos)
       .strokeColor(lineColor)
       .lineWidth(1)
       .stroke();
    yPos += 20;
    
    // Content with generous spacing
    const lines = content.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      // Clean bullet points
      let displayLine = trimmedLine;
      if (displayLine.startsWith('â€¢') || displayLine.startsWith('-')) {
        displayLine = displayLine.substring(1).trim();
      }
      
      doc.fontSize(11)
         .font('Helvetica')
         .fillColor(accentColor)
         .text(displayLine, leftMargin, yPos, { 
           width: contentWidth,
           lineGap: 4
         });
      yPos = doc.y + 8;
    });
    
    return yPos + 25;
  }

  // Minimalist sections with generous spacing
  currentY = addMinimalistSection('About', resumeData.objective, currentY);
  currentY = addMinimalistSection('Experience', resumeData.experience, currentY);
  currentY = addMinimalistSection('Education', resumeData.education, currentY);
  currentY = addMinimalistSection('Skills', resumeData.skills, currentY);
  currentY = addMinimalistSection('Projects', resumeData.projects, currentY);
  currentY = addMinimalistSection('Languages', resumeData.languages, currentY);
  currentY = addMinimalistSection('Certifications', resumeData.certifications, currentY);
  currentY = addMinimalistSection('Achievements', resumeData.achievements, currentY);
  currentY = addMinimalistSection('Additional Information', resumeData.additional_info, currentY);

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
  generateModernTemplate(resumeData, studentInfo, stream, layout);
}

function generateNewTemplate2(resumeData, studentInfo, stream, layout = 'single-column') {
  // Template placeholder - can be customized
  generateClassicTemplate(resumeData, studentInfo, stream, layout);
}

module.exports = { generateResumePDF };
        chipY += 22;
      }
      doc.roundedRect(chipX, chipY, chipW, 18, 8).fill('#80cbc4');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#004d40')
        .text(lang, chipX + 8, chipY + 4, { width: chipW - 16, align: 'center' });
      chipX += chipW + 8;
    });
    sidebarY = chipY + 26;
  }

  // Main content area
  const mainX = sidebarWidth + 40;
  const mainW = pageW - mainX - 40;
  let mainY = 50;

  // Executive Summary
  if (resumeData.objective) {
    doc.fontSize(18).font('Helvetica-Bold').fillColor(teal)
      .text('EXECUTIVE SUMMARY', mainX, mainY);
    mainY = doc.y + 6;
    doc.fontSize(11).font('Helvetica').fillColor(darkText)
      .text(resumeData.objective, mainX, mainY, { width: mainW, align: 'justify', lineGap: 4 });
    mainY = doc.y + 18;
  }

  // Timeline section helper
  function timelineSection(title, content) {
    if (!content) return;
    doc.fontSize(15).font('Helvetica-Bold').fillColor(teal)
      .text(title, mainX, mainY);
    mainY = doc.y + 8;
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
    let tY = mainY;
    lines.forEach((line, idx) => {
      // Dot for each entry
      doc.circle(mainX + 6, tY + 7, 5).fill(emerald);
      // Vertical line (except last)
      if (idx < lines.length - 1) {
        doc.moveTo(mainX + 6, tY + 12).lineTo(mainX + 6, tY + 32).strokeColor(emerald).lineWidth(2).stroke();
      }
      // Entry text
      doc.fontSize(11).font('Helvetica').fillColor(darkText)
        .text(line, mainX + 20, tY, { width: mainW - 30, lineGap: 2 });
      tY += 30;
    });
    mainY = tY + 8;
  }

  // Experience and Education as timelines
  timelineSection('PROFESSIONAL EXPERIENCE', resumeData.experience);
  timelineSection('EDUCATION', resumeData.education);

  // Other sections as cards
  function cardSection(title, content) {
    if (!content) return;
    doc.rect(mainX, mainY, mainW, 38).fill(sidebarBg);
    doc.fontSize(13).font('Helvetica-Bold').fillColor(teal)
      .text(title, mainX + 12, mainY + 6);
    doc.fontSize(10).font('Helvetica').fillColor(darkText)
      .text(content, mainX + 12, mainY + 22, { width: mainW - 24, lineGap: 2 });
    mainY += 50;
  }
  cardSection('PROJECTS', resumeData.projects);
  cardSection('CERTIFICATIONS', resumeData.certifications);
  cardSection('ACHIEVEMENTS', resumeData.achievements);
  cardSection('ADDITIONAL INFO', resumeData.additional_info);

  // Executive footer
  doc.rect(0, pageH - 36, pageW, 36).fill(emerald);
  doc.fontSize(10).font('Helvetica').fillColor(white)
    .text(`${studentInfo.name} â€¢ Executive Resume â€¢ ${new Date().toLocaleDateString()}`,
      0, pageH - 26, { align: 'center' });
  doc.end();
}

/**
 * Minimalist template - Clean and simple layout with green accents
 * @param {Object} resumeData - The resume data
 * @param {Object} studentInfo - The student information
 * @param {Stream} stream - The stream to write the PDF to
 * @param {String} layout - The layout to use (single-column, two-column)
 */
function generateMinimalistTemplate(resumeData, studentInfo, stream, layout = 'single-column') {
  // Minimalist: right sidebar, orange accent, vertical section titles, whitespace, unique structure
  const doc = new PDFDocument({
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    size: 'A4',
  });
  doc.pipe(stream);

  // Minimalist color palette
  const orange = '#ff9800';
  const lightOrange = '#fff3e0';
  const darkText = '#222';
  const gray = '#bdbdbd';
  const white = '#fff';

  // Sidebar dimensions (right side)
  const sidebarWidth = 120;
  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const sidebarX = pageW - sidebarWidth;

  // Sidebar background
  doc.save();
  doc.rect(sidebarX, 0, sidebarWidth, pageH).fill(lightOrange);
  // Orange vertical bar accent
  doc.rect(sidebarX, 0, 8, pageH).fill(orange);
  doc.restore();

  // Sidebar: vertical section titles
  const sections = [
    { key: 'objective', label: 'OBJECTIVE' },
    { key: 'education', label: 'EDUCATION' },
    { key: 'experience', label: 'EXPERIENCE' },
    { key: 'skills', label: 'SKILLS' },
    { key: 'projects', label: 'PROJECTS' },
    { key: 'certifications', label: 'CERTIFICATIONS' },
    { key: 'achievements', label: 'ACHIEVEMENTS' },
    { key: 'languages', label: 'LANGUAGES' },
    { key: 'additional_info', label: 'INFO' },
  ];
  let sidebarY = 60;
  doc.fontSize(12).font('Helvetica-Bold').fillColor(orange);
  sections.forEach(section => {
    doc.save();
    doc.rotate(-90, { origin: [sidebarX + sidebarWidth / 2, sidebarY] });
    doc.text(section.label, sidebarX + sidebarWidth / 2 - 30, sidebarY - 8, { width: 60, align: 'center' });
    doc.restore();
    sidebarY += 48;
  });

  // Name and contact at top left
  let mainY = 40;
  doc.fontSize(26).font('Helvetica-Bold').fillColor(orange)
    .text(studentInfo.name, 50, mainY, { align: 'left' });
  mainY = doc.y + 4;
  doc.fontSize(11).font('Helvetica').fillColor(gray)
    .text(studentInfo.email || '', 50, mainY, { align: 'left' });
  if (studentInfo.branch) {
    mainY = doc.y + 2;
    doc.fontSize(11).font('Helvetica').fillColor(gray)
      .text(studentInfo.branch, 50, mainY, { align: 'left' });
  }
  mainY = doc.y + 18;

  // Main content area (left, lots of whitespace)
  const mainW = pageW - sidebarWidth - 80;
  function sectionContent(key) {
    const content = resumeData[key];
    if (!content) return;
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').fillColor(darkText)
      .text(content, 50, mainY, { width: mainW, align: 'left', lineGap: 5 });
    mainY = doc.y + 30;
  }
  // Render each section in order, matching sidebar
  sections.forEach(section => sectionContent(section.key));

  // Minimalist footer, right-aligned
  doc.fontSize(8).font('Helvetica').fillColor(gray)
    .text(`${studentInfo.name} â€¢ Minimalist Resume â€¢ ${new Date().toLocaleDateString()}`,
      0, pageH - 30, { align: 'right' });
  doc.end();
}

/**
 * Creative template - Artistic design with bold colors and unique layout
 */
function generateCreativeTemplate(resumeData, studentInfo, stream, layout = 'single-column') {
  const doc = new PDFDocument({
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    size: 'A4',
  });
  doc.pipe(stream);

  // Creative color palette
  const purple = '#a21caf';
  const pink = '#f472b6';
  const yellow = '#fde68a';
  const darkText = '#2d033b';
  const lightText = '#a78bfa';

  // Top banner with angled bottom
  doc.save();
  doc.moveTo(0, 0).lineTo(doc.page.width, 0).lineTo(doc.page.width, 100).lineTo(0, 70).closePath().fill(purple);
  doc.restore();

  // Name and contact in banner
  doc.fontSize(28)
     .font('Helvetica-Bold')
     .fillColor('#fff')
     .text(studentInfo.name, 40, 30, { align: 'left' });
  doc.fontSize(12)
     .font('Helvetica')
     .fillColor(lightText)
     .text(studentInfo.email || '', 40, 65, { align: 'left' });
  doc.fontSize(12)
     .font('Helvetica')
     .fillColor(lightText)
     .text(studentInfo.branch || '', 250, 65, { align: 'left' });

  let y = 120;
  // Angled divider
  doc.save();
  doc.moveTo(0, y).lineTo(doc.page.width, y + 20).lineTo(doc.page.width, y + 30).lineTo(0, y + 10).closePath().fill(pink);
  doc.restore();
  y += 40;

  // Profile section
  doc.fontSize(16).font('Helvetica-Bold').fillColor(purple).text('Profile', 50, y);
  y = doc.y + 5;
  doc.fontSize(10).font('Helvetica').fillColor(darkText).text(resumeData.objective || '', 60, y, { width: doc.page.width - 120, lineGap: 3 });
  y = doc.y + 18;

  // Two-column section for Skills and Projects
  const col1x = 50, col2x = doc.page.width / 2 + 10, colWidth = doc.page.width / 2 - 70;
  let colY = y + 10;
  doc.fontSize(14).font('Helvetica-Bold').fillColor(purple).text('Skills', col1x, colY);
  doc.fontSize(14).font('Helvetica-Bold').fillColor(purple).text('Projects', col2x, colY);
  colY += 20;
  doc.fontSize(10).font('Helvetica').fillColor(darkText).text(resumeData.skills || '', col1x, colY, { width: colWidth });
  doc.fontSize(10).font('Helvetica').fillColor(darkText).text(resumeData.projects || '', col2x, colY, { width: colWidth });
  y = Math.max(doc.y, colY + 60);

  // Angled divider for next section
  doc.save();
  doc.moveTo(0, y).lineTo(doc.page.width, y + 20).lineTo(doc.page.width, y + 30).lineTo(0, y + 10).closePath().fill(yellow);
  doc.restore();
  y += 40;

  // Other sections, single column
  function section(title, content) {
    if (!content) return;
    doc.fontSize(15).font('Helvetica-Bold').fillColor(purple).text(title, 50, y);
    y = doc.y + 5;
    doc.fontSize(10).font('Helvetica').fillColor(darkText).text(content, 60, y, { width: doc.page.width - 120, lineGap: 3 });
    y = doc.y + 18;
  }
  section('Education', resumeData.education);
  section('Experience', resumeData.experience);
  section('Certifications', resumeData.certifications);
  section('Achievements', resumeData.achievements);
  section('Languages', resumeData.languages);
  section('Additional Info', resumeData.additional_info);

  // Footer with playful accent
  doc.rect(0, doc.page.height - 30, doc.page.width, 30).fill(pink);
  doc.fontSize(9)
     .font('Helvetica')
     .fillColor(purple)
     .text(`${studentInfo.name} â€¢ Creative Resume â€¢ ${new Date().toLocaleDateString()}`, 0, doc.page.height - 22, { align: 'center' });
  doc.end();
}

/**
 * Technical template - Unique terminal window style, neon colors, single column, terminal header, code block sections, ASCII/circuit background
 */
function generateTechnicalTemplate(resumeData, studentInfo, stream, layout = 'single-column') {
  // Terminal: single column, dark background, terminal header, neon green/yellow, code block, ASCII/circuit pattern
  const doc = new PDFDocument({
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    size: 'A4',
  });
  doc.pipe(stream);

  // Terminal color palette
  const termBg = '#181a20';
  const neonGreen = '#39ff14';
  const neonYellow = '#ffe600';
  const neonCyan = '#00fff7';
  const termText = '#e0e0e0';
  const windowRed = '#ff5f56';
  const windowYellow = '#ffbd2e';
  const windowGreen = '#27c93f';
  const faintCircuit = '#23272e';

  const pageW = doc.page.width;
  const pageH = doc.page.height;

  // Terminal window background
  doc.save();
  doc.roundedRect(30, 30, pageW - 60, pageH - 80, 18).fill(termBg);
  doc.restore();

  // Terminal header bar with window controls
  doc.save();
  doc.roundedRect(30, 30, pageW - 60, 38, 18).fill('#23272e');
  // Window control dots
  doc.circle(50, 49, 6).fill(windowRed);
  doc.circle(70, 49, 6).fill(windowYellow);
  doc.circle(90, 49, 6).fill(windowGreen);
  doc.restore();

  // Subtle ASCII/circuit pattern background inside terminal
  for (let x = 50; x < pageW - 60; x += 60) {
    for (let y = 80; y < pageH - 60; y += 40) {
      doc.font('Courier').fontSize(8).fillColor(faintCircuit)
        .text('~#', x, y, { lineBreak: false });
      doc.font('Courier').fontSize(8).fillColor(faintCircuit)
        .text('||', x + 20, y + 10, { lineBreak: false });
      doc.font('Courier').fontSize(8).fillColor(faintCircuit)
        .text('==', x + 40, y + 20, { lineBreak: false });
    }
  }

  // Name and contact in terminal header
  doc.fontSize(18).font('Courier-Bold').fillColor(neonGreen)
    .text(studentInfo.name, 120, 44, { align: 'left', lineBreak: false });
  doc.fontSize(10).font('Courier').fillColor(neonCyan)
    .text(studentInfo.email || '', 120, 62, { align: 'left', lineBreak: false });
  if (studentInfo.branch) {
    doc.fontSize(10).font('Courier').fillColor(neonYellow)
      .text(studentInfo.branch, 320, 62, { align: 'left', lineBreak: false });
  }

  // Content area inside terminal
  let y = 90;
  const x = 60;
  const contentW = pageW - 120;

  // Section helper: terminal command style
  function terminalHeader(cmd, color, y) {
    doc.fontSize(13).font('Courier-Bold').fillColor(color)
      .text(`$ ${cmd}`, x, y);
    return doc.y + 2;
  }
  // Section helper: code block style
  function codeBlock(text, color, y) {
    if (!text) return y;
    doc.save();
    doc.roundedRect(x, y, contentW, doc.heightOfString(text, { width: contentW, font: 'Courier', size: 10 }) + 16, 8).fill('#22242a');
    doc.fontSize(10).font('Courier').fillColor(color)
      .text(text, x + 12, y + 8, { width: contentW - 24, lineGap: 3 });
    doc.restore();
    return y + doc.heightOfString(text, { width: contentW - 24, font: 'Courier', size: 10 }) + 24;
  }

  // Objective
  if (resumeData.objective) {
    y = terminalHeader('profile', neonGreen, y);
    y = codeBlock(resumeData.objective, neonGreen, y);
    y += 8;
  }
  // Experience
  if (resumeData.experience) {
    y = terminalHeader('experience', neonYellow, y);
    y = codeBlock(resumeData.experience, neonYellow, y);
    y += 8;
  }
  // Education
  if (resumeData.education) {
    y = terminalHeader('education', neonCyan, y);
    y = codeBlock(resumeData.education, neonCyan, y);
    y += 8;
  }
  // Skills
  if (resumeData.skills) {
    y = terminalHeader('skills', neonGreen, y);
    y = codeBlock(resumeData.skills, neonGreen, y);
    y += 8;
  }
  // Projects
  if (resumeData.projects) {
    y = terminalHeader('projects', neonYellow, y);
    y = codeBlock(resumeData.projects, neonYellow, y);
    y += 8;
  }
  // Certifications
  if (resumeData.certifications) {
    y = terminalHeader('certifications', neonCyan, y);
    y = codeBlock(resumeData.certifications, neonCyan, y);
    y += 8;
  }
  // Achievements
  if (resumeData.achievements) {
    y = terminalHeader('achievements', neonGreen, y);
    y = codeBlock(resumeData.achievements, neonGreen, y);
    y += 8;
  }
  // Languages
  if (resumeData.languages) {
    y = terminalHeader('languages', neonYellow, y);
    y = codeBlock(resumeData.languages, neonYellow, y);
    y += 8;
  }
  // Additional Info
  if (resumeData.additional_info) {
    y = terminalHeader('info', neonCyan, y);
    y = codeBlock(resumeData.additional_info, neonCyan, y);
    y += 8;
  }

  // Terminal footer as prompt
  doc.fontSize(11).font('Courier').fillColor(neonGreen)
    .text(`$ exit  # ${studentInfo.name} â€¢ Technical Resume â€¢ ${new Date().toLocaleDateString()}`,
      60, pageH - 36, { align: 'left' });
  doc.end();
}

/**
 * Professional template - Corporate style with structured sections and formal typography
 */
function generateProfessionalTemplate(resumeData, studentInfo, stream, layout = 'single-column') {
  // Professional: Right sidebar for skills/languages, timeline for experience, vertical accent bar
  const doc = new PDFDocument({
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    size: 'A4',
  });
  doc.pipe(stream);

  // Professional color palette
  const darkGray = '#333333';
  const lightGray = '#f4f4f4';
  const accentColor = '#ff5722';
  const darkText = '#111111';
  const mediumText = '#666666';
  const lightText = '#999999';

  // Right sidebar
  const sidebarWidth = 140;
  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const sidebarX = pageW - sidebarWidth;
  doc.save();
  doc.rect(sidebarX, 0, sidebarWidth, pageH).fill(lightGray);
  doc.rect(sidebarX, 0, 8, pageH).fill(accentColor);
  doc.restore();

  // Sidebar: Skills and Languages
  let sidebarY = 60;
  doc.fontSize(13).font('Helvetica-Bold').fillColor(accentColor).text('SKILLS', sidebarX + 20, sidebarY);
  sidebarY += 20;
  doc.fontSize(10).font('Helvetica').fillColor(darkGray).text(resumeData.skills || '', sidebarX + 20, sidebarY, { width: sidebarWidth - 40, lineGap: 3 });
  sidebarY = doc.y + 18;
  doc.fontSize(13).font('Helvetica-Bold').fillColor(accentColor).text('LANGUAGES', sidebarX + 20, sidebarY);
  sidebarY += 20;
  doc.fontSize(10).font('Helvetica').fillColor(darkGray).text(resumeData.languages || '', sidebarX + 20, sidebarY, { width: sidebarWidth - 40, lineGap: 3 });

  // Header
  doc.rect(0, 0, pageW, 70).fill(darkGray);
  doc.fontSize(28).font('Helvetica-Bold').fillColor('#fff').text(studentInfo.name.toUpperCase(), 40, 22, { align: 'left' });
  doc.fontSize(12).font('Helvetica').fillColor('#e0f2fe').text(studentInfo.email || '', 40, 54, { align: 'left' });
  doc.fontSize(12).font('Helvetica').fillColor('#e0f2fe').text(studentInfo.branch || '', 300, 54, { align: 'left' });

  // Main content area
  let x = 60, y = 90, mainW = pageW - sidebarWidth - 100;

  // Professional Summary
  if (resumeData.objective) {
    doc.fontSize(16).font('Helvetica-Bold').fillColor(accentColor).text('PROFESSIONAL SUMMARY', x, y);
    y = doc.y + 4;
    doc.fontSize(11).font('Helvetica').fillColor(mediumText).text(resumeData.objective, x, y, { width: mainW, align: 'justify', lineGap: 4 });
    y = doc.y + 18;
  }

  // Timeline for Experience
  if (resumeData.experience) {
    doc.fontSize(15).font('Helvetica-Bold').fillColor(accentColor).text('EXPERIENCE', x, y);
    y = doc.y + 6;
    const lines = resumeData.experience.split('\n').map(l => l.trim()).filter(Boolean);
    let tY = y;
    lines.forEach((line, idx) => {
      doc.circle(x + 6, tY + 7, 5).fill(accentColor);
      if (idx < lines.length - 1) {
        doc.moveTo(x + 6, tY + 12).lineTo(x + 6, tY + 32).strokeColor(accentColor).lineWidth(2).stroke();
      }
      doc.fontSize(11).font('Helvetica').fillColor(darkText).text(line, x + 20, tY, { width: mainW - 30, lineGap: 2 });
      tY += 30;
    });
    y = tY + 8;
  }

  // Education
  if (resumeData.education) {
    doc.fontSize(15).font('Helvetica-Bold').fillColor(accentColor).text('EDUCATION', x, y);
    y = doc.y + 6;
    doc.fontSize(11).font('Helvetica').fillColor(darkText).text(resumeData.education, x, y, { width: mainW, lineGap: 3 });
    y = doc.y + 18;
  }

  // Projects
  if (resumeData.projects) {
    doc.fontSize(15).font('Helvetica-Bold').fillColor(accentColor).text('PROJECTS', x, y);
    y = doc.y + 6;
    doc.fontSize(11).font('Helvetica').fillColor(darkText).text(resumeData.projects, x, y, { width: mainW, lineGap: 3 });
    y = doc.y + 18;
  }

  // Certifications, Achievements, Additional Info
  function section(title, content) {
    if (!content) return;
    doc.fontSize(15).font('Helvetica-Bold').fillColor(accentColor).text(title, x, y);
    y = doc.y + 4;
    doc.fontSize(11).font('Helvetica').fillColor(darkText).text(content, x, y, { width: mainW, lineGap: 3 });
    y = doc.y + 18;
  }
  section('CERTIFICATIONS', resumeData.certifications);
  section('ACHIEVEMENTS', resumeData.achievements);
  section('ADDITIONAL INFO', resumeData.additional_info);

  // Professional footer
  doc.fontSize(10).font('Helvetica').fillColor(lightText)
    .text(`${studentInfo.name} â€¢ Professional Resume â€¢ ${new Date().toLocaleDateString()}`, 0, pageH - 30, { align: 'center' });
  doc.end();
}

/**
 * Academic template - Structured with left sidebar for education/research, main area for experience/publications, vertical timeline for education
 */
function generateAcademicTemplate(resumeData, studentInfo, stream, layout = 'single-column') {
  // Academic: Left sidebar for education/research, main for experience/publications, vertical timeline for education
  const doc = new PDFDocument({
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    size: 'A4',
  });
  doc.pipe(stream);

  // Academic color palette
  const maroon = '#800000';
  const lightMaroon = '#f8d7da';
  const darkText = '#333333';
  const mediumText = '#555555';
  const lightText = '#777777';

  // Left sidebar
  const sidebarWidth = 170;
  const pageW = doc.page.width;
  const pageH = doc.page.height;
  doc.save();
  doc.rect(0, 0, sidebarWidth, pageH).fill(lightMaroon);
  doc.rect(0, 0, sidebarWidth, 80).fill(maroon);
  doc.restore();

  // Sidebar: Name, contact, education, research
  let sidebarY = 30;
  doc.fontSize(22).font('Times-Bold').fillColor('#fff').text(studentInfo.name, 20, sidebarY, { width: sidebarWidth - 40 });
  sidebarY = doc.y + 8;
  doc.fontSize(11).font('Times-Roman').fillColor('#fff').text(studentInfo.email || '', 20, sidebarY, { width: sidebarWidth - 40 });
  sidebarY = doc.y + 4;
  doc.fontSize(11).font('Times-Roman').fillColor('#fff').text(studentInfo.branch || '', 20, sidebarY, { width: sidebarWidth - 40 });
  sidebarY = doc.y + 16;
  doc.fontSize(13).font('Times-Bold').fillColor(maroon).text('EDUCATION', 20, sidebarY);
  sidebarY += 18;
  // Timeline for education
  if (resumeData.education) {
    const lines = resumeData.education.split('\n').map(l => l.trim()).filter(Boolean);
    let tY = sidebarY;
    lines.forEach((line, idx) => {
      doc.circle(32, tY + 7, 4).fill(maroon);
      if (idx < lines.length - 1) {
        doc.moveTo(32, tY + 11).lineTo(32, tY + 28).strokeColor(maroon).lineWidth(2).stroke();
      }
      doc.fontSize(10).font('Times-Roman').fillColor(darkText).text(line, 44, tY, { width: sidebarWidth - 60 });
      tY += 24;
    });
    sidebarY = tY + 8;
  }
  doc.fontSize(13).font('Times-Bold').fillColor(maroon).text('RESEARCH', 20, sidebarY);
  sidebarY += 18;
  doc.fontSize(10).font('Times-Roman').fillColor(darkText).text(resumeData.research || '', 20, sidebarY, { width: sidebarWidth - 40, lineGap: 2 });
  sidebarY = doc.y + 10;

  // Main content area
  let x = sidebarWidth + 30, y = 40, mainW = pageW - sidebarWidth - 60;
  // Publications
  doc.fontSize(15).font('Times-Bold').fillColor(maroon).text('PUBLICATIONS', x, y);
  y = doc.y + 4;
  doc.fontSize(11).font('Times-Roman').fillColor(mediumText).text(resumeData.publications || '', x, y, { width: mainW, lineGap: 3 });
  y = doc.y + 18;
  // Conferences
  doc.fontSize(15).font('Times-Bold').fillColor(maroon).text('CONFERENCES', x, y);
  y = doc.y + 4;
  doc.fontSize(11).font('Times-Roman').fillColor(mediumText).text(resumeData.conferences || '', x, y, { width: mainW, lineGap: 3 });
  y = doc.y + 18;
  // Teaching Experience
  doc.fontSize(15).font('Times-Bold').fillColor(maroon).text('TEACHING EXPERIENCE', x, y);
  y = doc.y + 4;
  doc.fontSize(11).font('Times-Roman').fillColor(mediumText).text(resumeData.teaching_experience || '', x, y, { width: mainW, lineGap: 3 });
  y = doc.y + 18;
  // Experience
  doc.fontSize(15).font('Times-Bold').fillColor(maroon).text('EXPERIENCE', x, y);
  y = doc.y + 4;
  doc.fontSize(11).font('Times-Roman').fillColor(mediumText).text(resumeData.experience || '', x, y, { width: mainW, lineGap: 3 });
  y = doc.y + 18;
  // Skills, Certifications, Achievements, Additional Info
  function section(title, content) {
    if (!content) return;
    doc.fontSize(15).font('Times-Bold').fillColor(maroon).text(title, x, y);
    y = doc.y + 4;
    doc.fontSize(11).font('Times-Roman').fillColor(mediumText).text(content, x, y, { width: mainW, lineGap: 3 });
    y = doc.y + 18;
  }
  section('SKILLS', resumeData.skills);
  section('CERTIFICATIONS', resumeData.certifications);
  section('ACHIEVEMENTS', resumeData.achievements);
  section('LANGUAGES', resumeData.languages);
  section('ADDITIONAL INFO', resumeData.additional_info);

  // Academic footer
  doc.fontSize(10).font('Times-Italic').fillColor(lightText)
    .text(`${studentInfo.name} â€¢ Academic Resume â€¢ ${new Date().toLocaleDateString()}`, 0, pageH - 30, { align: 'center' });
  doc.end();
}

/**
 * Elegant template - Centered header, gold border, two-column skills/projects vs. experience/education, soft background pattern
 */
function generateElegantTemplate(resumeData, studentInfo, stream, layout = 'single-column') {
  // Elegant: Centered header, gold border, two-column skills/projects vs. experience/education, soft background pattern
  const doc = new PDFDocument({
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    size: 'A4',
  });
  doc.pipe(stream);

  // Elegant color palette
  const lightBlue = '#e1f5fe';
  const darkBlue = '#01579b';
  const gold = '#ffd54f';
  const darkText = '#212121';
  const mediumText = '#424242';
  const lightText = '#757575';

  // Soft background pattern
  for (let x = 0; x < doc.page.width; x += 60) {
    for (let y = 0; y < doc.page.height; y += 60) {
      doc.circle(x + 30, y + 30, 18).fillOpacity(0.07).fill(lightBlue).fillOpacity(1);
    }
  }

  // Gold border
  doc.save();
  doc.lineWidth(4).strokeColor(gold).rect(8, 8, doc.page.width - 16, doc.page.height - 16).stroke();
  doc.restore();

  // Centered header
  doc.rect(0, 0, doc.page.width, 90).fill(lightBlue);
  doc.fontSize(28).font('Times-Bold').fillColor(darkBlue).text(studentInfo.name.toUpperCase(), 0, 24, { align: 'center' });
  doc.fontSize(12).font('Times-Roman').fillColor(darkText).text(studentInfo.email || '', 0, 60, { align: 'center' });
  doc.fontSize(12).font('Times-Roman').fillColor(darkText).text(studentInfo.branch || '', 0, 76, { align: 'center' });

  // Two-column layout for main content
  let col1x = 60, col2x = doc.page.width / 2 + 10, colWidth = doc.page.width / 2 - 80;
  let colY = 110;
  doc.fontSize(15).font('Times-Bold').fillColor(gold).text('SKILLS', col1x, colY);
  doc.fontSize(15).font('Times-Bold').fillColor(gold).text('EXPERIENCE', col2x, colY);
  colY += 20;
  doc.fontSize(11).font('Times-Roman').fillColor(mediumText).text(resumeData.skills || '', col1x, colY, { width: colWidth, lineGap: 3 });
  doc.fontSize(11).font('Times-Roman').fillColor(mediumText).text(resumeData.experience || '', col2x, colY, { width: colWidth, lineGap: 3 });
  let y = Math.max(doc.y, colY + 60);

  // Second row: Projects and Education
  doc.fontSize(15).font('Times-Bold').fillColor(gold).text('PROJECTS', col1x, y);
  doc.fontSize(15).font('Times-Bold').fillColor(gold).text('EDUCATION', col2x, y);
  y += 20;
  doc.fontSize(11).font('Times-Roman').fillColor(mediumText).text(resumeData.projects || '', col1x, y, { width: colWidth, lineGap: 3 });
  doc.fontSize(11).font('Times-Roman').fillColor(mediumText).text(resumeData.education || '', col2x, y, { width: colWidth, lineGap: 3 });
  y = Math.max(doc.y, y + 60);

  // Single column for remaining sections
  function section(title, content) {
    if (!content) return;
    doc.fontSize(15).font('Times-Bold').fillColor(gold).text(title, 60, y);
    y = doc.y + 4;
    doc.fontSize(11).font('Times-Roman').fillColor(mediumText).text(content, 60, y, { width: doc.page.width - 120, lineGap: 3 });
    y = doc.y + 18;
  }
  section('CERTIFICATIONS', resumeData.certifications);
  section('ACHIEVEMENTS', resumeData.achievements);
  section('LANGUAGES', resumeData.languages);
  section('ADDITIONAL INFO', resumeData.additional_info);

  // Elegant footer
  doc.fontSize(10).font('Times-Italic').fillColor(lightText)
    .text(`${studentInfo.name} â€¢ Elegant Resume â€¢ ${new Date().toLocaleDateString()}`, 0, doc.page.height - 30, { align: 'center' });
  doc.end();
}
// Placeholder functions for other templates - using Classic template as fallback for now
function generateNewTemplate1(resumeData, studentInfo, stream, layout) {
  generateClassicTemplate(resumeData, studentInfo, stream, layout);
}

function generateNewTemplate2(resumeData, studentInfo, stream, layout) {
  generateClassicTemplate(resumeData, studentInfo, stream, layout);
}

module.exports = {
  generateResumePDF
};
