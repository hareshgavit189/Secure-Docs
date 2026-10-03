import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

/**
 * Main app layout:
 * - Desktop (>=1024px): Collapsible left sidebar toggled by ☰ hamburger button.
 * - Mobile (<1024px): Sliding drawer sidebar with backdrop toggled by ☰ button.
 */
export function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [location] = useLocation();

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location]);

  const handleMenuToggle = () => {
    if (window.innerWidth >= 1024) {
      setSidebarOpen((prev) => !prev);
    } else {
      setMobileDrawerOpen((prev) => !prev);
    }
  };

  const isCurrentOpen =
    typeof window !== 'undefined' && window.innerWidth >= 1024
      ? sidebarOpen
      : mobileDrawerOpen;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">

      {/* Mobile Drawer Backdrop Overlay */}
      {mobileDrawerOpen && (
        <div
          onClick={() => setMobileDrawerOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Responsive Sidebar (Collapsible on Desktop, Drawer on Mobile) */}
      <Sidebar
        isDesktopOpen={sidebarOpen}
        isMobileOpen={mobileDrawerOpen}
        onCloseMobile={() => setMobileDrawerOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        <Navbar
          onMenuToggle={handleMenuToggle}
          sidebarOpen={isCurrentOpen}
        />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>

    </div>
  );
}

