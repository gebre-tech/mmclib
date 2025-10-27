import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import { Tooltip } from 'react-tooltip';
import { toast } from 'react-toastify';
import Report from './Report';

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
    upcomingBookings: 0,
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

      const today = new Date().toISOString().split('T')[0];
      const todayReservations = allReservations.filter((r) => r.date === today).length;
      const upcomingBookings = allReservations.filter((r) => new Date(r.date) > new Date()).length;

      setStats({
        totalReservations: allReservations.length,
        todayReservations,
        availableRooms: 4 - todayReservations,
        upcomingBookings,
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
    if (day === 6) return { start: 2, end: 17 }; // Saturday: 2:00 AM - 5:00 PM
    return { start: 8, end: 23 }; // Weekdays: 8:00 AM - 11:00 PM
  };

  const CircularClock = ({ room, date }) => {
    const roomReservations = reservations.filter((r) => r.date === date && r.room === room);
    const libraryHours = getLibraryHours(date);
    const radius = 60;
    const center = 70;
    const strokeWidth = 10;

    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }, []);

    const timeToAngle = (hours, minutes) => {
      const twelveHour = hours % 12 || 12;
      const totalMinutes = twelveHour * 60 + minutes;
      const totalDayMinutes = 12 * 60;
      return (totalMinutes / totalDayMinutes) * 360;
    };

    const generateArc = (startTime, endTime) => {
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      const startAngle = timeToAngle(startHours, startMinutes);
      const endAngle = timeToAngle(endHours, endMinutes);
      const startRad = (startAngle - 90) * Math.PI / 180;
      const endRad = (endAngle - 90) * Math.PI / 180;
      const startX = center + radius * Math.cos(startRad);
      const startY = center + radius * Math.sin(startRad);
      const endX = center + radius * Math.cos(endRad);
      const endY = center + radius * Math.sin(endRad);
      const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
      return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
    };

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
        { hour: 11, angle: 330 },
      ];

      hourPositions.forEach(({ hour, angle }) => {
        const rad = (angle - 90) * Math.PI / 180;
        const innerX = center + (radius - 20) * Math.cos(rad);
        const innerY = center + (radius - 20) * Math.sin(rad);
        const outerX = center + (radius - 8) * Math.cos(rad);
        const outerY = center + (radius - 8) * Math.sin(rad);
        markers.push(
          <line
            key={`marker-${hour}`}
            x1={innerX}
            y1={innerY}
            x2={outerX}
            y2={outerY}
            stroke="#374151"
            strokeWidth="3"
            strokeLinecap="round"
          />
        );
        const labelX = center + (radius + 12) * Math.cos(rad);
        const labelY = center + (radius + 12) * Math.sin(rad);
        markers.push(
          <text
            key={`label-${hour}`}
            x={labelX}
            y={labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="font-semibold fill-gray-900"
            style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif' }}
          >
            {hour}
          </text>
        );
      });

      for (let minute = 0; minute < 60; minute += 5) {
        if (minute % 15 === 0) continue;
        const angle = (minute / 60) * 360 - 90;
        const rad = angle * Math.PI / 180;
        const innerX = center + (radius - 15) * Math.cos(rad);
        const innerY = center + (radius - 15) * Math.sin(rad);
        const outerX = center + (radius - 8) * Math.cos(rad);
        const outerY = center + (radius - 8) * Math.sin(rad);
        markers.push(
          <line
            key={`minute-${minute}`}
            x1={innerX}
            y1={innerY}
            x2={outerX}
            y2={outerY}
            stroke="#6B7280"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        );
      }
      return markers;
    };

    const isClosed = libraryHours.start === 0 && libraryHours.end === 0;

    return (
      <div className="flex flex-col items-center space-y-3 p-3">
        <div className="relative">
          <svg width="150" height="150" viewBox="0 0 140 140" className="transform scale-100">
            {/* Background logo */}
            <image
              href="/mmclogo.jpg"
              x={center - 30} // Center the logo horizontally
              y={center - 30} // Center the logo vertically
              width="65" // Size to fit within the clock without overlapping hands
              height="115"
              preserveAspectRatio="xMidYMid meet"
              opacity="2" // Slight transparency to avoid visual clutter
              aria-label="MMC Logo"
            />
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={strokeWidth} />
            {!isClosed && (
              <path
                d={generateLibraryHoursArc()}
                fill="none"
                stroke="#D1D5DB"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
            )}
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
            {generateClockMarkers()}
            <circle cx={center} cy={center} r="3.5" fill="#374151" />
            {date === todayStr && (
              <>
                <line
                  x1={center}
                  y1={center}
                  x2={center + (radius - 30) * Math.cos((((currentTime.getHours() % 12) * 30 + currentTime.getMinutes() * 0.5) - 90) * Math.PI / 180)}
                  y2={center + (radius - 30) * Math.sin((((currentTime.getHours() % 12) * 30 + currentTime.getMinutes() * 0.5) - 90) * Math.PI / 180)}
                  stroke="#374151"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <line
                  x1={center}
                  y1={center}
                  x2={center + (radius - 20) * Math.cos((currentTime.getMinutes() * 6 - 90) * Math.PI / 180)}
                  y2={center + (radius - 20) * Math.sin((currentTime.getMinutes() * 6 - 90) * Math.PI / 180)}
                  stroke="#374151"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
                <line
                  x1={center}
                  y1={center}
                  x2={center + (radius - 14) * Math.cos((currentTime.getSeconds() * 6 - 90) * Math.PI / 180)}
                  y2={center + (radius - 14) * Math.sin((currentTime.getSeconds() * 6 - 90) * Math.PI / 180)}
                  stroke="#DC2626"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </>
            )}
          </svg>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shadow-sm ${
                isClosed ? 'bg-gray-500' : roomReservations.length === 0 ? 'bg-green-500' : roomReservations.length >= 3 ? 'bg-red-500' : 'bg-yellow-500'
              }`}
            >
              <span className="text-white text-xs font-bold">{roomReservations.length}</span>
            </div>
          </div>
        </div>
        {roomReservations.map((reservation, index) => (
          <Tooltip key={index} id={`tooltip-${room}-${index}`} />
        ))}
        <div className="text-center space-y-1">
          <div className="text-sm font-bold text-gray-900">
            Study Room {room}
          </div>
          <div className="text-xs font-semibold text-gray-700">
            {isClosed ? 'Closed' : roomReservations.length === 0 ? 'Available' : `${roomReservations.length} Booking${roomReservations.length !== 1 ? 's' : ''}`}
          </div>
          <div className="text-xs text-gray-600">
            {!isClosed && (
              <>
                {libraryHours.start <= 12 ? '8:00 AM' : '2:00 PM'} - {libraryHours.end <= 12 ? '5:00 PM' : '11:00 PM'}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const QuickStats = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {[
        { title: 'Total Reservations', value: stats.totalReservations, color: 'blue', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
        { title: 'Available Today', value: `${stats.availableRooms}/4`, color: 'green', icon: 'M5 13l4 4L19 7' },
        { title: "Today's Bookings", value: stats.todayReservations, color: 'orange', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { title: 'Upcoming', value: stats.upcomingBookings, color: 'purple', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
      ].map((stat, index) => (
        <div
          key={stat.title}
          className={`bg-white rounded-lg p-3 shadow-sm border-l-4 border-${stat.color}-500 transition-all duration-200 hover:shadow-md`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 truncate">{stat.title}</p>
              <p className="text-lg font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className={`p-2 bg-${stat.color}-100 rounded-full`}>
              <svg className={`w-4 h-4 text-${stat.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
              </svg>
            </div>
          </div>
        </div>
      ))}
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

  const roomAvailability = allRooms.map((room) => {
    const roomReservations = reservations.filter((r) => r.date === selectedDateStr && r.room === room);
    const libraryHours = getLibraryHours(selectedDateStr);
    const isClosed = libraryHours.start === 0 && libraryHours.end === 0;
    return {
      room,
      reservations: roomReservations,
      isClosed,
      hasBookings: roomReservations.length > 0,
      availabilityStatus: isClosed ? 'closed' : roomReservations.length === 0 ? 'available' : 'partial',
    };
  });

  const ExternalLinksTabs = () => (
    <section className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <h3 className="text-base font-bold text-gray-900 mb-3">MMC Library Resources</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            href: 'http://koha.mmclib.net/',
            title: 'Open OPAC',
            description: 'Online Public Access Catalog',
            color: 'blue',
            icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M9 22V12h6v10',
          },
          {
            href: 'http://www.mmclib.net/',
            title: 'MMC Library',
            description: 'Official Library Website',
            color: 'green',
            icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
          },
          {
            href: 'http://mmc-edu.net/',
            title: 'MMC Website',
            description: 'Official College Website',
            color: 'purple',
            icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
          },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`group flex flex-col items-center p-3 bg-gradient-to-br from-${link.color}-50 to-${link.color}-100 rounded-lg border border-${link.color}-200 hover:border-${link.color}-400 transition-all duration-200`}
          >
            <div className={`w-10 h-10 bg-${link.color}-500 rounded-full flex items-center justify-center mb-2`}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1 text-center">{link.title}</h4>
            <p className="text-xs text-gray-600 text-center mb-2">{link.description}</p>
            <span className={`text-${link.color}-600 text-xs font-medium`}>
              {link.href.replace('http://', '')} → 
            </span>
          </a>
        ))}
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
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
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Library Dashboard</h2>
              <p className="text-xs text-gray-600 mt-1">Manage and monitor study room reservations</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center space-x-1 px-2 py-1.5 bg-white text-gray-700 rounded border border-gray-200 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 text-xs"
              >
                <svg className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{loading ? 'Updating...' : 'Refresh'}</span>
              </button>
              <Link
                to="/reserve"
                className="flex items-center space-x-1 px-2 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm transition-all duration-200 text-xs"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>New Booking</span>
              </Link>
            </div>
          </div>
          <div className="text-xs text-gray-500">Last updated: {lastUpdated.toLocaleString()}</div>
        </section>

        <QuickStats />

        <section className="bg-white rounded-lg shadow-sm p-3 mb-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 mb-3">
            <h3 className="text-base font-bold text-gray-900">Room Booking Status</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <div className="flex items-center space-x-2 bg-gray-50 rounded p-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full shadow-sm" />
                  <span className="text-xs text-gray-600">Available</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full shadow-sm" />
                  <span className="text-xs text-gray-600">Booked</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full shadow-sm" />
                  <span className="text-xs text-gray-600">Library Hours</span>
                </div>
              </div>
              <div className="flex items-center space-x-1 bg-white border border-gray-200 rounded p-2">
                <label htmlFor="date-select" className="text-xs font-medium text-gray-700">
                  Date:
                </label>
                <DatePicker
                  selected={selectedDate}
                  onChange={handleDateChange}
                  dateFormat="MMM d, yyyy"
                  minDate={today}
                  maxDate={new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)}
                  filterDate={(date) => date.getDay() !== 0}
                  className="px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-xs w-28"
                  id="date-select"
                />
              </div>
            </div>
          </div>
          {error && (
            <div className="mb-2 p-2 bg-red-50 border border-red-200 text-red-700 rounded text-xs">{error}</div>
          )}
          <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-900 mb-1">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </h4>
            {isSunday(selectedDate) ? (
              <p className="text-blue-700 font-medium flex items-center space-x-1 text-xs">
                <span>⚠️</span>
                <span>Library is closed on Sundays</span>
              </p>
            ) : isDateInPast(selectedDate) ? (
              <p className="text-blue-700 font-medium flex items-center space-x-1 text-xs">
                <span>📅</span>
                <span>Viewing past date - bookings cannot be made</span>
              </p>
            ) : (
              <p className="text-blue-700 font-medium flex items-center space-x-1 text-xs">
                <span>📚</span>
                <span>
                  Library hours: {getLibraryHours(selectedDateStr).start <= 12 ? '8:00 AM' : '2:00 PM'} -{' '}
                  {getLibraryHours(selectedDateStr).end <= 12 ? '5:00 PM' : '11:00 PM'}
                </span>
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"> {/* Increased from gap-3 */}
            {allRooms.map((room) => {
              const roomInfo = roomAvailability.find((r) => r.room === room);
              const isClosed = roomInfo?.isClosed;
              const hasBookings = roomInfo?.hasBookings;
              return (
                <div
                  key={room}
                  className={`rounded p-4 shadow-sm transition-all duration-200 ${ /* Increased from p-3 */
                    isClosed ? 'bg-gray-100 border border-gray-300' : hasBookings ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'
                  }`}
                >
                  <CircularClock room={room} date={selectedDateStr} />
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={() => handleCheckAvailability(room)}
                      className="flex-1 px-2 py-1.5 bg-white text-gray-700 rounded border border-gray-300 hover:bg-gray-50 transition-all duration-200 text-xs font-medium"
                    >
                      Check
                    </button>
                    <button
                      onClick={() => handleBookRoom(room)}
                      disabled={isClosed || isDateInPast(selectedDate)}
                      className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
                        isClosed || isDateInPast(selectedDate) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      Book
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <ExternalLinksTabs />
      </main>

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

export default Home;