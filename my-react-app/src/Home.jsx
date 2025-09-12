import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = [
    { path: '/reserve', label: 'Reserve Room' },
    { path: '/rooms', label: 'View Reservations' }, // Updated to link to /rooms
    { path: '/', label: 'Reservation Rules' },
  ];
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [freeRooms, setFreeRooms] = useState([]);
  const [userNameId, setUserNameId] = useState(''); // Simulate user identification (e.g., from local storage)
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5173';

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/reservations`);
        setReservations(response.data);
      } catch (error) {
        console.error('Error fetching reservations:', error);
      }
    };
    fetchReservations();
    // Simulate user identification (replace with actual auth logic)
    const storedNameId = localStorage.getItem('userNameId') || 'RD102312'; // Example user ID
    setUserNameId(storedNameId);
  }, [apiUrl]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]; // 4:47 PM EAT, Sep 12, 2025
    const allRooms = ['1', '2', '3', '4'];
    const reservedRooms = new Set();

    reservations.forEach((r) => {
      if (r.date === today) {
        reservedRooms.add(r.room);
      }
    });

    const free = allRooms.filter((room) => !reservedRooms.has(room));
    setFreeRooms(free);
  }, [reservations]);

  const handleBookRoom = (room) => {
    navigate('/reserve', { state: { room } });
  };

  // Function to get available time slots for a room
  const getAvailableTimes = (room) => {
    const today = new Date().toISOString().split('T')[0];
    const roomReservations = reservations.filter((r) => r.date === today && r.room === room);
    const allTimes = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
    const bookedTimes = roomReservations.flatMap((r) => {
      const start = parseInt(r.timeStart.split(':')[0]);
      const end = parseInt(r.timeEnd.split(':')[0]);
      return Array.from({ length: end - start }, (_, i) => `${String(start + i).padStart(2, '0')}:00`);
    });
    return allTimes.filter((time) => !bookedTimes.includes(time));
  };

  return (
    <div className="min-h-screen flex flex-col justify-start p-4 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="absolute inset-0 bg-[url('/path/to/mmc-logo.png')] bg-cover bg-center blur-sm opacity-15" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}></div>
      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <nav className="bg-white/80 backdrop-blur-md rounded-lg shadow-lg p-2 mb-2 sticky top-4 flex justify-end z-30">
          <button className="md:hidden text-gray-700 p-1 focus:outline-none" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
          <ul className={`md:flex md:flex-row md:space-x-2 ${isMenuOpen ? 'block' : 'hidden'} md:block absolute md:static top-10 right-2 bg-white/90 backdrop-blur-md p-2 rounded-lg shadow-md md:shadow-none`}>
            {navItems.map((item) => (
              <li key={item.path} className="my-1 md:my-0">
                <Link
                  to={item.path}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${location.pathname === item.path ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'text-gray-700 hover:text-blue-600'}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {/* Enhanced Horizontal Tabs with Reduced Spacing */}
        <div className="flex justify-center mb-4 space-x-2">
          <Link
            to="/reserve"
            className="bg-white text-blue-600 border-2 border-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 hover:shadow-lg transition-all duration-300"
          >
            Book a Room
          </Link>
          <Link
            to="/rooms"
            className="bg-white text-gray-700 border-2 border-gray-300 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 hover:shadow-lg transition-all duration-300"
          >
            View Reservations
          </Link>
          <button
            onClick={() => {
              const el = document.getElementById('rules');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-white text-gray-700 border-2 border-gray-300 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 hover:shadow-lg transition-all duration-300"
          >
            Reservation Rules
          </button>
        </div>
        <div className="text-center py-8 px-4 animate-fadeIn">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Welcome to MMC Library
          </h1>
          <p className="text-lg text-gray-700 mb-4 max-w-xl mx-auto">
            Seamlessly reserve group study rooms and elevate your learning journey.
          </p>
        </div>
        {/* Centered Available Rooms Today Section */}
        <div className="flex justify-center">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-4 animate-fadeIn w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Available Rooms Today</h2>
            {freeRooms.length > 0 ? (
              <ul className="space-y-2">
                {freeRooms.map((room) => (
                  <li key={room} className="flex items-center space-x-1 text-lg text-gray-700">
                    <div className="flex items-center space-x-1">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 7a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                      <span>Room {room} - <span className="text-green-600 font-semibold">Available</span></span>
                    </div>
                    <button
                      onClick={() => handleBookRoom(room)}
                      className="bg-blue-600 text-white px-1 py-1 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    >
                      Book Room
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-2">No rooms available today.</p>
            )}
          </div>
        </div>
        {/* View Reservations Section (Displayed when /rooms is active) */}
        {location.pathname === '/rooms' && (
          <div className="flex justify-center mt-8">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Reservations Today</h2>
              {reservations.length > 0 ? (
                <div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Booked Rooms</h3>
                  <ul className="space-y-2">
                    {reservations
                      .filter((r) => r.date === new Date().toISOString().split('T')[0])
                      .map((r) => (
                        <li key={r.no} className="flex items-center justify-between text-lg text-gray-700">
                          <span>
                            Room {r.room} - {r.nameId} ({r.timeStart} to {r.timeEnd})
                          </span>
                          {r.nameId === userNameId && getAvailableTimes(r.room).length > 0 && (
                            <button
                              onClick={() => handleBookRoom(r.room)}
                              className="bg-blue-600 text-white px-2 py-1 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                            >
                              Re-Book
                            </button>
                          )}
                        </li>
                      ))}
                  </ul>
                  <h3 className="text-xl font-semibold text-gray-700 mt-4 mb-2">Available Times for Booked Rooms</h3>
                  <ul className="space-y-2">
                    {reservations
                      .filter((r) => r.date === new Date().toISOString().split('T')[0])
                      .map((r) => (
                        <li key={r.no} className="text-lg text-gray-700">
                          Room {r.room}: {getAvailableTimes(r.room).join(', ') || 'No available times'}
                        </li>
                      ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-2">No reservations today.</p>
              )}
            </div>
          </div>
        )}
        {/* Reservation Rules Section */}
        <div id="rules" className="flex justify-center mt-8">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Reservation Rules</h2>
            <ul className="space-y-3 text-gray-600 list-disc list-inside" style={{ lineHeight: '1.8' }}>
              <li>Reserve at Circulation Desk after submission.</li>
              <li>Maximum 2 hours per slot; extend if no conflict.</li>
              <li>For 2+ persons; advance booking (1+ day) required.</li>
              <li>Keep the room clean and tidy.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;