import jsPDF from "jspdf"

// Helper function to split text into lines based on column width
const splitText = (text, maxWidth, doc) => {
  const words = String(text).split(" ")
  const lines = []
  let currentLine = ""

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const width = doc.getTextWidth(testLine)
    
    if (width > maxWidth - 4) {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  })
  
  if (currentLine) lines.push(currentLine)
  return lines
}

// Helper function to draw a simple table with better text handling
const drawTable = (doc, startY, headers, rows, columnWidths) => {
  const pageHeight = doc.internal.pageSize.height
  const pageWidth = doc.internal.pageSize.width
  const cellPadding = 1.5
  const baseHeight = 7
  let cellHeight = baseHeight + cellPadding * 2
  const margin = 10
  const startX = margin

  let currentY = startY
  const headerBg = [59, 130, 246]
  const rowBg = [255, 255, 255]
  const alternateRowBg = [240, 248, 255]
  const borderColor = [150, 150, 150]

  // Draw header
  let currentX = startX
  headers.forEach((header, i) => {
    const lines = splitText(header, columnWidths[i], doc)
    const height = Math.max(cellHeight, lines.length * 5 + cellPadding * 2)
    
    // Fill background
    doc.setFillColor(...headerBg)
    doc.rect(currentX, currentY, columnWidths[i], height, "F")
    
    // Draw border
    doc.setDrawColor(...borderColor)
    doc.setLineWidth(0.5)
    doc.rect(currentX, currentY, columnWidths[i], height)
    
    // Draw text
    doc.setTextColor(255, 255, 255)
    doc.setFont(undefined, "bold")
    doc.setFontSize(8)
    let textY = currentY + cellPadding + 3
    lines.forEach((line) => {
      doc.text(line, currentX + cellPadding, textY, { maxWidth: columnWidths[i] - cellPadding * 2 })
      textY += 5
    })
    
    cellHeight = Math.max(cellHeight, height)
    currentX += columnWidths[i]
  })

  currentY += cellHeight

  // Draw rows
  rows.forEach((row, rowIndex) => {
    // Calculate row height based on content
    let maxLines = 1
    row.forEach((cell, i) => {
      const lines = splitText(cell, columnWidths[i], doc)
      maxLines = Math.max(maxLines, lines.length)
    })
    
    const rowHeight = Math.max(baseHeight + cellPadding * 2, maxLines * 5 + cellPadding * 2)

    // Check if we need a new page
    if (currentY + rowHeight > pageHeight - 25) {
      doc.addPage()
      currentY = margin
      
      // Redraw header on new page
      currentX = startX
      headers.forEach((header, i) => {
        const hLines = splitText(header, columnWidths[i], doc)
        const hHeight = Math.max(cellHeight, hLines.length * 5 + cellPadding * 2)
        
        doc.setFillColor(...headerBg)
        doc.rect(currentX, currentY, columnWidths[i], hHeight, "F")
        
        doc.setDrawColor(...borderColor)
        doc.setLineWidth(0.5)
        doc.rect(currentX, currentY, columnWidths[i], hHeight)
        
        doc.setTextColor(255, 255, 255)
        doc.setFont(undefined, "bold")
        doc.setFontSize(8)
        let textY = currentY + cellPadding + 3
        hLines.forEach((line) => {
          doc.text(line, currentX + cellPadding, textY, { maxWidth: columnWidths[i] - cellPadding * 2 })
          textY += 5
        })
        currentX += columnWidths[i]
      })
      
      currentY += cellHeight
    }

    // Alternate row colors
    const bgColor = rowIndex % 2 === 0 ? rowBg : alternateRowBg

    currentX = startX
    row.forEach((cell, i) => {
      // Fill background
      doc.setFillColor(...bgColor)
      doc.rect(currentX, currentY, columnWidths[i], rowHeight, "F")
      
      // Draw border
      doc.setDrawColor(...borderColor)
      doc.setLineWidth(0.4)
      doc.rect(currentX, currentY, columnWidths[i], rowHeight)
      
      // Draw text
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, "normal")
      doc.setFontSize(7)
      const lines = splitText(cell, columnWidths[i], doc)
      let textY = currentY + cellPadding + 3
      lines.forEach((line) => {
        doc.text(line, currentX + cellPadding, textY, { maxWidth: columnWidths[i] - cellPadding * 2 })
        textY += 5
      })
      
      currentX += columnWidths[i]
    })

    currentY += rowHeight
  })

  return currentY
}

