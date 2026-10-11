import jsPDF from 'jspdf';

/**
 * Helper to draw a rounded rectangle on a 2D canvas context.
 */
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Creates a high-resolution composite canvas containing the QR code and any
 * active frames, header ribbons/titles, and footer badges/subtext.
 */
export async function getFramedCanvas(qrTarget, config = {}, targetSize = 1024) {
  const qrInstance = qrTarget?.getInstance ? qrTarget.getInstance() : qrTarget;
  if (!qrInstance) return null;

  const resolvedConfig = {
    ...(qrTarget?.getConfig ? qrTarget.getConfig() : {}),
    ...(config || {})
  };

  const frameType = resolvedConfig.frame || 'none';
  const frameTitle = resolvedConfig.frameTitle || 'SCAN CODE';
  const frameText = resolvedConfig.frameText || 'SCAN ME';
  const frameColor = resolvedConfig.frameColor || resolvedConfig.fgColor || '#4f46e5';
  const bgColor = (resolvedConfig.bgColor === 'transparent' || !resolvedConfig.bgColor) ? '#ffffff' : resolvedConfig.bgColor;
  const fgColor = resolvedConfig.fgColor || '#0f172a';

  // Temporarily update QR size for high-res export
  const originalWidth = qrInstance._options.width;
  const originalHeight = qrInstance._options.height;

  let qrImg;
  try {
    qrInstance.update({ width: targetSize, height: targetSize });
    const rawBlob = await qrInstance.getRawData('png');
    qrImg = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(rawBlob);
    });
  } finally {
    qrInstance.update({ width: originalWidth, height: originalHeight });
  }

  // If no frame configured, return canvas with bare high-res QR code
  if (frameType === 'none') {
    const rawCanvas = document.createElement('canvas');
    rawCanvas.width = targetSize;
    rawCanvas.height = targetSize;
    const ctx = rawCanvas.getContext('2d');
    ctx.drawImage(qrImg, 0, 0, targetSize, targetSize);
    return rawCanvas;
  }

  // Calculate layout geometry proportional to targetSize
  const S = targetSize;
  const padding = Math.round(S * 0.08); // e.g. 82px
  let headerH = 0;
  let footerH = 0;

  if (frameType === 'promotional') {
    headerH = Math.round(S * 0.12);
  } else if (['card', 'table-tent', 'ticket', 'social-badge'].includes(frameType)) {
    headerH = Math.round(S * 0.11);
  }

  if (['scan-me-bottom', 'social-badge'].includes(frameType)) {
    footerH = Math.round(S * 0.14);
  } else if (['card', 'table-tent', 'ticket'].includes(frameType)) {
    footerH = Math.round(S * 0.10);
  }

  const canvasWidth = S + padding * 2;
  const canvasHeight = S + padding * 2 + headerH + footerH;
  const cardRadius = Math.round(S * 0.04);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  // Fill outer card background
  drawRoundedRect(ctx, 0, 0, canvasWidth, canvasHeight, cardRadius);
  ctx.fillStyle = bgColor;
  ctx.fill();

  // 1. Promotional Header Ribbon
  if (frameType === 'promotional') {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0 + cardRadius, 0);
    ctx.lineTo(canvasWidth - cardRadius, 0);
    ctx.quadraticCurveTo(canvasWidth, 0, canvasWidth, cardRadius);
    ctx.lineTo(canvasWidth, headerH);
    ctx.lineTo(0, headerH);
    ctx.lineTo(0, cardRadius);
    ctx.quadraticCurveTo(0, 0, cardRadius, 0);
    ctx.closePath();
    ctx.fillStyle = frameColor;
    ctx.fill();

    ctx.font = `bold ${Math.round(headerH * 0.42)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(frameText.toUpperCase(), canvasWidth / 2, headerH / 2);
    ctx.restore();

    // Border around rest of card
    ctx.save();
    drawRoundedRect(ctx, 0, 0, canvasWidth, canvasHeight, cardRadius);
    ctx.lineWidth = Math.round(S * 0.015);
    ctx.strokeStyle = frameColor;
    ctx.stroke();
    ctx.restore();
  }

  // 2. Simple Border Frame
  if (frameType === 'simple') {
    ctx.save();
    drawRoundedRect(ctx, 0, 0, canvasWidth, canvasHeight, cardRadius);
    ctx.lineWidth = Math.round(S * 0.02);
    ctx.strokeStyle = frameColor;
    ctx.stroke();
    ctx.restore();
  }

  // 3. Card Frame (Header title with status dot, footer subtext)
  if (frameType === 'card') {
    ctx.save();
    // Card outer border
    drawRoundedRect(ctx, 0, 0, canvasWidth, canvasHeight, cardRadius);
    ctx.lineWidth = Math.round(S * 0.006);
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();

    // Top Header text
    const headerY = padding + headerH * 0.45;
    ctx.font = `bold ${Math.round(headerH * 0.36)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = '#334155';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(frameTitle.toUpperCase(), padding, headerY);

    // Status dot
    const dotX = canvasWidth - padding - Math.round(headerH * 0.15);
    ctx.beginPath();
    ctx.arc(dotX, headerY, Math.round(headerH * 0.12), 0, Math.PI * 2);
    ctx.fillStyle = frameColor;
    ctx.fill();

    // Divider line
    ctx.beginPath();
    ctx.moveTo(padding, padding + headerH * 0.85);
    ctx.lineTo(canvasWidth - padding, padding + headerH * 0.85);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = Math.round(S * 0.003);
    ctx.stroke();

    // Bottom Subtext
    const footerY = padding + headerH + S + footerH * 0.6;
    ctx.beginPath();
    ctx.moveTo(padding, padding + headerH + S + footerH * 0.15);
    ctx.lineTo(canvasWidth - padding, padding + headerH + S + footerH * 0.15);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = Math.round(S * 0.003);
    ctx.stroke();

    ctx.font = `500 ${Math.round(footerH * 0.38)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(frameText, canvasWidth / 2, footerY);
    ctx.restore();
  }

  // 4. Table Tent Frame (Accent border, centered header & footer)
  if (frameType === 'table-tent') {
    ctx.save();
    drawRoundedRect(ctx, 0, 0, canvasWidth, canvasHeight, cardRadius);
    ctx.lineWidth = Math.round(S * 0.01);
    ctx.strokeStyle = '#d97706';
    ctx.stroke();

    // Top Header
    ctx.font = `900 ${Math.round(headerH * 0.38)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = '#b45309';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(frameTitle.toUpperCase(), canvasWidth / 2, padding + headerH * 0.45);

    ctx.beginPath();
    ctx.moveTo(padding, padding + headerH * 0.85);
    ctx.lineTo(canvasWidth - padding, padding + headerH * 0.85);
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = Math.round(S * 0.003);
    ctx.stroke();

    // Bottom subtext
    ctx.beginPath();
    ctx.moveTo(padding, padding + headerH + S + footerH * 0.15);
    ctx.lineTo(canvasWidth - padding, padding + headerH + S + footerH * 0.15);
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = Math.round(S * 0.003);
    ctx.stroke();

    ctx.font = `600 ${Math.round(footerH * 0.36)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = '#92400e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(frameText, canvasWidth / 2, padding + headerH + S + footerH * 0.6);
    ctx.restore();
  }

  // 5. Ticket Frame (Dashed border, PASS badge)
  if (frameType === 'ticket') {
    ctx.save();
    ctx.setLineDash([Math.round(S * 0.015), Math.round(S * 0.01)]);
    drawRoundedRect(ctx, 0, 0, canvasWidth, canvasHeight, cardRadius);
    ctx.lineWidth = Math.round(S * 0.006);
    ctx.strokeStyle = '#a855f7';
    ctx.stroke();
    ctx.setLineDash([]);

    // Header title
    const headerY = padding + headerH * 0.45;
    ctx.font = `bold ${Math.round(headerH * 0.34)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(frameTitle.toUpperCase(), padding, headerY);

    // PASS Badge pill
    const badgeW = Math.round(headerH * 0.8);
    const badgeH = Math.round(headerH * 0.38);
    const badgeX = canvasWidth - padding - badgeW;
    const badgeY = headerY - badgeH / 2;
    drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, Math.round(badgeH / 2));
    ctx.fillStyle = '#f1f5f9';
    ctx.fill();
    ctx.font = `bold ${Math.round(badgeH * 0.6)}px monospace`;
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'center';
    ctx.fillText('PASS', badgeX + badgeW / 2, headerY);

    // Dashed divider
    ctx.beginPath();
    ctx.setLineDash([Math.round(S * 0.01), Math.round(S * 0.008)]);
    ctx.moveTo(padding, padding + headerH * 0.85);
    ctx.lineTo(canvasWidth - padding, padding + headerH * 0.85);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = Math.round(S * 0.003);
    ctx.stroke();

    // Footer
    ctx.beginPath();
    ctx.moveTo(padding, padding + headerH + S + footerH * 0.15);
    ctx.lineTo(canvasWidth - padding, padding + headerH + S + footerH * 0.15);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = `${Math.round(footerH * 0.36)}px monospace`;
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText(frameText, canvasWidth / 2, padding + headerH + S + footerH * 0.6);
    ctx.restore();
  }

  // 6. Social Badge Frame (Header with checkmark, bottom pill)
  if (frameType === 'social-badge') {
    ctx.save();
    drawRoundedRect(ctx, 0, 0, canvasWidth, canvasHeight, cardRadius);
    ctx.lineWidth = Math.round(S * 0.006);
    ctx.strokeStyle = '#f43f5e';
    ctx.stroke();

    // Top Header with verified checkmark
    const headerY = padding + headerH * 0.45;
    ctx.font = `bold ${Math.round(headerH * 0.38)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${frameTitle} ✓`, canvasWidth / 2, headerY);

    // Divider
    ctx.beginPath();
    ctx.moveTo(padding, padding + headerH * 0.85);
    ctx.lineTo(canvasWidth - padding, padding + headerH * 0.85);
    ctx.strokeStyle = '#ffe4e6';
    ctx.lineWidth = Math.round(S * 0.003);
    ctx.stroke();

    // Bottom Pill Badge
    const pillH = Math.round(footerH * 0.55);
    const pillW = Math.min(canvasWidth - padding * 2, Math.round(S * 0.5));
    const pillX = (canvasWidth - pillW) / 2;
    const pillY = padding + headerH + S + Math.round((footerH - pillH) / 2);
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, Math.round(pillH / 2));
    ctx.fillStyle = frameColor;
    ctx.fill();

    ctx.font = `bold ${Math.round(pillH * 0.45)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(frameText, canvasWidth / 2, pillY + pillH / 2);
    ctx.restore();
  }

  // 7. Scan Me Bottom Pill Frame
  if (frameType === 'scan-me-bottom') {
    ctx.save();
    // Subtle card border
    drawRoundedRect(ctx, 0, 0, canvasWidth, canvasHeight, cardRadius);
    ctx.lineWidth = Math.round(S * 0.006);
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();

    // Bottom Pill Badge
    const pillH = Math.round(footerH * 0.55);
    const pillW = Math.min(canvasWidth - padding * 2, Math.round(S * 0.55));
    const pillX = (canvasWidth - pillW) / 2;
    const pillY = padding + headerH + S + Math.round((footerH - pillH) / 2);
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, Math.round(pillH / 2));
    ctx.fillStyle = frameColor;
    ctx.fill();

    ctx.font = `bold ${Math.round(pillH * 0.45)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(frameText.toUpperCase(), canvasWidth / 2, pillY + pillH / 2);
    ctx.restore();
  }

  // Draw the QR Code image in the exact center!
  ctx.drawImage(qrImg, padding, padding + headerH, S, S);

  return canvas;
}

