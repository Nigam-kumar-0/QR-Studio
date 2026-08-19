import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import GenerateStudio from './pages/GenerateStudio';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      {/* Public Auth Routes (No layout wrapper) */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Main App Routes with Sidebar/Nav Layout */}
      <Route path="/" element={<AppLayout />}>
        {/* Publically accessible tool */}
        <Route index element={<GenerateStudio />} />
        
        {/* Protected Routes - require login */}
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}