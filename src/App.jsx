import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { initSeedData } from './services/storageService';

// Layout & Navigation Components
import BottomNav from './components/BottomNav';
import TopBar from './components/TopBar';
import QRScannerModal from './components/QRScannerModal';

// Pages
import HomePage from './pages/HomePage';
import LibraryPage from './pages/LibraryPage';
import HistoryPage from './pages/HistoryPage';
import ScannerPage from './pages/ScannerPage';
import TemplatesPage from './pages/TemplatesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DynamicRedirect from './pages/DynamicRedirect';

// Route Guard: Ensures only authenticated users can access protected views
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="w-9 h-9 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Route Guard: Redirects logged-in users away from /login and /signup
function PublicAuthRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="w-9 h-9 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // QR Scanner Modal State
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    initSeedData();
  }, []);

  const handleUseScannedData = (scannedObj) => {
    setScannerOpen(false);
    navigate('/');
  };

  // If this is a standalone dynamic redirect route, render it directly
  if (location.pathname.startsWith('/r/')) {
    return (
      <Routes>
        <Route path="/r/:shortCode" element={<DynamicRedirect />} />
      </Routes>
    );
  }

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <div className="flex flex-col min-h-screen w-full theme-bg-page text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* Top Navigation Bar: Retains compact header on phone, full top nav on larger screens (replaces sidebar) */}
      <TopBar />

      {/* Dynamic Route Content */}
      <main className="flex-1 w-full pb-20 md:pb-8">
        <Routes>
          {/* Primary Unified Dashboard & QR Creator */}
          <Route 
            path="/" 
            element={
              <HomePage 
                onOpenScanner={() => navigate('/scanner')} 
              />
            } 
          />

          {/* Redirects to primary Home creator */}
          <Route 
            path="/create" 
            element={<Navigate to="/" replace />} 
          />
          <Route 
            path="/dashboard" 
            element={<Navigate to="/" replace />} 
          />

          {/* Dedicated QR Code Scanner Page */}
          <Route 
            path="/scanner" 
            element={<ScannerPage />} 
          />

          {/* Ready-to-Use QR Templates Page */}
          <Route 
            path="/templates" 
            element={<TemplatesPage />} 
          />

          {/* User QR Library — Authentication Required */}
          <Route 
            path="/library" 
            element={
              <ProtectedRoute>
                <LibraryPage 
                  onNavigateCreate={() => navigate('/')} 
                  onEditQR={(qr) => navigate('/', { state: { editQR: qr } })}
                />
              </ProtectedRoute>
            } 
          />

          {/* Dedicated Analytics Dashboard — Authentication Required */}
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            } 
          />

          {/* Scan History — Authentication Required */}
          <Route 
            path="/history" 
            element={
              <ProtectedRoute>
                <HistoryPage 
                  onOpenScanner={() => navigate('/scanner')}
                  onUseScannedData={handleUseScannedData}
                />
              </ProtectedRoute>
            } 
          />

          {/* User Profile — Authentication Required */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />

          {/* Silent redirect for legacy /admin */}
          <Route 
            path="/admin" 
            element={<Navigate to="/" replace />} 
          />

          <Route 
            path="/settings" 
            element={<Navigate to="/profile" replace />} 
          />

          {/* Dedicated Login Route — Redirects to / if already logged in */}
          <Route 
            path="/login" 
            element={
              <PublicAuthRoute>
                <LoginPage />
              </PublicAuthRoute>
            } 
          />

          {/* Dedicated Signup Route — Redirects to / if already logged in */}
          <Route 
            path="/signup" 
            element={
              <PublicAuthRoute>
                <SignupPage />
              </PublicAuthRoute>
            } 
          />

          {/* Catch-all redirect */}
          <Route 
            path="*" 
            element={<Navigate to="/" replace />} 
          />
        </Routes>
      </main>

      {/* Mobile Fixed Bottom Navigation — active on phones & small screens (except auth pages) */}
      {!isAuthPage && (
        <BottomNav />
      )}

      {/* Global QR Scanner Modal */}
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onUseScannedData={handleUseScannedData}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