export async function exportAsPNG(qrTarget, name = 'qr-code', size = 1024, config = {}) {
  const canvas = await getFramedCanvas(qrTarget, config, size);
  if (!canvas) return;

  const fileName = `${name.toLowerCase().replace(/[^a-z0-9]/gi, '-')}-${size}px.png`;
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportAsSVG(qrTarget, name = 'qr-code', config = {}) {
  const canvas = await getFramedCanvas(qrTarget, config, 1024);
  if (!canvas) return;

  const dataUrl = canvas.toDataURL('image/png');
  const fileName = `${name.toLowerCase().replace(/[^a-z0-9]/gi, '-')}.svg`;

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">
  <image href="${dataUrl}" width="${canvas.width}" height="${canvas.height}" />
</svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportAsPDF(qrTarget, name = 'QR Code', details = '', config = {}) {
  const canvas = await getFramedCanvas(qrTarget, config, 1200);
  if (!canvas) return;

  const dataUrl = canvas.toDataURL('image/png');

  // Create A4 PDF (210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Background
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, 210, 297, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text(name || 'QR Code', 105, 34, { align: 'center' });

  // Subtitle / destination
  if (details) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    const splitText = doc.splitTextToSize(details, 150);
    doc.text(splitText, 105, 42, { align: 'center' });
  }

  // Calculate proportional card dimensions for the framed canvas
  const aspect = canvas.height / canvas.width;
  const cardW = 120;
  const cardH = cardW * aspect;
  const cardX = (210 - cardW) / 2;
  const cardY = 52;

  // Place framed QR code image centered inside PDF
  doc.addImage(dataUrl, 'PNG', cardX, cardY, cardW, cardH);

  // Scan CTA below card
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(79, 70, 229);
  doc.text('POINT PHONE CAMERA TO SCAN', 105, Math.min(270, cardY + cardH + 16), { align: 'center' });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Generated with QR Studio • Production Standard ISO/IEC 18004', 105, 285, { align: 'center' });

  const safeName = (name || 'qr-code').toLowerCase().replace(/[^a-z0-9]/gi, '-');
  doc.save(`${safeName}-print.pdf`);
}

export async function copyQRImageToClipboard(qrTarget, config = {}) {
  const canvas = await getFramedCanvas(qrTarget, config, 1024);
  if (!canvas) return false;

  try {
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
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

export async function shareQRCode(qrTarget, title = 'QR Code', url = '', config = {}) {
  if (navigator.share) {
    try {
      const canvas = await getFramedCanvas(qrTarget, config, 1024);
      if (!canvas) return false;

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
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
