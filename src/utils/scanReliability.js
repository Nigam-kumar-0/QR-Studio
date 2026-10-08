// Calculates relative luminance according to WCAG 2.1
function getLuminance(hexColor) {
  let c = (hexColor || '#000000').replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;

  const a = [r, g, b].map(v => {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function calculateContrastRatio(fgHex, bgHex) {
  if (bgHex === 'transparent') {
    // Assume standard surface behind transparent background
    bgHex = '#ffffff';
  }
  const lum1 = getLuminance(fgHex);
  const lum2 = getLuminance(bgHex);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export function evaluateScanReliability(dataString, config) {
  const issues = [];
  let score = 100;
  let recommendedECL = 'M';

  // 1. Check data length
  const length = (dataString || '').length;
  if (length === 0) {
    return {
      status: 'empty',
      label: 'Empty Data',
      color: 'slate',
      score: 0,
      errorCorrectionLevel: 'M',
      issues: ['No content provided yet.']
    };
  }

  // 2. Contrast evaluation
  const fgColor = config.gradient?.colorStops?.[0]?.color || config.fgColor || '#000000';
  const bgColor = config.bgColor || '#ffffff';
  const contrastRatio = calculateContrastRatio(fgColor, bgColor);

  if (contrastRatio < 2.5) {
    score -= 45;
    issues.push('Very low contrast between dots and background. Most scanners will fail.');
  } else if (contrastRatio < 4.5) {
    score -= 20;
    issues.push('Moderate contrast. Low-light or budget phone cameras may struggle.');
  }

  // 3. Logo occlusion check
  if (config.logo) {
    // If a logo is embedded, error correction must be high to guarantee readability
    recommendedECL = 'H';
    if (config.logoSize > 0.28) {
      score -= 25;
      issues.push('Logo occupies >28% width. Error correction boosted to High (30% recovery).');
    } else {
      issues.push('Error correction boosted to High (H) to restore logo occlusion.');
    }
  } else if (length > 250) {
    recommendedECL = 'Q';
  }

  // 4. Dot style readability
  if (config.dotsType === 'dots' && config.bgColor === 'transparent') {
    score -= 10;
    issues.push('Transparent background on circular dots may lower contrast on patterned walls.');
  }

  // Final evaluation status
  let status = 'excellent';
  let label = 'High Contrast • Easy to Scan';
  let badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

  if (score < 50) {
    status = 'critical';
    label = 'Low Contrast • Hard to Scan';
    badgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  } else if (score < 80) {
    status = 'moderate';
    label = 'Moderate Contrast';
    badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  }

  return {
    status,
    label,
    score,
    contrastRatio: Number(contrastRatio.toFixed(1)),
    errorCorrectionLevel: recommendedECL,
    issues,
    badgeColor
  };
}
