import { QRCodeCanvas } from 'qrcode.react';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function QRCodeCard({
  qr,
  onDelete,
  onDownload,
}) {
  const canvasId = `qr-canvas-${qr.id}`;

  return (
    <Card className="flex h-full min-w-0 flex-col overflow-hidden transition-shadow hover:shadow-md">
      {/* QR Code Display Area */}
      <div className="flex min-w-0 items-center justify-center border-b border-gray-100 bg-gray-50 p-6">
        <div className="flex w-full max-w-[220px] min-w-0 items-center justify-center rounded-xl bg-white p-4 shadow-sm">
          <QRCodeCanvas
            id={canvasId}
            value={String(qr.qrData || '')}
            size={300}
            level="M"
            includeMargin={true}
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              maxWidth: '100%',
            }}
          />
        </div>
      </div>

      {/* Details and Actions */}
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="mb-4 min-w-0 flex-1">
          <h3
            className="truncate font-semibold text-gray-900"
            title={qr.title}
          >
            {qr.title || 'Untitled QR'}
          </h3>

          <p
            className="mt-1 truncate text-sm text-gray-500"
            title={qr.qrData}
          >
            {qr.qrData}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1 py-1.5 text-xs"
            onClick={() =>
              onDownload(canvasId, qr.title)
            }
          >
            Download
          </Button>

          <Button
            variant="danger"
            className="px-3 py-1.5 text-xs"
            onClick={() => onDelete(qr.id)}
          >
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}