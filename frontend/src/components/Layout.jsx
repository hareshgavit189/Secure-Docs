import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

/**
 * Main responsive app layout.
 * Desktop (>=1024px): Collapsible sidebar inline with main content.
 * Mobile (<1024px): Floating drawer sidebar with smooth backdrop overlay.
 */
export function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();

  // Initialize sidebar based on screen size on mount
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    handleResize();
  }, []);

  // Automatically close sidebar on mobile when navigating to a new page
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location]);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 relative">

      {/* Mobile Drawer Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Responsive Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Navbar onMenuToggle={() => setSidebarOpen(prev => !prev)} sidebarOpen={sidebarOpen} />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>

    </div>
  );
}

