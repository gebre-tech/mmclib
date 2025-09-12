import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import RoomList from './RoomList';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50" style={{ background: 'linear-gradient(135deg, #f3f4f6 0%, #e0e7ff 100%)' }}>
          <div className="text-center p-8 rounded-xl bg-white/90 backdrop-blur-md shadow-2xl" style={{ boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)' }}>
            <h3 className="text-red-600 font-semibold text-xl mb-2">Something went wrong</h3>
            <p className="text-gray-500" style={{ lineHeight: '1.75' }}>{this.state.error.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ReservationForm() {
  const today = new Date(); // 4:08 PM EAT, Sep 12, 2025
  const location = useLocation();
  const [formData, setFormData] = useState({
    no: 0,
    date: today,
    nameId: '',
    timeStart: '',
    timeEnd: '',
    persons: 2,
    purpose: 'Study',
    room: location.state?.room || '', // Pre-fill room from homepage selection
    remark: '',
    acknowledgeClean: false,
  });
  const [reservations, setReservations] = useState([]);
  const [message, setMessage] = useState('');

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5173';

  const fetchReservations = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/reservations`);
      setReservations(response.data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      setMessage('Failed to load reservations.');
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate date ≥ today
    if (formData.date < today) {
      setMessage('Error: Reservations must be for today or a later date.');
      return;
    }

    // Validate minimum 2 persons
    if (formData.persons < 2) {
      setMessage('Error: Minimum 2 persons required per reservation rule.');
      return;
    }

    // Validate time selection
    if (!formData.timeStart || !formData.timeEnd) {
      setMessage('Error: Please select both start and end times.');
      return;
    }

    const start = new Date(`2025-01-01T${formData.timeStart}:00`);
    const end = new Date(`2025-01-01T${formData.timeEnd}:00`);
    const duration = (end - start) / (1000 * 60 * 60); // Duration in hours
    if (duration <= 0) {
      setMessage('Error: End time must be after start time.');
      return;
    }
    if (duration > 2) {
      setMessage('Error: Maximum 2 hours per slot allowed per reservation rule.');
      return;
    }

    // Check for conflicts
    const dateStr = formData.date.toISOString().split('T')[0];
    const conflict = reservations.some((r) =>
      r.date === dateStr &&
      r.room === formData.room &&
      ((formData.timeStart >= r.timeStart && formData.timeStart < r.timeEnd) ||
        (formData.timeEnd > r.timeStart && formData.timeEnd <= r.timeEnd))
    );
    if (conflict) {
      setMessage('Error: This room/time slot is already booked.');
      return;
    }

    // Validate cleanliness acknowledgment
    if (!formData.acknowledgeClean) {
      setMessage('Error: Please acknowledge keeping the room clean and tidy per reservation rule.');
      return;
    }

    try {
      const dataToSend = { ...formData, date: dateStr };
      await axios.post(`${apiUrl}/api/reservations`, dataToSend);
      setMessage('Reservation successful! Please reserve at the Circulation Desk.');
      fetchReservations();
      setFormData({
        ...formData,
        nameId: '',
        timeStart: '',
        timeEnd: '',
        persons: 2,
        purpose: 'Study',
        room: '',
        remark: '',
        acknowledgeClean: false,
      });
    } catch {
      setMessage('Error submitting reservation.');
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f3f4f6 0%, #e0e7ff 100%)' }}>
        {/* MMC Logo Background Placeholder */}
        <div className="absolute inset-0 bg-[url('/path/to/mmc-logo.png')] bg-cover bg-center blur-md opacity-15" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/5 to-indigo-900/5"></div>
        <div className="relative z-10 w-full max-w-5xl">
          {/* Header */}
          <div className="text-center mb-12" style={{ padding: '2rem 0', animation: 'fadeIn 0.5s ease-in-out' }}>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
              MMC Library Room Reservation
            </h1>
            <p className="text-lg text-gray-600" style={{ letterSpacing: '0.5px' }}>Streamline your group study bookings</p>
          </div>

          {/* Form Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 mb-8 border border-gray-200/50" style={{ boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)', borderRadius: '16px' }}>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center" style={{ color: '#1e293b', textTransform: 'uppercase', letterSpacing: '1px' }}>New Reservation</h2>
            <form onSubmit={handleSubmit}>
              <table className="w-full border-collapse" style={{ borderSpacing: '0 10px' }}>
                <tbody>
                  <tr>
                    <td className="pb-4 pr-4 text-sm font-medium text-gray-700" style={{ padding: '12px', verticalAlign: 'top' }}>Date (≥ Today)</td>
                    <td className="pb-4">
                      <DatePicker
                        id="date"
                        selected={formData.date}
                        onChange={(date) => setFormData({ ...formData, date })}
                        dateFormat="MMMM d, yyyy"
                        minDate={today}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-sm"
                        placeholderText="Select Date"
                        required
                        aria-required="true"
                        style={{ borderRadius: '12px', padding: '12px', fontSize: '16px' }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="pb-4 pr-4 text-sm font-medium text-gray-700" style={{ padding: '12px', verticalAlign: 'top' }}>Name ID</td>
                    <td className="pb-4">
                      <input
                        id="nameId"
                        type="text"
                        value={formData.nameId}
                        onChange={(e) => setFormData({ ...formData, nameId: e.target.value })}
                        placeholder="e.g., RD102312"
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-sm"
                        required
                        aria-required="true"
                        style={{ borderRadius: '12px', padding: '12px', fontSize: '16px', boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)' }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="pb-4 pr-4 text-sm font-medium text-gray-700" style={{ padding: '12px', verticalAlign: 'top' }}>Start Time</td>
                    <td className="pb-4">
                      <input
                        id="timeStart"
                        type="time"
                        value={formData.timeStart}
                        onChange={(e) => setFormData({ ...formData, timeStart: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-sm"
                        required
                        aria-required="true"
                        style={{ borderRadius: '12px', padding: '12px', fontSize: '16px' }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="pb-4 pr-4 text-sm font-medium text-gray-700" style={{ padding: '12px', verticalAlign: 'top' }}>End Time</td>
                    <td className="pb-4">
                      <input
                        id="timeEnd"
                        type="time"
                        value={formData.timeEnd}
                        onChange={(e) => setFormData({ ...formData, timeEnd: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-sm"
                        required
                        aria-required="true"
                        style={{ borderRadius: '12px', padding: '12px', fontSize: '16px' }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="pb-4 pr-4 text-sm font-medium text-gray-700" style={{ padding: '12px', verticalAlign: 'top' }}>Number of Persons (≥2)</td>
                    <td className="pb-4">
                      <input
                        id="persons"
                        type="number"
                        value={formData.persons}
                        onChange={(e) => setFormData({ ...formData, persons: parseInt(e.target.value) || 2 })}
                        min="2"
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-sm"
                        required
                        aria-required="true"
                        style={{ borderRadius: '12px', padding: '12px', fontSize: '16px' }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="pb-4 pr-4 text-sm font-medium text-gray-700" style={{ padding: '12px', verticalAlign: 'top' }}>Purpose</td>
                    <td className="pb-4">
                      <select
                        id="purpose"
                        value={formData.purpose}
                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-sm"
                        required
                        aria-required="true"
                        style={{ borderRadius: '12px', padding: '12px', fontSize: '16px' }}
                      >
                        <option value="Study">Study</option>
                        <option value="Group Project">Group Project</option>
                        <option value="Meeting">Meeting</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td className="pb-4 pr-4 text-sm font-medium text-gray-700" style={{ padding: '12px', verticalAlign: 'top' }}>Room</td>
                    <td className="pb-4">
                      <select
                        id="room"
                        value={formData.room}
                        onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-sm"
                        required
                        aria-required="true"
                        style={{ borderRadius: '12px', padding: '12px', fontSize: '16px' }}
                      >
                        <option value="">Select Room</option>
                        {['1', '2', '3', '4'].map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td className="pb-4 pr-4 text-sm font-medium text-gray-700" style={{ padding: '12px', verticalAlign: 'top' }}>Remark (Optional)</td>
                    <td className="pb-4">
                      <input
                        id="remark"
                        type="text"
                        value={formData.remark}
                        onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                        placeholder="Any additional notes..."
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-sm"
                        style={{ borderRadius: '12px', padding: '12px', fontSize: '16px', boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)' }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="pb-4 pr-4 text-sm font-medium text-gray-700" style={{ padding: '12px', verticalAlign: 'top' }}></td>
                    <td className="pb-4">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.acknowledgeClean}
                          onChange={(e) => setFormData({ ...formData, acknowledgeClean: e.target.checked })}
                          className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition duration-300"
                          required
                          aria-required="true"
                          style={{ borderRadius: '6px', transition: 'all 0.3s ease' }}
                        />
                        <span className="text-sm text-gray-700" style={{ lineHeight: '1.75' }}>I acknowledge to keep the room clean and tidy.</span>
                      </label>
                    </td>
                  </tr>
                  <tr>
                    <td className="pb-4 pr-4" style={{ padding: '12px' }}></td>
                    <td className="pb-4">
                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white py-3 rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-300 font-semibold text-lg shadow-lg transform hover:scale-105 transition-all duration-300"
                        style={{
                          background: 'linear-gradient(90deg, #3b82f6, #6366f1, #3b82f8)',
                          boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)',
                          animation: 'pulseOnce 1s ease-out forwards',
                        }}
                      >
                        Submit Reservation
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </form>
            {message && (
              <div className={`mt-6 p-4 text-center rounded-xl ${message.includes('Error') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'} shadow-md`}
                   style={{ boxShadow: '0 6px 15px rgba(0, 0, 0, 0.05)', borderRadius: '14px' }}>
                {message}
              </div>
            )}
          </div>

          {/* Reservations Section */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 border border-gray-200/50 sticky top-4 z-10"
               style={{ boxShadow: '0 12px 30px rgba(0, 0, 0, 0.1)', borderRadius: '16px' }}>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4 text-center" style={{ color: '#1e293b', letterSpacing: '0.5px' }}>Current Reservations</h3>
            <RoomList reservations={reservations} fetchReservations={fetchReservations} />
          </div>

          {/* Rules Section */}
          <div className="mt-8 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-gray-200/50"
               style={{ boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)', borderRadius: '16px' }}>
            <h4 className="text-xl font-semibold text-gray-800 mb-4" style={{ color: '#1e293b', letterSpacing: '0.5px' }}>Reservation Rules</h4>
            <ul className="space-y-3 text-gray-600 list-disc list-inside" style={{ lineHeight: '1.8' }}>
              <li>Reserve at Circulation Desk after submission.</li>
              <li>Maximum 2 hours per slot; extend if no conflict.</li>
              <li>For 2+ persons; advance booking (1+ day) required.</li>
              <li>Keep the room clean and tidy.</li>
            </ul>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default ReservationForm;