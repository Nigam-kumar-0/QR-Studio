/**
 * Finds a canvas element by ID and triggers a download of its contents as a PNG.
 * 
 * @param {string} canvasId - The HTML ID of the canvas element.
 * @param {string} fileName - The desired name for the downloaded file.
 */
export const downloadCanvasAsPNG = (canvasId, fileName = 'qrcode') => {
  const canvas = document.getElementById(canvasId);
  
  if (!canvas) {
    console.error(`Canvas with id ${canvasId} not found.`);
    return;
  }

  // Convert the canvas to a Base64 image URL
  const pngUrl = canvas
    .toDataURL('image/png')
    .replace('image/png', 'image/octet-stream');
  
  // Create a temporary link element to trigger the download
  const downloadLink = document.createElement('a');
  downloadLink.href = pngUrl;
  
  // Clean up the file name to ensure it's valid
  const safeFileName = fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  downloadLink.download = `${safeFileName}.png`;
  
  // Append, click, and remove the link
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
};