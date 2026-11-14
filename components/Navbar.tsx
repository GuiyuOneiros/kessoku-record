import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';

// Custom SVG for Bocchi's Hair Cubes + Zip Tie
const ZipTieLogo = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="10" width="16" height="16" rx="3" fill="#00AEEC" className="transform -rotate-12 origin-center shadow-sm" />
    <rect x="16" y="12" width="16" height="16" rx="3" fill="#FB7299" className="transform rotate-6 origin-center shadow-sm" />
    <path d="M26 6L34 14" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
  </svg>
);

export const Navbar: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="transition-transform duration-300 group-hover:scale-110">
              <ZipTieLogo />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-wider text-gray-900 leading-none group-hover:text-bili-pink transition-colors font-display">
                BOCCHI THE RECORD
              </span>
              <span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase mt-0.5">
                孤独摇滚! 影像索引
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {!isHome && (
              <Link
                to="/"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>返回首页</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};