import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';

function Availability() {
  const location = useLocation();
  const navigate = useNavigate();
  const today = new Date(); // 04:46 PM EAT, October 02, 2025
  const [selectedDate, setSelectedDate] = useState(location.state?.date || today);
  const [selectedRoom, setSelectedRoom] = useState(location.state?.room || '');
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Generate hourly slots from 8AM to 6PM
  const timeSlots = Array.from({ length: 11 }, (_, i) => {
    const hour = 8 + i;
    const time = `${hour.toString().padStart(2, '0')}:00`;
    const formatted = new Date(`${selectedDate.toISOString().split('T')[0]}T${time}`).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
    return { time, formatted, start: time, end: `${(hour + 1).toString().padStart(2, '0')}:00` };
  });

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await axios.get(`${apiUrl}/api/reservations`);
      const filtered = response.data.filter(r => r.date === dateStr && r.room === selectedRoom);
      setReservations(filtered);
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedRoom, apiUrl]); // Dependencies for useCallback

  useEffect(() => {
    if (selectedDate && selectedRoom) {
      fetchAvailability();
    }
  }, [selectedDate, selectedRoom, fetchAvailability]); // Added fetchAvailability to dependency array

  const isSlotBooked = (slot) => {
    return reservations.some(r => {
      const resStart = parseInt(r.timeStart.split(':')[0]);
      const resEnd = parseInt(r.timeEnd.split(':')[0]);
      const slotStart = parseInt(slot.start.split(':')[0]);
      const slotEnd = parseInt(slot.end.split(':')[0]);
      return slotStart < resEnd && slotEnd > resStart;
    });
  };

  const getBookingDetails = (slot) => {
    const overlapping = reservations.filter(r => {
      const resStart = parseInt(r.timeStart.split(':')[0]);
      const resEnd = parseInt(r.timeEnd.split(':')[0]);
      const slotStart = parseInt(slot.start.split(':')[0]);
      const slotEnd = parseInt(slot.end.split(':')[0]);
      return slotStart < resEnd && slotEnd > resStart;
    });
    return overlapping.map(r => `${r.nameId} - ${r.purpose} (Date: ${r.date}, ${r.timeStart} - ${r.timeEnd})`).join(', ');
  };

  const getTimeRemaining = (slot) => {
    if (selectedDate.toDateString() === today.toDateString()) { // Only calculate if it's today
      const currentHour = today.getHours();
      const slotStart = parseInt(slot.start.split(':')[0]);
      const slotEnd = parseInt(slot.end.split(':')[0]);
      if (isSlotBooked(slot) && currentHour >= slotStart && currentHour < slotEnd) {
        const endTime = new Date(`${today.toISOString().split('T')[0]}T${slot.end}:00`).getTime();
        const now = today.getTime();
        const timeDiff = endTime - now;
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m remaining`;
      }
    }
    return '';
  };

  const handleBookSlot = (slot) => {
    if (!isSlotBooked(slot)) {
      navigate('/reserve', { state: { room: selectedRoom, date: selectedDate, timeStart: slot.start, timeEnd: slot.end } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md py-4 sticky top-0 z-10">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/" className="text-blue-600 hover:text-blue-800 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Room Availability</h1>
          </div>
          <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium">Back to Home</Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          {/* Filters */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <DatePicker
                selected={selectedDate}
                onChange={setSelectedDate}
                dateFormat="MMMM d, yyyy"
                minDate={today}
                maxDate={new Date(today.getTime() + 24 * 60 * 60 * 1000)} // +1 day
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Room</label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Room</option>
                {['1', '2', '3', '4'].map((r) => <option key={r} value={r}>Room {r}</option>)}
              </select>
            </div>
            <button
              onClick={fetchAvailability}
              disabled={loading || !selectedDate || !selectedRoom}
              className="md:col-span-3 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 mt-6 md:mt-0"
            >
              {loading ? 'Loading...' : 'Check Availability'}
            </button>
          </div>

          {/* Time Slots Grid */}
          {selectedRoom && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Slot</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Remaining</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timeSlots.map((slot) => {
                    const booked = isSlotBooked(slot);
                    return (
                      <tr key={slot.time} className={booked ? 'bg-red-50' : 'bg-green-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {slot.formatted}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${booked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {booked ? 'Booked' : 'Free'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {booked ? getBookingDetails(slot) : 'Available for booking'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {booked && selectedDate.toDateString() === today.toDateString() ? getTimeRemaining(slot) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleBookSlot(slot)}
                            disabled={booked}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${booked ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                          >
                            Book
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">MMC EUNPA Library © {new Date().getFullYear()}</p>
          <div className="mt-2 flex justify-center space-x-4 text-sm">
            <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white">Terms of Use</a>
            <a href="#" className="text-gray-400 hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Availability;