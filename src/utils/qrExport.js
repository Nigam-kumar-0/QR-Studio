import jsPDF from 'jspdf';

export async function exportAsPNG(qrInstance, name = 'qr-code', size = 1024) {
  if (!qrInstance) return;
  const fileName = `${name.toLowerCase().replace(/[^a-z0-9]/gi, '-')}-${size}px.png`;

  // Update size temporarily for high-res render
  const originalWidth = qrInstance._options.width;
  const originalHeight = qrInstance._options.height;

  try {
    qrInstance.update({
      width: size,
      height: size,
    });

    await qrInstance.download({
      name: fileName.replace('.png', ''),
      extension: 'png',
    });
  } finally {
    // Restore preview size
    qrInstance.update({
      width: originalWidth,
      height: originalHeight,
    });
  }
}

export async function exportAsSVG(qrInstance, name = 'qr-code') {
  if (!qrInstance) return;
  const fileName = `${name.toLowerCase().replace(/[^a-z0-9]/gi, '-')}.svg`;

  await qrInstance.download({
    name: fileName.replace('.svg', ''),
    extension: 'svg',
  });
}

export async function exportAsPDF(qrInstance, name = 'QR Code', details = '') {
  if (!qrInstance) return;

  const originalWidth = qrInstance._options.width;
  const originalHeight = qrInstance._options.height;

  try {
    // Render at 1200px for print sharpness
    qrInstance.update({ width: 1200, height: 1200 });
    const rawBlob = await qrInstance.getRawData('png');
    
    // Read blob as Data URL
    const reader = new FileReader();
    const dataUrl = await new Promise((resolve) => {
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(rawBlob);
    });

    // Create A4 PDF (210mm x 297mm)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Clean background & header
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 210, 297, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text(name || 'QR Code', 105, 36, { align: 'center' });

    // Subtitle / destination
    if (details) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      const splitText = doc.splitTextToSize(details, 150);
      doc.text(splitText, 105, 44, { align: 'center' });
    }

    // QR Image Card Frame
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(40, 56, 130, 150, 6, 6, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.roundedRect(40, 56, 130, 150, 6, 6, 'D');

    // Place QR code image centered inside card
    doc.addImage(dataUrl, 'PNG', 45, 62, 120, 120);

    // Scan CTA
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(79, 70, 229);
    doc.text('POINT PHONE CAMERA TO SCAN', 105, 194, { align: 'center' });

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Generated with QR Studio • Production Standard ISO/IEC 18004', 105, 280, { align: 'center' });

    const safeName = (name || 'qr-code').toLowerCase().replace(/[^a-z0-9]/gi, '-');
    doc.save(`${safeName}-print.pdf`);
  } catch (err) {
    console.error('PDF generation error:', err);
  } finally {
    qrInstance.update({ width: originalWidth, height: originalHeight });
  }
}

export async function copyQRImageToClipboard(qrInstance) {
  if (!qrInstance) return false;
  try {
    const blob = await qrInstance.getRawData('png');
    if (!navigator.clipboard?.write) {
      return false;
    }
    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
    return true;
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
}

export async function shareQRCode(qrInstance, title = 'QR Code', url = '') {
  if (navigator.share) {
    try {
      const blob = await qrInstance.getRawData('png');
      const file = new File([blob], 'qr-code.png', { type: 'image/png' });
      
      const shareData = {
        title,
        text: `Scan ${title}`,
      };

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        shareData.files = [file];
      } else if (url) {
        shareData.url = url;
      }

      await navigator.share(shareData);
      return true;
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.warn('Native share failed', e);
      }
    }
  }
  return false;
}
