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

  // Circular Clock Component - Same as Home page
  const CircularClock = ({ room, date, reservations }) => {
    const roomReservations = reservations.filter(r => r.room === room);
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
    const dateStr = new Date(date).toISOString().split('T')[0];
    const isToday = dateStr === new Date().toISOString().split('T')[0];

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
            {isToday && (
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
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/mmclogo.jpg" alt="MMC Logo" className="h-8 w-auto object-contain rounded" />
              <h1 className="text-lg font-bold text-blue-800">MMC EUNPA Library</h1>
            </Link>
            <Link 
              to="/" 
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Check Availability</h1>
            <p className="text-gray-600">Select a room and date to view available time slots</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-2">Room *</label>
                <select
                  id="room"
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  dateFormat="MMMM d, yyyy"
                  minDate={today}
                  filterDate={(date) => date.getDay() !== 0}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {selectedRoom && selectedDate && (
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleManualRefresh}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh</span>
                  </button>
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
            <div className="bg-white rounded-xl shadow-lg p-6">
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
            <div className="text-center py-12 bg-white rounded-xl shadow-lg">
              <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Room and Date</h3>
              <p className="text-gray-600 mb-4">Choose a room and date above to view availability details</p>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img src="/mmclogo.jpg" alt="MMC Logo" className="h-8 w-8 object-contain rounded" />
            <p className="text-lg font-semibold">MMC EUNPA Library</p>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            &copy; {new Date().getFullYear()} All rights reserved. Study Room Reservation System
          </p>
          <div className="flex justify-center space-x-6 text-sm">
            <Link to="/about" className="text-gray-400 hover:text-white transition-colors">About</Link>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Use</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Availability;
