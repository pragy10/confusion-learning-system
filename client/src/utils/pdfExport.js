import { jsPDF } from "jspdf";

function checkPageBreak(doc, yPos, neededSpace = 30) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (yPos + neededSpace > pageHeight - 40) {
    doc.addPage();
    return 50; // top margin of new page
  }
  return yPos;
}

export function exportPersonalNotesToPdf({ videoTitle = "Video Notes", notes = "", filename }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 45;
  const contentWidth = pageWidth - margin * 2;
  let y = 50;

  // Header banner
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text("Personal Learning Notes", margin, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Context: ${videoTitle}  |  Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, y);
  y += 18;

  // Divider
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 25;

  if (!notes.trim()) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(11);
    doc.setTextColor(148, 163, 184);
    doc.text("(No notes recorded for this session)", margin, y);
  } else {
    // Process notes lines
    const lines = notes.split("\n");
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);

    lines.forEach((line) => {
      y = checkPageBreak(doc, y, 16);
      if (line.trim().startsWith("[") && line.includes("]")) {
        // Timestamp marker line
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        const wrapped = doc.splitTextToSize(line, contentWidth);
        wrapped.forEach((wLine) => {
          y = checkPageBreak(doc, y, 16);
          doc.text(wLine, margin, y);
          y += 15;
        });
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
      } else {
        const wrapped = doc.splitTextToSize(line, contentWidth);
        wrapped.forEach((wLine) => {
          y = checkPageBreak(doc, y, 16);
          doc.text(wLine, margin, y);
          y += 14;
        });
      }
      if (line.trim() === "") y += 6;
    });
  }

  doc.save(filename || `personal-notes-${Date.now()}.pdf`);
}

