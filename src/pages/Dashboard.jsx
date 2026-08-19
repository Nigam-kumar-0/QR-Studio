import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQRCodes } from '../hooks/useQRCodes';
import { downloadCanvasAsPNG } from '../utils/downloadHelpers';

import QRCodeCard from '../components/qr/QRCodeCard';
import Button from '../components/ui/Button';

export default function Dashboard() {
  const { user } = useAuth();
  const { qrCodes, loading, error, deleteQRCode } = useQRCodes(user?.uid);

  const handleDownload = (canvasId, title) => {
    downloadCanvasAsPNG(canvasId, title || 'My_QRCode');
  };

  const handleDelete = async (docId) => {
    if (window.confirm('Are you sure you want to delete this QR code?')) {
      try {
        await deleteQRCode(docId);
      } catch (err) {
        console.error("Failed to delete", err);
        alert("Could not delete the QR code. Please try again.");
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Collection</h1>
          <p className="mt-2 text-gray-600">Manage and download your saved QR codes.</p>
        </div>
        <Link to="/">
          <Button>Create New QR</Button>
        </Link>
      </div>

      {/* State: Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-200 rounded-full border-t-blue-600 animate-spin"></div>
        </div>
      )}

      {/* State: Error */}
      {error && !loading && (
        <div className="p-4 mb-6 text-red-700 bg-red-50 rounded-lg">
          <h3 className="font-medium">Error loading collection</h3>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* State: Empty */}
      {!loading && !error && qrCodes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-gray-200 border-dashed rounded-xl">
          <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mb-1 text-lg font-medium text-gray-900">No QR codes yet</h3>
          <p className="mb-4 text-gray-500">Get started by creating your first QR code.</p>
          <Link to="/">
            <Button variant="secondary">Go to Studio</Button>
          </Link>
        </div>
      )}

      {/* State: Data Grid */}
      {!loading && !error && qrCodes.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {qrCodes.map((qr) => (
            <QRCodeCard 
              key={qr.id} 
              qr={qr} 
              onDelete={handleDelete}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}
    </div>
  );
}