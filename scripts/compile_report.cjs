const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workspaceDir = path.resolve(__dirname, '..');
const rawSourcePath = path.join(__dirname, 'generate_report.js');
const rawText = fs.readFileSync(rawSourcePath, 'utf8');

const logoPath = path.join(workspaceDir, 'public', 'logo.png');
const fontPath = path.join(workspaceDir, 'public', 'fonts', 'FootlightMTLight.ttf');

const logoBase64 = fs.existsSync(logoPath) ? fs.readFileSync(logoPath).toString('base64') : '';
const fontBase64 = fs.existsSync(fontPath) ? fs.readFileSync(fontPath).toString('base64') : '';

// Find the HTML boundaries
const startIdx = rawText.indexOf('<!DOCTYPE html>');
const endIdx = rawText.lastIndexOf('</html>');

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find HTML boundaries in generate_report.js');
  process.exit(1);
}

let htmlContent = rawText.substring(startIdx, endIdx + 7);

// Replace placeholders
htmlContent = htmlContent.replace(/\$\{fontBase64\}/g, fontBase64);
htmlContent = htmlContent.replace(/\$\{logoBase64\}/g, logoBase64);

// Convert any markdown backtick style `code` to <code>code</code> for extra elegance
htmlContent = htmlContent.replace(/`([^`\n]+)`/g, '<code>$1</code>');

const htmlFilePath = path.join(workspaceDir, 'NammaSpot_Project_Report.html');
const pdfFilePath = path.join(workspaceDir, 'NammaSpot_Project_Report.pdf');

fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');
console.log('HTML written successfully to:', htmlFilePath, `(${fs.statSync(htmlFilePath).size} bytes)`);

// Compile with Microsoft Edge headless
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

if (fs.existsSync(edgePath)) {
  console.log('Running Microsoft Edge headless to generate PDF...');
  const cmd = `"${edgePath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --no-pdf-header-footer --print-to-pdf="${pdfFilePath}" "${htmlFilePath}"`;
  execSync(cmd, { stdio: 'inherit' });
  
  if (fs.existsSync(pdfFilePath)) {
    const stats = fs.statSync(pdfFilePath);
    console.log(`PDF successfully generated: ${pdfFilePath} (${stats.size} bytes)`);
  } else {
    console.error('PDF file was not found after edge command execution.');
  }
} else {
  console.error('Microsoft Edge executable not found at:', edgePath);
}
