import { useRef } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';

const DEFAULT_DESIGN = {
  size: 500,

  bgColor: '#ffffff',
  fgColor: '#000000',

  logo: '',
  logoSize: 0.20,

  errorLevel: 'H',

  includeMargin: true,
  marginSize: 4,

  title: '',
  subtitle: '',

  frame: false,
  frameColor: '#ffffff',
  frameRadius: 'rounded',

  // Preview only
  previewMaxSize: 340,
};

const FRAME_RADIUS = {
  square: 'rounded-none',
  rounded: 'rounded-2xl',
  pill: 'rounded-[2rem]',
};

export default function QRCodePreview({
  value = '',
  design = {},
  showActions = true,
}) {
  const canvasRef = useRef(null);
  const qrRef = useRef(null);

  const config = {
    ...DEFAULT_DESIGN,
    ...design,
  };

  // This is the actual export resolution.
  const exportSize = Math.min(
    2000,
    Math.max(150, Number(config.size) || 500)
  );

  // Preview size is intentionally independent from export size.
  const previewMaxSize = Math.min(
    420,
    Math.max(220, Number(config.previewMaxSize) || 340)
  );

  const logoSize = Math.min(
    0.25,
    Math.max(0.10, Number(config.logoSize) || 0.20)
  );

  const downloadPNG = () => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const link = document.createElement('a');

    link.download = 'qr-code.png';
    link.href = canvas.toDataURL('image/png', 1.0);

    link.click();
  };

  const downloadSVG = () => {
    const svg = qrRef.current?.querySelector('.qr-svg-export');

    if (!svg) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);

    const blob = new Blob(
      [source],
      { type: 'image/svg+xml;charset=utf-8' }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.download = 'qr-code.svg';
    link.href = url;

    link.click();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const copyImage = async () => {
    const canvas = canvasRef.current;

    if (
      !canvas ||
      !navigator.clipboard ||
      typeof ClipboardItem === 'undefined'
    ) {
      return;
    }

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ]);
      } catch (error) {
        console.error('Unable to copy QR code:', error);
      }
    });
  };

  const qrImageSettings = config.logo
    ? {
        src: config.logo,

        width: exportSize * logoSize,
        height: exportSize * logoSize,

        excavate: true,
      }
    : undefined;

  const radiusClass =
    FRAME_RADIUS[config.frameRadius] || FRAME_RADIUS.rounded;

  return (
    <div className="w-full min-w-0">
      <div
        className={[
          'flex w-full min-w-0 flex-col items-center',
          'overflow-hidden rounded-2xl',
          'border border-gray-200',
          'bg-gray-50',
          'p-4 sm:p-6',
          config.frame ? 'shadow-sm' : '',
        ].join(' ')}
      >
        {/* Header */}
        {(config.title || config.subtitle) && (
          <div className="mb-5 w-full text-center">
            {config.title && (
              <h3 className="text-lg font-semibold text-gray-900">
                {config.title}
              </h3>
            )}

            {config.subtitle && (
              <p className="mt-1 text-sm text-gray-500">
                {config.subtitle}
              </p>
            )}
          </div>
        )}

        {/* Responsive Preview Area */}
        {value ? (
          <div
            className={[
              'flex w-full min-w-0 items-center justify-center',
              'overflow-hidden',
              'rounded-2xl',
              'bg-white',
              'p-3 sm:p-5',
              config.frame ? 'border border-gray-200 shadow-sm' : '',
            ].join(' ')}
          >
            {/* 
              IMPORTANT:
              The preview container controls the visual size.
              The QR's actual export resolution can be 500, 1000,
              1500, or 2000px without overflowing this box.
            */}
            <div
              ref={qrRef}
              className={[
                'relative flex w-full min-w-0 items-center justify-center',
                radiusClass,
                'bg-white',
              ].join(' ')}
              style={{
                maxWidth: `${previewMaxSize}px`,
              }}
            >
              {/* Visible QR */}
              <div
                className={[
                  'flex w-full items-center justify-center',
                  'overflow-hidden',
                  radiusClass,
                ].join(' ')}
              >
                <QRCodeCanvas
                  ref={canvasRef}
                  value={String(value)}
                  size={exportSize}
                  bgColor={config.bgColor}
                  fgColor={config.fgColor}
                  level={config.errorLevel}
                  includeMargin={Boolean(config.includeMargin)}
                  marginSize={Number(config.marginSize)}
                  imageSettings={qrImageSettings}
                  style={{
                    display: 'block',
                    width: '100%',
                    height: 'auto',
                    maxWidth: '100%',
                    aspectRatio: '1 / 1',
                  }}
                />
              </div>

              {/* Hidden SVG used for export */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute h-0 w-0 overflow-hidden"
              >
                <QRCodeSVG
                  className="qr-svg-export"
                  value={String(value)}
                  size={exportSize}
                  bgColor={config.bgColor}
                  fgColor={config.fgColor}
                  level={config.errorLevel}
                  includeMargin={Boolean(config.includeMargin)}
                  marginSize={Number(config.marginSize)}
                  imageSettings={qrImageSettings}
                />
              </div>
            </div>
          </div>
        ) : (
          <div
            className={[
              'flex w-full max-w-[340px] aspect-square',
              'flex-col items-center justify-center',
              'rounded-2xl',
              'border-2 border-dashed border-gray-300',
              'bg-white',
              'text-gray-400',
            ].join(' ')}
          >
            <svg
              className="mb-3 h-12 w-12 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>

            <span className="text-sm font-medium">
              Configure data to preview
            </span>
          </div>
        )}

        {/* Export Resolution Info */}
        {value && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500">
            <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">
              Preview: responsive
            </span>

            <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">
              Export: {exportSize}px
            </span>

            {config.logo && (
              <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">
                Logo: {Math.round(logoSize * 100)}%
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        {value && showActions && (
          <div className="mt-5 flex w-full flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={downloadPNG}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Download PNG
            </button>

            <button
              type="button"
              onClick={downloadSVG}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Download SVG
            </button>

            <button
              type="button"
              onClick={copyImage}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Copy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}