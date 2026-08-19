import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <TopNav toggleSidebar={toggleSidebar} />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto focus:outline-none">
          <div className="px-4 py-6 sm:px-6 md:py-8 lg:px-8 max-w-7xl mx-auto">
            {/* The Outlet injects the page components here based on the URL */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}