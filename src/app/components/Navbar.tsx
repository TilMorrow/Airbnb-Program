'use client'

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700">
      <div className="max-w-screen-xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img 
              src="favicon.ico" 
              className="h-8" 
              alt="Airbnb Logo" 
            />
            <span className="text-2xl font-semibold text-gray-900 dark:text-white">
              Airbnb
            </span>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg 
                  className="w-4 h-4 text-gray-500 dark:text-gray-400" 
                  aria-hidden="true" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 20 20"
                >
                  <path 
                    stroke="currentColor" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                  />
                </svg>
              </div>
              <input 
                type="text" 
                className="w-full pl-10 pr-4 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500" 
                placeholder="Search..." 
              />
            </div>
          </div>

          {/* Navigation Menu - Desktop */}
          <ul className="hidden md:flex space-x-8">
            <li>
              <a 
                href="#" 
                className="text-blue-700 font-medium dark:text-blue-500"
              >
                Homes
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className="text-gray-900 hover:text-blue-700 dark:text-gray-300 dark:hover:text-blue-500 transition"
              >
                Experiences
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className="text-gray-900 hover:text-blue-700 dark:text-gray-300 dark:hover:text-blue-500 transition"
              >
                Services
              </a>
            </li>
          </ul>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
            aria-label="Toggle menu"
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

        </div>

        {/* Mobile Search - Mobile Only */}
        <div className="md:hidden mt-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg 
                className="w-4 h-4 text-gray-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input 
              type="text" 
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="Search..." 
            />
          </div>
        </div>

      </div>
    </nav>
  );
}