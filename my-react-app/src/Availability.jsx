import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Tooltip } from 'react-tooltip';
import 'react-toastify/dist/ReactToastify.css';

function Availability() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(location.state?.date || today);
  const [selectedRoom, setSelectedRoom] = useState(location.state?.room || '');
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const apiUrl = import.meta.env.VITE_API_URL;

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

  // Circular Clock Component - Updated to match Home.jsx
  const CircularClock = ({ room, date, reservations }) => {
    const roomReservations = reservations.filter((r) => r.date === date && r.room === room);
    const libraryHours = getLibraryHours(date);
    const radius = 60; // Increased from 45
    const center = 70;  // Increased from 50
    const strokeWidth = 10; // Increased from 8

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
            strokeWidth="3" // Increased from 2.5
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
            style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif' }} // Updated from 12px, Arial
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
            strokeWidth="1.5" // Increased from 1
            strokeLinecap="round"
          />
        );
      }
      return markers;
    };

    const isClosed = libraryHours.start === 0 && libraryHours.end === 0;

    return (
      <div className="flex flex-col items-center space-y-3 p-3"> {/* Added p-3 */}
        <div className="relative">
          <svg width="150" height="150" viewBox="0 0 140 140" className="transform scale-100"> {/* Updated dimensions */}
            {/* Background logo */}
            <image
              href="/mmclogo.jpg"
              x={center - 30}
              y={center - 30}
              width="65"
              height="115"
              preserveAspectRatio="xMidYMid meet"
              opacity="2"
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
            <circle cx={center} cy={center} r="3.5" fill="#374151" /> {/* Updated r from 3 */}
            {date === today.toISOString().split('T')[0] && (
              <>
                <line
                  x1={center}
                  y1={center}
                  x2={center + (radius - 30) * Math.cos((((currentTime.getHours() % 12) * 30 + currentTime.getMinutes() * 0.5) - 90) * Math.PI / 180)}
                  y2={center + (radius - 30) * Math.sin((((currentTime.getHours() % 12) * 30 + currentTime.getMinutes() * 0.5) - 90) * Math.PI / 180)}
                  stroke="#374151"
                  strokeWidth="4" // Updated from 3
                  strokeLinecap="round"
                />
                <line
                  x1={center}
                  y1={center}
                  x2={center + (radius - 20) * Math.cos((currentTime.getMinutes() * 6 - 90) * Math.PI / 180)}
                  y2={center + (radius - 20) * Math.sin((currentTime.getMinutes() * 6 - 90) * Math.PI / 180)}
                  stroke="#374151"
                  strokeWidth="2.8" // Updated from 2
                  strokeLinecap="round"
                />
                <line
                  x1={center}
                  y1={center}
                  x2={center + (radius - 14) * Math.cos((currentTime.getSeconds() * 6 - 90) * Math.PI / 180)}
                  y2={center + (radius - 14) * Math.sin((currentTime.getSeconds() * 6 - 90) * Math.PI / 180)}
                  stroke="#DC2626"
                  strokeWidth="1.5" // Updated from 1
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

  const getTimeSlots = useCallback(() => {
    const day = selectedDate.getDay();
    if (day === 0) return []; // No slots on Sunday
    
    const startHour = day === 6 ? 2 : 8; // Sat: 2:00 AM, Mon-Fri: 8:00 AM
    const endHour = day === 6 ? 17 : 23; // Sat: 5:00 PM, Mon-Fri: 11:00 PM

    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) { // 30-minute intervals
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endMinute = minute + 30;
        const endHourAdj = hour + Math.floor(endMinute / 60);
        const endMinuteAdj = endMinute % 60;
        const endTime = `${endHourAdj.toString().padStart(2, '0')}:${endMinuteAdj.toString().padStart(2, '0')}`;
        slots.push({ time, formatted: formatTime(time), start: time, end: endTime });
      }
    }
    return slots;
  }, [selectedDate, formatTime]);

  const timeSlots = getTimeSlots();

  const fetchAvailability = useCallback(async () => {
    if (!selectedDate || !selectedRoom) return;
    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await axios.get(`${apiUrl}/api/reservations?date=${dateStr}&room=${selectedRoom}`);
      setReservations(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching availability:', error.stack);
      toast.error('Failed to load availability. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedRoom, apiUrl]);

  useEffect(() => {
    if (selectedDate && selectedRoom) {
      fetchAvailability();
      const interval = setInterval(fetchAvailability, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedDate, selectedRoom, fetchAvailability]);

  const isSlotBooked = (slot) => {
    return reservations.some(r => {
      const slotStart = new Date(`${r.date}T${slot.start}:00`).getTime();
      const slotEnd = new Date(`${r.date}T${slot.end}:00`).getTime();
      const resStart = new Date(`${r.date}T${r.timeStart}:00`).getTime();
      const resEnd = new Date(`${r.date}T${r.timeEnd}:00`).getTime();
      return slotStart < resEnd && slotEnd > resStart;
    });
  };

  const getBookingDetails = (slot) => {
    const overlapping = reservations.filter(r => {
      const slotStart = new Date(`${r.date}T${slot.start}:00`).getTime();
      const slotEnd = new Date(`${r.date}T${slot.end}:00`).getTime();
      const resStart = new Date(`${r.date}T${r.timeStart}:00`).getTime();
      const resEnd = new Date(`${r.date}T${r.timeEnd}:00`).getTime();
      return slotStart < resEnd && slotEnd > resStart;
    });
    return overlapping.length > 0
      ? overlapping.map(r => `${r.name} (${formatTime(r.timeStart)} - ${formatTime(r.timeEnd)})`).join(', ')
      : 'Available';
  };

  const handleBookSlot = (slot) => {
    if (!isSlotBooked(slot)) {
      navigate('/reserve', { state: { room: selectedRoom, date: selectedDate, timeStart: slot.start, timeEnd: slot.end } });
    }
  };

  const handleManualRefresh = () => {
    fetchAvailability();
    toast.info('Availability refreshed');
  };

  // Calculate available slots for quick overview
  const availableSlots = timeSlots.filter(slot => !isSlotBooked(slot)).length;
  const totalSlots = timeSlots.length;
  const availabilityPercentage = totalSlots > 0 ? Math.round((availableSlots / totalSlots) * 100) : 0;

  const isSunday = (date) => {
    return date.getDay() === 0;
  };

  const selectedDateStr = selectedDate.toISOString().split('T')[0];

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
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Check Availability</h2>
              <p className="text-xs text-gray-600 mt-1">Select a room and date to view available time slots</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleManualRefresh}
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

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-2">Room *</label>
              <select
                id="room"
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              >
                <option value="">Select Room</option>
                {['1', '2', '3', '4'].map(r => (
                  <option key={r} value={r}>Room {r}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                dateFormat="MMM d, yyyy"
                minDate={today}
                filterDate={(date) => date.getDay() !== 0}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {selectedRoom && selectedDate && (
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              </div>
              
              {totalSlots > 0 && (
                <div className="text-right">
                  <div className="text-sm text-gray-600 mb-1">
                    {availableSlots} of {totalSlots} slots available ({availabilityPercentage}%)
                  </div>
                  <div className="w-48 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${availabilityPercentage}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {selectedRoom && selectedDate && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            {loading ? (
              <div className="text-center py-12">
                <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-2 text-gray-600">Loading availability...</p>
              </div>
            ) : isSunday(selectedDate) ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🚫</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Library Closed</h3>
                <p className="text-gray-600 mb-4">The library is closed on Sundays. Please select another date.</p>
                <button
                  onClick={() => setSelectedDate(new Date())}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Today
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Circular Clock Visualization */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Visual Overview - Room {selectedRoom}</h3>
                  <CircularClock 
                    room={selectedRoom} 
                    date={selectedDateStr} 
                    reservations={reservations} 
                  />
                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    {reservations.length > 0 && (
                      <div>
                        <p className="font-medium text-gray-900">{reservations.length} Active Booking{reservations.length !== 1 ? 's' : ''}</p>
                        {reservations.slice(0, 3).map((res, idx) => (
                          <p key={idx} className="text-xs">
                            {formatTime(res.timeStart)} - {formatTime(res.timeEnd)}
                          </p>
                        ))}
                        {reservations.length > 3 && (
                          <p className="text-xs text-gray-500">+{reservations.length - 3} more</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Detailed Time Slots Table */}
                <div className="overflow-x-auto">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Time Slots</h3>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Slot</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {timeSlots.map((slot) => {
                        const booked = isSlotBooked(slot);
                        return (
                          <tr key={slot.time} className={booked ? 'bg-red-50' : 'bg-green-50 hover:bg-green-100'}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatTime(slot.start)} - {formatTime(slot.end)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                  booked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {booked ? 'Booked' : 'Available'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <button
                                onClick={() => handleBookSlot(slot)}
                                disabled={booked}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  booked 
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                              >
                                {booked ? 'Booked' : 'Book Now'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {!selectedRoom && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Room and Date</h3>
            <p className="text-gray-600 mb-4">Choose a room and date above to view availability details</p>
          </div>
        )}
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

export default Availability;