import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

function About() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header - Exact copy from Home.jsx */}
      <header className="sticky top-0 z-50 bg-blue-50 shadow-sm border-b border-blue-100">
        <div className="container mx-auto px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-row items-center space-x-2">
              <div className="relative">
                <img
                  src="/mmclogo.jpg"
                  alt="MMC Logo"
                  className="h-12 w-30 object-contain rounded shadow-sm"
                  tabIndex={0}
                  aria-label="MMC EUNPA Library Logo"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-1.5 border-white shadow-sm animate-pulse" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-blue-900 tracking-tight font-serif">MMC EUNPA Library</h1>
                <p className="text-[10px] text-blue-700 font-medium">Study Room Reservation System</p>
              </div>
            </div>

            <nav className="hidden md:flex space-x-1 bg-blue-100 rounded p-1" aria-label="Main navigation">
              {[
                { path: '/reserve', name: 'Reserve', icon: '📅' },
                { path: '/rooms', name: 'Reservations', icon: '👥' },
                { path: '/availability', name: 'Availability', icon: '🔍' },
                { path: '/report', name: 'Generate Report', icon: '📋' },
                { path: '/analytics', name: 'Analytics', icon: '📊' },
                { path: '/about', name: 'About', icon: 'ℹ️' },
              ].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center space-x-1 px-2 py-1.5 rounded text-xs font-semibold transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-blue-800 hover:bg-blue-200 hover:text-blue-900'
                  }`}
                  aria-current={location.pathname === item.path ? 'page' : undefined}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            <button
              className="md:hidden p-1 rounded text-blue-800 hover:bg-blue-200 transition-colors duration-200"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle mobile menu"
              aria-expanded={isMenuOpen}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {isMenuOpen && (
            <nav
              className="mt-1 md:hidden bg-blue-100 rounded shadow-sm p-2 transition-all duration-200"
              aria-label="Mobile navigation"
            >
              <div className="flex flex-col space-y-1">
                {[
                  { path: '/reserve', name: 'Reserve', icon: '📅' },
                  { path: '/rooms', name: 'Reservations', icon: '👥' },
                  { path: '/availability', name: 'Availability', icon: '🔍' },
                  { path: '/report', name: 'Generate Report', icon: '📋' },
                  { path: '/analytics', name: 'Analytics', icon: '📊' },
                  { path: '/about', name: 'About', icon: 'ℹ️' },
                ].map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-1 px-2.5 py-1.5 rounded text-xs font-semibold transition-all duration-200 ${
                      location.pathname === item.path
                        ? 'bg-blue-600 text-white'
                        : 'text-blue-800 hover:bg-blue-200 hover:text-blue-900'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                    aria-current={location.pathname === item.path ? 'page' : undefined}
                  >
                    <span className="text-sm">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </div>
      </header>

      <main className="container mx-auto px-3 py-4">
        <section className="mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">About MMC EUNPA Library</h2>
              <p className="text-xs text-gray-600 mt-1">Providing exceptional study facilities for academic excellence</p>
            </div>
            <div className="flex space-x-2">
              <Link
                to="/reserve"
                className="flex items-center space-x-1 px-2 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm transition-all duration-200 text-xs"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Book a Room</span>
              </Link>
            </div>
          </div>
        </section>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="prose prose-lg max-w-none">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Our Library</h2>
              <p className="text-gray-600 mb-6">
                Welcome to the MMC EUNPA Library Study Room Reservation System. Our library is dedicated to 
                providing state-of-the-art study facilities for students, faculty members, and academic staff. 
                We understand the importance of collaborative learning and provide comfortable, well-equipped 
                spaces for group studies and academic discussions.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-gray-600 mb-4">
                To support academic excellence by providing accessible, technology-enhanced study environments 
                that foster collaboration, innovation, and learning.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Facilities</h2>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-900 mb-3">Study Rooms</h3>
                  <ul className="space-y-2 text-blue-700">
                    <li>• 4 modern study rooms</li>
                    <li>• Digital displays and projectors</li>
                    <li>• High-speed internet access</li>
                    <li>• Comfortable seating arrangements</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="font-semibold text-green-900 mb-3">Amenities</h3>
                  <ul className="space-y-2 text-green-700">
                    <li>• Whiteboards and markers</li>
                    <li>• Power outlets at each seat</li>
                    <li>• Climate-controlled environment</li>
                    <li>• Wheelchair accessible</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Reservation System</h2>
              <p className="text-gray-600 mb-4">
                Our online reservation system makes it easy to book study rooms for your group activities. 
                The system provides:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Real-time room availability checking</li>
                <li>Instant booking confirmation</li>
                <li>Flexible time slot selection</li>
                <li>Automated conflict prevention</li>
                <li>Mobile-friendly interface</li>
              </ul>
            </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
                    <p className="text-gray-600">Bole Kifle Ketema, Kebele 11, Addis Ababa , Ethiopia</p>
                    <p className="text-gray-600">Myungsung Medical Collge(MMC)/Korean Hospital(MCM)</p>
                    
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Library Hours</h3>
                    <p className="text-gray-600">
                      <strong>Monday - Friday:</strong> 8:00 AM – 11:00 PM<br />
                      <strong>Saturday:</strong> 8:00 AM – 5:00 PM<br />
                      <strong>Sunday:</strong> Closed
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Contact</h3>
                    <p className="text-gray-600">
                      <strong>📞</strong>  +251-116-39-40-26/53 <br />
                      <strong>Email:</strong> library@edu.net<br />
                      <strong>P. O. Box :</strong> 14972 <br />
                      <strong>Circulation Desk:</strong> Ground at EUNPA Library next to the main entrance.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Staff</h3>
                    <p className="text-gray-600">
                      <strong>Head Librarian:</strong> Mrs. Tirsit Wuhib<br />
                      <strong>Multi-Media Librarian:</strong> Mr. Abera Eyenew<br />
                      <strong>Librarian:</strong> Mr. Yoseph Begna<br />
                      <strong>Assistant Librarian:</strong> Mr. Gebremeeskel Shimels<br />
                      <strong>IT Support:</strong> gebremeskelshimels@gmail.com<br />
                      <strong><a href=' www.mmclib.net'>Website:</a></strong> <a href=' www.mmclib.net'>www.mmclib.net</a>
                    </p>
                  </div>
                </div>
              </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Assistance?</h2>
              <p className="text-gray-600 mb-6">
                Our library staff is always ready to help you with reservations, technical issues, 
                or any questions about our facilities. Visit the Circulation Desk or contact us 
                during library hours.
              </p>
              <Link
                to="/reserve"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Book a Study Room Now
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Exact copy from Home.jsx */}
      <footer className="bg-blue-50 border-t border-blue-100 py-3">
        <div className="container mx-auto px-3">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <div className="flex items-center space-x-2">
              <img src="/mmclogo.jpg" alt="MMC Logo" className="h-5 w-5 object-contain rounded" />
              <span className="text-xs text-gray-600">© 2025 MMC EUNPA Library. All rights reserved.</span>
              <span className="text-xs text-green-600">Developed by Gebremeskel Shimels.</span>
            </div>
            <div className="flex space-x-3">
              {[
                { href: 'http://koha.mmclib.net/', name: 'Open OPAC', color: 'blue' },
                { href: 'http://www.mmclib.net/', name: 'MMC Library', color: 'green' },
                { href: 'http://mmc-edu.net/', name: 'MMC Website', color: 'purple' },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`text-xs text-gray-600 hover:text-${link.color}-600 transition-colors duration-200`}
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default About;
