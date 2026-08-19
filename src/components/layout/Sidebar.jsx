import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user } = useAuth();

  // Everyone can see the public tools
  const publicNavItems = [
    { name: 'Generate QR', path: '/' },
  ];

  // Only authenticated users can see these
  const privateNavItems = [
    { name: 'My Collection', path: '/dashboard' },
    { name: 'Profile', path: '/profile' },
  ];

  // Dynamically build the menu
  const navItems = user 
    ? [...publicNavItems, ...privateNavItems]
    : publicNavItems;

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 transition-opacity bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          <span className="text-xl font-bold text-gray-800">QR Studio</span>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}