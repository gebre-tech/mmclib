import React from 'react';
import { Link } from 'react-router-dom';

function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/mmclogo.jpg" alt="MMC Logo" className="h-8 w-auto object-contain" />
              <h1 className="text-lg font-bold text-blue-800">About UNPA Library</h1>
            </Link>
            <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium">← Back to Home</Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">About MMC EUNPA Library</h1>
              <p className="text-xl text-gray-600">Providing exceptional study facilities for academic excellence</p>
            </div>
            
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
                      <strong>Circulation Desk:</strong> Ground Floor at EUNPA Library next to the main entrance.
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
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">MMC EUNPA Library &copy; {new Date().getFullYear()}</p>
          <div className="mt-2 flex justify-center space-x-4 text-sm">
            <Link to="/about" className="text-gray-400 hover:text-white">About</Link>
            <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white">Terms of Use</a>
            <a href="#" className="text-gray-400 hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default About;