export function exportNotesToPdf({ videoTitle = "Video Notes", summary = "", notes = [], filename }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 45;
  const contentWidth = pageWidth - margin * 2;
  let y = 50;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("Instant Video Notes & Summary", margin, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Video: ${videoTitle}  |  Exported: ${new Date().toLocaleDateString()}`, margin, y);
  y += 18;

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 25;

  // Executive Summary Section
  if (summary) {
    y = checkPageBreak(doc, y, 35);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text("Executive Summary", margin, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    const wrappedSummary = doc.splitTextToSize(summary, contentWidth);
    wrappedSummary.forEach((line) => {
      y = checkPageBreak(doc, y, 16);
      doc.text(line, margin, y);
      y += 15;
    });
    y += 18;
  }

  // Key Takeaways & Concepts
  if (notes && notes.length > 0) {
    y = checkPageBreak(doc, y, 35);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text("Key Concepts & Takeaways", margin, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);

    notes.forEach((item) => {
      y = checkPageBreak(doc, y, 20);
      const bulletText = `•  ${item}`;
      const wrappedItem = doc.splitTextToSize(bulletText, contentWidth - 10);
      wrappedItem.forEach((line, lineIdx) => {
        y = checkPageBreak(doc, y, 16);
        doc.text(line, margin + (lineIdx === 0 ? 0 : 12), y);
        y += 14;
      });
      y += 6;
    });
  }

  doc.save(filename || `video-summary-notes-${Date.now()}.pdf`);
}

export function exportSessionSummaryToPdf({
  videoTitle = "Current Video",
  stats = {},
  byType = {},
  aiSummary = null,
  customNotes = "",
  savedExplanations = [],
  filename,
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 45;
  const contentWidth = pageWidth - margin * 2;
  let y = 50;

  // Header Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text("Learning Session Summary", margin, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Subject: ${videoTitle}  |  Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, y);
  y += 16;

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 22;

  // Session Metrics Summary Box
  y = checkPageBreak(doc, y, 60);
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 50, 4, 4, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);

  const colW = contentWidth / 4;
  doc.text("WATCH POSITION", margin + 12, y + 18);
  doc.text("FRICTION SIGNALS", margin + colW + 12, y + 18);
  doc.text("PLAYBACK REWINDS", margin + colW * 2 + 12, y + 18);
  doc.text("SAVED ARTIFACTS", margin + colW * 3 + 12, y + 18);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(stats.watchTimeFormatted || "N/A", margin + 12, y + 36);
  doc.text(String(stats.totalConfusions || 0), margin + colW + 12, y + 36);
  doc.text(String(stats.rewindCount || 0), margin + colW * 2 + 12, y + 36);
  doc.text(String(savedExplanations.length || 0), margin + colW * 3 + 12, y + 36);
  y += 66;

  // Confusion Breakdown
  y = checkPageBreak(doc, y, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text("Confusion Diagnostics Breakdown:", margin, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  const typesText = [
    `Too Fast: ${byType.TOO_FAST || 0}`,
    `Missed Term: ${byType.MISSED_TERM || 0}`,
    `Lost Logic: ${byType.LOST_THE_LOGIC || 0}`,
    `Bigger Picture: ${byType.LOST_BIGGER_PICTURE || 0}`,
  ].join("   |   ");
  doc.text(typesText, margin, y);
  y += 24;

  // AI Learning Synthesis
  if (aiSummary) {
    y = checkPageBreak(doc, y, 50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("AI Learning Synthesis", margin, y);
    y += 16;

    if (aiSummary.overview) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      const wrappedOverview = doc.splitTextToSize(aiSummary.overview, contentWidth);
      wrappedOverview.forEach((line) => {
        y = checkPageBreak(doc, y, 14);
        doc.text(line, margin, y);
        y += 14;
      });
      y += 10;
    }

    if (aiSummary.stumbling_blocks && aiSummary.stumbling_blocks.length > 0) {
      y = checkPageBreak(doc, y, 20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text("Identified Stumbling Blocks:", margin, y);
      y += 14;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      aiSummary.stumbling_blocks.forEach((b) => {
        const wrapped = doc.splitTextToSize(`•  ${b}`, contentWidth - 10);
        wrapped.forEach((line) => {
          y = checkPageBreak(doc, y, 14);
          doc.text(line, margin + 8, y);
          y += 13;
        });
      });
      y += 8;
    }

    if (aiSummary.recommended_review && aiSummary.recommended_review.length > 0) {
      y = checkPageBreak(doc, y, 20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text("Recommended Review Steps:", margin, y);
      y += 14;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      aiSummary.recommended_review.forEach((r) => {
        const wrapped = doc.splitTextToSize(`→  ${r}`, contentWidth - 10);
        wrapped.forEach((line) => {
          y = checkPageBreak(doc, y, 14);
          doc.text(line, margin + 8, y);
          y += 13;
        });
      });
      y += 14;
    }
  }

  // Personal Notes
  if (customNotes.trim()) {
    y = checkPageBreak(doc, y, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Learner Personal Notes", margin, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const wrappedNotes = doc.splitTextToSize(customNotes, contentWidth);
    wrappedNotes.forEach((line) => {
      y = checkPageBreak(doc, y, 14);
      doc.text(line, margin, y);
      y += 14;
    });
    y += 16;
  }

  // Saved Explanations
  if (savedExplanations.length > 0) {
    y = checkPageBreak(doc, y, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`Saved Explanations (${savedExplanations.length})`, margin, y);
    y += 16;

    savedExplanations.forEach((exp, idx) => {
      y = checkPageBreak(doc, y, 40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(`${idx + 1}. [${exp.confusion_type}]`, margin, y);
      y += 14;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const wrappedExp = doc.splitTextToSize(exp.explanation, contentWidth - 10);
      wrappedExp.forEach((line) => {
        y = checkPageBreak(doc, y, 13);
        doc.text(line, margin + 10, y);
        y += 13;
      });

      if (exp.key_point) {
        y = checkPageBreak(doc, y, 14);
        doc.setFont("helvetica", "italic");
        doc.text(`Key takeaway: ${exp.key_point}`, margin + 10, y);
        y += 14;
      }
      y += 8;
    });
  }

  doc.save(filename || `learning-session-summary-${Date.now()}.pdf`);
}