// Add page numbers to all pages in the document
const addPageNumbers = (doc) => {
  const pageHeight = doc.internal.pageSize.height
  const pageWidth = doc.internal.pageSize.width
  const pageCount = doc.getNumberOfPages()
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(9)
    doc.setFont(undefined, "italic")
    doc.setTextColor(128, 128, 128)
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: "center" })
  }
}

// Generate PDF for Biomarkers
export const generateBiomarkersPDF = (exportData, userEmail) => {
  try {
    console.log("Starting biomarkers PDF generation...")
    const doc = new jsPDF("p", "mm", "a4")
    const pageHeight = doc.internal.pageSize.height
    const pageWidth = doc.internal.pageSize.width
    const margin = 8

    // Title
    doc.setFontSize(18)
    doc.setFont(undefined, "bold")
    doc.setTextColor(0, 0, 0)
    doc.text("Medical Biomarkers Report", pageWidth / 2, 15, { align: "center" })

    // Header Info
    doc.setFontSize(9)
    doc.setFont(undefined, "normal")
    doc.text(`User: ${exportData.user}`, margin, 25)
    doc.text(`Export Date: ${exportData.exportDate}`, margin, 30)
    doc.text(`Total Entries: ${exportData.totalEntries}`, margin, 35)
    doc.text(`Period: ${exportData.dateRange.from} to ${exportData.dateRange.to}`, margin, 40)

    // Table data - adjusted column widths for better content fit
    const headers = ["Date", "Time", "Biomarker", "Reading", "Unit", "Range", "Notes"]
    // Total available width: 210mm - (2 * 8mm margin) = 194mm
    // Adjusted column widths to fit better
    const columnWidths = [22, 18, 35, 20, 15, 25, 59]
    
    const rows = exportData.biomarkers.map((b) => [
      b.date,
      b.time || "—",
      b.label,
      b.value,
      b.unit,
      b.normalRange,
      b.notes
    ])

    // Draw table
    drawTable(doc, 47, headers, rows, columnWidths)

    // Add page numbers
    addPageNumbers(doc)

    // Download
    const fileName = `biomarkers_${userEmail}_last30days_${new Date().toISOString().split("T")[0]}.pdf`
    doc.save(fileName)
    console.log("Biomarkers PDF generated successfully:", fileName)
  } catch (error) {
    console.error("Error generating biomarkers PDF:", error)
    throw error
  }
}

// Generate PDF for Medications
export const generateMedicationsPDF = (exportData, userEmail) => {
  try {
    console.log("Starting medications PDF generation...")
    const doc = new jsPDF("p", "mm", "a4")
    const pageHeight = doc.internal.pageSize.height
    const pageWidth = doc.internal.pageSize.width
    const margin = 8

    // Title
    doc.setFontSize(18)
    doc.setFont(undefined, "bold")
    doc.setTextColor(0, 0, 0)
    doc.text("Medication Tracker Report", pageWidth / 2, 15, { align: "center" })

    // Header Info
    doc.setFontSize(9)
    doc.setFont(undefined, "normal")
    doc.text(`User: ${exportData.user}`, margin, 25)
    doc.text(`Tracked Date: ${exportData.trackedDate}`, margin, 30)
    doc.text(`Total Medications: ${exportData.totalMedications}`, margin, 35)
    doc.text(`Doses Completed Today: ${exportData.totalDosesCompleted}`, margin, 40)

    // Summary table with adjusted column widths
    const medsHeaders = ["Medication", "Concentration", "Medium", "Dosage", "Frequency", "Doses", "Adherence %"]
    const medsColumnWidths = [40, 25, 18, 22, 30, 20, 20]

    const medsRows = exportData.medications.map((m) => [
      m.name,
      m.concentration,
      m.medium,
      m.dosage,
      m.frequency,
      `${m.dosesCompleted}/${m.dosesScheduled}`,
      `${m.completionPercentage}%`
    ])

    drawTable(doc, 47, medsHeaders, medsRows, medsColumnWidths)

    // Add new page for details
    doc.addPage()
    doc.setFontSize(14)
    doc.setFont(undefined, "bold")
    doc.setTextColor(0, 0, 0)
    doc.text("Detailed Dose Schedule", margin, 15)

    let detailYPosition = 25

    exportData.medications.forEach((med, idx) => {
      // Check page overflow
      if (detailYPosition > pageHeight - 40) {
        doc.addPage()
        detailYPosition = margin
      }

      // Medication name
      doc.setFontSize(10)
      doc.setFont(undefined, "bold")
      doc.text(`${med.name} - ${med.concentration}`, margin, detailYPosition)
      detailYPosition += 6

      // Frequency and notes  
      doc.setFontSize(8)
      doc.setFont(undefined, "normal")
      doc.text(`Frequency: ${med.frequency} | Dosage: ${med.dosage}`, margin, detailYPosition)
      detailYPosition += 5
      doc.text(`Notes: ${med.notes}`, margin, detailYPosition)
      detailYPosition += 8

      // Dose details mini table
      const doseHeaders = ["Dose", "Scheduled Time", "Status"]
      const doseColumnWidths = [50, 65, 42]

      const doseRows = med.doseDetails.map((d) => [
        d.dose,
        d.scheduledTime,
        d.completed ? "✓ Completed" : "○ Pending"
      ])

      detailYPosition = drawTable(doc, detailYPosition, doseHeaders, doseRows, doseColumnWidths) + 5
    })

    // Add page numbers to all pages
    addPageNumbers(doc)

    // Download
    const fileName = `medications_${userEmail}_${exportData.trackedDate}.pdf`
    doc.save(fileName)
    console.log("Medications PDF generated successfully:", fileName)
  } catch (error) {
    console.error("Error generating medications PDF:", error)
    throw error
  }
}

