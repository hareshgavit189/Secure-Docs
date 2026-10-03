import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

/**
 * Main app layout.
 * Sidebar is open by default and can be toggled via the hamburger (☰) button
 * in the Navbar on ALL screen sizes.
 */
export function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 overflow-hidden">

      {/* Sidebar — slides in/out via width transition */}
      <Sidebar isOpen={sidebarOpen} />

      {/* Main content — grows to fill remaining space */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuToggle={() => setSidebarOpen(prev => !prev)} sidebarOpen={sidebarOpen} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto animate-fadeIn">
          {children}
        </main>
      </div>

    </div>
  );
}
