import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import { Tooltip } from 'react-tooltip';
import { toast } from 'react-toastify';

function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stats, setStats] = useState({
    totalReservations: 0,
    todayReservations: 0,
    availableRooms: 4,
    upcomingBookings: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/api/reservations`);
      const allReservations = response.data;
      setReservations(allReservations);
      
      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayReservations = allReservations.filter(r => r.date === today).length;
      const upcomingBookings = allReservations.filter(r => new Date(r.date) > new Date()).length;
      
      setStats({
        totalReservations: allReservations.length,
        todayReservations,
        availableRooms: 4 - todayReservations,
        upcomingBookings
      });
      
      setLastUpdated(new Date());
      setError(null);
    } catch (error) {
      console.error('Error fetching data:', error.stack);
      setError('Failed to load data. Please try again later.');
      toast.error('Failed to load latest data');
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const allRooms = ['1', '2', '3', '4'];

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const adjustedHours = hours % 12 || 12;
    return `${adjustedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getLibraryHours = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDay();
    if (day === 0) return { start: 0, end: 0 }; // Sunday - closed
    
    if (day === 6) {
      return { start: 2, end: 17 }; // Saturday: 2:00 AM - 5:00 PM
    } else {
      return { start: 8, end: 23 }; // Weekdays: 8:00 AM - 11:00 PM
    }
  };

  // Circular Clock Component - Updated to match reference image
  const CircularClock = ({ room, date }) => {
    const roomReservations = reservations.filter(r => 
      r.date === date && r.room === room
    );

    const libraryHours = getLibraryHours(date);
    const radius = 45;
    const center = 50;
    const strokeWidth = 8;

    // Convert 24-hour time to 12-hour format for angle calculation
    const timeToAngle = (hours, minutes) => {
      // Convert to 12-hour format for clock display
      const twelveHour = hours % 12 || 12;
      const totalMinutes = twelveHour * 60 + minutes;
      const totalDayMinutes = 12 * 60; // 12 hours in minutes
      return (totalMinutes / totalDayMinutes) * 360;
    };

    // Generate arc path for booked time slots
    const generateArc = (startTime, endTime) => {
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      
      const startAngle = timeToAngle(startHours, startMinutes);
      const endAngle = timeToAngle(endHours, endMinutes);
      
      // Convert angles to radians and adjust for SVG coordinate system
      const startRad = (startAngle - 90) * Math.PI / 180;
      const endRad = (endAngle - 90) * Math.PI / 180;
      
      const startX = center + radius * Math.cos(startRad);
      const startY = center + radius * Math.sin(startRad);
      const endX = center + radius * Math.cos(endRad);
      const endY = center + radius * Math.sin(endRad);
      
      const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
      
      return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
    };

    // Generate library hours arc (gray background)
    const generateLibraryHoursArc = () => {
      if (libraryHours.start === 0 && libraryHours.end === 0) return '';
      
      const startAngle = timeToAngle(libraryHours.start, 0);
      const endAngle = timeToAngle(libraryHours.end, 0);
      
      const startRad = (startAngle - 90) * Math.PI / 180;
      const endRad = (endAngle - 90) * Math.PI / 180;
      
      const startX = center + radius * Math.cos(startRad);
      const startY = center + radius * Math.sin(startRad);
      const endX = center + radius * Math.cos(endRad);
      const endY = center + radius * Math.sin(endRad);
      
      const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
      
      return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
    };

    // Generate clock markers exactly like reference image
    const generateClockMarkers = () => {
      const markers = [];
      const hourPositions = [
        { hour: 12, angle: 0 },
        { hour: 1, angle: 30 },
        { hour: 2, angle: 60 },
        { hour: 3, angle: 90 },
        { hour: 4, angle: 120 },
        { hour: 5, angle: 150 },
        { hour: 6, angle: 180 },
        { hour: 7, angle: 210 },
        { hour: 8, angle: 240 },
        { hour: 9, angle: 270 },
        { hour: 10, angle: 300 },
        { hour: 11, angle: 330 }
      ];

      // Generate hour markers and numbers
      hourPositions.forEach(({ hour, angle }) => {
        const rad = (angle - 90) * Math.PI / 180;
        
        // Hour markers (thicker lines)
        const innerX = center + (radius - 15) * Math.cos(rad);
        const innerY = center + (radius - 15) * Math.sin(rad);
        const outerX = center + (radius - 5) * Math.cos(rad);
        const outerY = center + (radius - 5) * Math.sin(rad);
        
        markers.push(
          <line
            key={`marker-${hour}`}
            x1={innerX}
            y1={innerY}
            x2={outerX}
            y2={outerY}
            stroke="#374151"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        );
        
        // Add hour numbers - positioned further out
        const labelX = center + (radius + 8) * Math.cos(rad);
        const labelY = center + (radius + 8) * Math.sin(rad);
        
        markers.push(
          <text
            key={`label-${hour}`}
            x={labelX}
            y={labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="font-bold fill-gray-800"
            style={{ 
              fontSize: '12px', 
              fontWeight: 'bold',
              fontFamily: 'Arial, sans-serif'
            }}
          >
            {hour}
          </text>
        );
      });

      // Generate smaller minute markers
      for (let minute = 0; minute < 60; minute += 5) {
        if (minute % 15 === 0) continue; // Skip quarters (already have hour markers)
        
        const angle = (minute / 60) * 360 - 90;
        const rad = angle * Math.PI / 180;
        
        const innerX = center + (radius - 10) * Math.cos(rad);
        const innerY = center + (radius - 10) * Math.sin(rad);
        const outerX = center + (radius - 6) * Math.cos(rad);
        const outerY = center + (radius - 6) * Math.sin(rad);
        
        markers.push(
          <line
            key={`minute-${minute}`}
            x1={innerX}
            y1={innerY}
            x2={outerX}
            y2={outerY}
            stroke="#6B7280"
            strokeWidth="1"
            strokeLinecap="round"
          />
        );
      }
      
      return markers;
    };

    const isClosed = libraryHours.start === 0 && libraryHours.end === 0;

    return (
      <div className="flex flex-col items-center space-y-3">
        <div className="relative">
          <svg width="140" height="140" viewBox="0 0 100 100" className="transform">
            {/* Background circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth={strokeWidth}
            />
            
            {/* Library hours arc */}
            {!isClosed && (
              <path
                d={generateLibraryHoursArc()}
                fill="none"
                stroke="#D1D5DB"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
            )}
            
            {/* Booked time slots */}
            {roomReservations.map((reservation, index) => (
              <path
                key={index}
                d={generateArc(reservation.timeStart, reservation.timeEnd)}
                fill="none"
                stroke="#EF4444"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                data-tooltip-id={`tooltip-${room}-${index}`}
                data-tooltip-content={`${formatTime(reservation.timeStart)} - ${formatTime(reservation.timeEnd)}`}
              />
            ))}
            
            {/* Clock markers */}
            {generateClockMarkers()}
            
            {/* Center dot */}
            <circle cx={center} cy={center} r="3" fill="#374151" />
            
            {/* Clock hands for current time (only for today) */}
            {date === todayStr && (
              <>
                {/* Hour hand */}
                <line
                  x1={center}
                  y1={center}
                  x2={center + (radius - 25) * Math.cos((((new Date().getHours() % 12) * 30 + new Date().getMinutes() * 0.5) - 90) * Math.PI / 180)}
                  y2={center + (radius - 25) * Math.sin((((new Date().getHours() % 12) * 30 + new Date().getMinutes() * 0.5) - 90) * Math.PI / 180)}
                  stroke="#374151"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {/* Minute hand */}
                <line
                  x1={center}
                  y1={center}
                  x2={center + (radius - 15) * Math.cos((new Date().getMinutes() * 6 - 90) * Math.PI / 180)}
                  y2={center + (radius - 15) * Math.sin((new Date().getMinutes() * 6 - 90) * Math.PI / 180)}
                  stroke="#374151"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Second hand */}
                <line
                  x1={center}
                  y1={center}
                  x2={center + (radius - 10) * Math.cos((new Date().getSeconds() * 6 - 90) * Math.PI / 180)}
                  y2={center + (radius - 10) * Math.sin((new Date().getSeconds() * 6 - 90) * Math.PI / 180)}
                  stroke="#DC2626"
                  strokeWidth="1"
                  strokeLinecap="round"
                />
              </>
            )}
          </svg>
          
          {/* Status indicator in center */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
              isClosed ? 'bg-gray-400' :
              roomReservations.length === 0 ? 'bg-green-500' : 
              roomReservations.length >= 3 ? 'bg-red-500' : 'bg-yellow-500'
            }`}>
              <span className="text-white text-xs font-bold">
                {roomReservations.length}
              </span>
            </div>
          </div>
        </div>
        
        {/* Tooltips for booked slots */}
        {roomReservations.map((reservation, index) => (
          <Tooltip key={index} id={`tooltip-${room}-${index}`} />
        ))}
        
        {/* Status text */}
        <div className="text-center">
          <div className="text-sm font-bold text-gray-900">
            {isClosed ? 'Closed' : roomReservations.length === 0 ? 'Available' : `${roomReservations.length} Booking${roomReservations.length !== 1 ? 's' : ''}`}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {!isClosed && (
              <>
                {libraryHours.start <= 12 ? 'AM' : 'PM'} Hours
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const QuickStats = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Reservations</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalReservations}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Available Today</p>
            <p className="text-2xl font-bold text-gray-900">{stats.availableRooms}/4</p>
          </div>
          <div className="p-3 bg-green-100 rounded-full">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-orange-500 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Today's Bookings</p>
            <p className="text-2xl font-bold text-gray-900">{stats.todayReservations}</p>
          </div>
          <div className="p-3 bg-orange-100 rounded-full">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Upcoming</p>
            <p className="text-2xl font-bold text-gray-900">{stats.upcomingBookings}</p>
          </div>
          <div className="p-3 bg-purple-100 rounded-full">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );

  const handleBookRoom = (room) => {
    navigate('/reserve', { state: { room, date: new Date(selectedDateStr) } });
  };

  const handleCheckAvailability = (room) => {
    navigate('/availability', { state: { room, date: new Date(selectedDateStr) } });
  };

  const handleRefresh = async () => {
    await fetchData();
    toast.success('Data refreshed successfully!');
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const isDateInPast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isSunday = (date) => {
    return date.getDay() === 0;
  };

  // Get room availability summary
  const roomAvailability = allRooms.map(room => {
    const roomReservations = reservations.filter(r => 
      r.date === selectedDateStr && r.room === room
    );

    const libraryHours = getLibraryHours(selectedDateStr);
    const isClosed = libraryHours.start === 0 && libraryHours.end === 0;

    return { 
      room, 
      reservations: roomReservations,
      isClosed,
      hasBookings: roomReservations.length > 0,
      availabilityStatus: isClosed ? 'closed' : roomReservations.length === 0 ? 'available' : 'partial'
    };
  });

  // External link tabs component
  const ExternalLinksTabs = () => (
    <section className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h3 className="text-xl font-bold text-gray-900 mb-4">MMC Library Resources</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="http://koha.mmclib.net/"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col items-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200 hover:border-blue-400 transition-all duration-300 hover:shadow-md"
        >
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 22V12h6v10" />
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2 text-center">Open OPAC</h4>
          <p className="text-sm text-gray-600 text-center mb-3">Online Public Access Catalog</p>
          <span className="text-blue-600 text-sm font-medium group-hover:text-blue-800 transition-colors">
            koha.mmclib.net →
          </span>
        </a>

        <a
          href="http://www.mmclib.net/"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col items-center p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200 hover:border-green-400 transition-all duration-300 hover:shadow-md"
        >
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2 text-center">MMC Library</h4>
          <p className="text-sm text-gray-600 text-center mb-3">Official Library Website</p>
          <span className="text-green-600 text-sm font-medium group-hover:text-green-800 transition-colors">
            www.mmclib.net →
          </span>
        </a>

        <a
          href="http://mmc-edu.net/"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col items-center p-6 bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl border border-purple-200 hover:border-purple-400 transition-all duration-300 hover:shadow-md"
        >
          <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2 text-center">MMC Website</h4>
          <p className="text-sm text-gray-600 text-center mb-3">Official College Website</p>
          <span className="text-purple-600 text-sm font-medium group-hover:text-purple-800 transition-colors">
            mmc-edu.net →
          </span>
        </a>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img src="/mmclogo.jpg" alt="MMC Logo" className="h-20 w-40 object-contain rounded-lg" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-800">MMC EUNPA Library</h1>
                <p className="text-xs text-gray-500">Study Room Reservation System</p>
              </div>
            </div>

            <nav className="hidden md:flex space-x-1 bg-white/50 rounded-xl p-1">
              {[
                { path: '/reserve', name: 'Reserve Room', icon: '📅' },
                { path: '/rooms', name: 'View Reservations', icon: '👥' },
                { path: '/availability', name: 'Check Availability', icon: '🔍' },
                { path: '/analytics', name: 'Analytics', icon: '📊' },
                { path: '/about', name: 'About', icon: 'ℹ️' }
              ].map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    location.pathname === item.path 
                      ? 'bg-blue-100 text-blue-700 shadow-sm' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            <button
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {isMenuOpen && (
            <nav className="mt-4 md:hidden bg-white rounded-lg shadow-lg p-4">
              <div className="flex flex-col space-y-2">
                {[
                  { path: '/reserve', name: 'Reserve Room', icon: '📅' },
                  { path: '/rooms', name: 'View Reservations', icon: '👥' },
                  { path: '/availability', name: 'Check Availability', icon: '🔍' },
                  { path: '/analytics', name: 'Analytics', icon: '📊' },
                  { path: '/about', name: 'About', icon: 'ℹ️' }
                ].map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      location.pathname === item.path 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Library Dashboard</h2>
              <p className="text-gray-600 mt-2">Manage and monitor study room reservations in real-time</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 border border-gray-200 transition-all disabled:opacity-50"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{loading ? 'Updating...' : 'Refresh'}</span>
              </button>
              <Link
                to="/reserve"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>New Booking</span>
              </Link>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleString()}
          </div>
        </section>

        <QuickStats />

        {/* New External Links Section */}
        <ExternalLinksTabs />

        {/* Enhanced Room Status Section with Circular Clocks */}
        <section className="bg-white rounded-xl shadow-lg p-6 mb-12">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <h3 className="text-xl font-bold text-gray-900">Room Booking Status</h3>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center space-x-4 bg-gray-50 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                  <span className="text-sm text-gray-600">Available</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                  <span className="text-sm text-gray-600">Booked</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-slate-400 rounded-full shadow-sm"></div>
                  <span className="text-sm text-gray-600">Library Hours</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg p-3">
                <label htmlFor="date-select" className="text-sm font-medium text-gray-700">
                  Select Date:
                </label>
                <DatePicker
                  selected={selectedDate}
                  onChange={handleDateChange}
                  dateFormat="MMMM d, yyyy"
                  minDate={today}
                  maxDate={new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)}
                  filterDate={(date) => date.getDay() !== 0}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  id="date-select"
                />
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Enhanced Date Information */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-lg font-semibold text-blue-900 mb-2">
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </h4>
            {isSunday(selectedDate) ? (
              <p className="text-blue-700 font-medium flex items-center space-x-2">
                <span>⚠️</span>
                <span>Library is closed on Sundays</span>
              </p>
            ) : isDateInPast(selectedDate) ? (
              <p className="text-blue-700 font-medium flex items-center space-x-2">
                <span>📅</span>
                <span>Viewing past date - bookings cannot be made</span>
              </p>
            ) : (
              <p className="text-blue-700 font-medium flex items-center space-x-2">
                <span>📚</span>
                <span>Library hours: {getLibraryHours(selectedDateStr).start <= 12 ? '8:00 AM' : '2:00 PM'} - {getLibraryHours(selectedDateStr).end <= 12 ? '5:00 PM' : '11:00 PM'}</span>
              </p>
            )}
          </div>

          {/* Enhanced Room Grid with Circular Clocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {allRooms.map((room) => {
              const roomInfo = roomAvailability.find(r => r.room === room);
              const isClosed = roomInfo?.isClosed;
              const hasBookings = roomInfo?.hasBookings;
              
              return (
                <div
                  key={room}
                  className={`rounded-xl p-6 shadow-lg transition-all duration-300 ${
                    isClosed
                      ? 'bg-gray-100 border-2 border-gray-300'
                      : hasBookings
                      ? 'bg-orange-50 border-2 border-orange-200'
                      : 'bg-green-50 border-2 border-green-200'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-4">
                    {/* Room Header */}
                    <div className="text-center">
                      <h4 className="text-lg font-bold text-gray-900 mb-1">
                        Study Room {room}
                      </h4>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        isClosed
                          ? 'bg-gray-200 text-gray-700'
                          : hasBookings
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {isClosed ? 'Closed' : hasBookings ? 'Partially Booked' : 'Fully Available'}
                      </div>
                    </div>

                    {/* Circular Clock */}
                    <CircularClock room={room} date={selectedDateStr} />

                    {/* Action Buttons */}
                    <div className="flex space-x-2 w-full">
                      <button
                        onClick={() => handleCheckAvailability(room)}
                        className="flex-1 px-3 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        Check
                      </button>
                      <button
                        onClick={() => handleBookRoom(room)}
                        disabled={isClosed || isDateInPast(selectedDate)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isClosed || isDateInPast(selectedDate)
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="bg-white/80 backdrop-blur-md border-t border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <img src="/mmclogo.jpg" alt="MMC Logo" className="h-8 w-8 object-contain rounded" />
              <span className="text-sm text-gray-600">© 2025 MMC EUNPA Library. All rights reserved.</span>
              <span className="text-sm text-gray-600">Developed By Gebremeskel Shimels.</span>

            </div>
            <div className="flex space-x-6">
              <a href="http://koha.mmclib.net/" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                Open OPAC
              </a>
              <a href="http://www.mmclib.net/" className="text-sm text-gray-600 hover:text-green-600 transition-colors">
                MMC Library
              </a>
              <a href="http://mmc-edu.net/" className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
                MMC Website
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;