// Filter data to last 30 days
export const filterLast30Days = (items, dateField = "date", createdAtField = "createdAt") => {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  return items.filter((item) => {
    const itemDate = item[dateField] ? new Date(item[dateField]) : new Date(item[createdAtField])
    return itemDate >= thirtyDaysAgo
  })
}

// Generate Combined PDF for Biomarkers and Medications
export const generateCombinedPDF = (biomarkersData, medicationsData, userEmail) => {
  try {
    console.log("Starting combined PDF generation...")
    const doc = new jsPDF("p", "mm", "a4")
    const pageHeight = doc.internal.pageSize.height
    const pageWidth = doc.internal.pageSize.width
    const margin = 8

    // Title
    doc.setFontSize(18)
    doc.setFont(undefined, "bold")
    doc.setTextColor(0, 0, 0)
    doc.text("Health Tracking Report", pageWidth / 2, 15, { align: "center" })

    // Header Info
    doc.setFontSize(9)
    doc.setFont(undefined, "normal")
    doc.text(`User: ${biomarkersData.user || userEmail}`, margin, 25)
    doc.text(`Report Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, margin, 30)

    // SECTION 1: MEDICAL BIOMARKERS
    doc.setFontSize(12)
    doc.setFont(undefined, "bold")
    doc.setTextColor(59, 130, 246)
    doc.text("Medical Biomarkers (Last 30 Days)", margin, 38)
    doc.setTextColor(0, 0, 0)

    if (biomarkersData.biomarkers && biomarkersData.biomarkers.length > 0) {
      const bioHeaders = ["Date", "Time", "Biomarker", "Reading", "Unit", "Range", "Notes"]
      const bioColumnWidths = [22, 18, 35, 20, 15, 25, 59]

      const bioRows = biomarkersData.biomarkers.map((b) => [
        b.date,
        b.time,
        b.biomarker,
        b.reading,
        b.unit,
        b.normalRange,
        b.notes
      ])

      let bioTableY = drawTable(doc, 42, bioHeaders, bioRows, bioColumnWidths)

      // SECTION 2: MEDICATIONS TODAY
      doc.setFontSize(12)
      doc.setFont(undefined, "bold")
      doc.setTextColor(59, 130, 246)
      doc.text("Medication Adherence", margin, bioTableY + 8)
      doc.setTextColor(0, 0, 0)

      if (medicationsData.medications && medicationsData.medications.length > 0) {
        const medHeaders = ["Medication", "Concentration", "Dosage", "Frequency", "Doses Today", "Adherence"]
        const medColumnWidths = [45, 25, 22, 30, 28, 25]

        const medRows = medicationsData.medications.map((m) => [
          m.name,
          m.concentration,
          m.dosage,
          m.frequency,
          `${m.dosesCompleted}/${m.dosesScheduled}`,
          `${m.completionPercentage}%`
        ])

        drawTable(doc, bioTableY + 12, medHeaders, medRows, medColumnWidths)
      } else {
        doc.setFontSize(9)
        doc.setFont(undefined, "normal")
        doc.text("No medications tracked", margin, bioTableY + 15)
      }
    } else {
      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.text("No biomarkers recorded in the last 30 days", margin, 45)
    }

    // Add page numbers to all pages
    addPageNumbers(doc)

    // Download
    const fileName = `health_report_${userEmail}_${new Date().toISOString().split("T")[0]}.pdf`
    doc.save(fileName)
    console.log("Combined PDF generated successfully:", fileName)
  } catch (error) {
    console.error("Error generating combined PDF:", error)
    throw error
  }
}

// Format date for display
export const formatDateForDisplay = (dateStr) => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}
