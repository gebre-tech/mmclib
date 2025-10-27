import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ReservationForm() {
  const today = new Date();
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    no: 0,
    date: location.state?.date || today,
    name: '',
    id: '',
    timeStart: location.state?.timeStart || '',
    timeEnd: location.state?.timeEnd || '',
    persons: 2,
    purpose: 'Study',
    room: location.state?.room || '',
    remark: '',
    acknowledgeClean: false,
  });
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchLastReservationNo = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/reservations`);
      const lastRes = response.data.length > 0 ? Math.max(...response.data.map(r => r.no)) : 0;
      return lastRes + 1;
    } catch (error) {
      console.error('Error fetching last reservation number:', error.stack);
      return 1;
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchLastReservationNo().then(newNo => setFormData(prev => ({ ...prev, no: newNo })));
  }, [fetchLastReservationNo]);

  useEffect(() => {
    if (location.state) {
      setFormData(prev => ({
        ...prev,
        date: location.state.date || prev.date,
        room: location.state.room || prev.room,
        timeStart: location.state.timeStart || prev.timeStart,
        timeEnd: location.state.timeEnd || prev.timeEnd,
      }));
    }
  }, [location.state]);

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const adjustedHours = hours % 12 || 12;
    return `${adjustedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const parseTime = (input) => {
    if (!input) return '';
    if (input.includes(' ')) {
      const [timePart, period] = input.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    return input;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    // Create new date objects to avoid mutation
    const selectedDate = new Date(formData.date);
    selectedDate.setHours(0, 0, 0, 0);
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const day = selectedDate.getDay();

    // Validate Sunday
    if (day === 0) {
      toast.error('Reservations are not allowed on Sundays.');
      setIsSubmitting(false);
      return;
    }

    // Validate advance booking (1+ day for future dates)
    if (selectedDate > todayStart) {
      const diffDays = (selectedDate - todayStart) / (1000 * 60 * 60 * 24);
      if (diffDays < 1) {
        toast.error('Future reservations must be booked at least 1 day in advance.');
        setIsSubmitting(false);
        return;
      }
    }

    // Validate date ≥ today
    if (selectedDate < todayStart) {
      toast.error('Reservations must be for today or a later date.');
      setIsSubmitting(false);
      return;
    }

    // Validate required fields
    if (!formData.name || !formData.id || !formData.room) {
      toast.error('Name, ID, and Room are required.');
      setIsSubmitting(false);
      return;
    }

    // Validate minimum 2 persons
    if (formData.persons < 2) {
      toast.error('Minimum 2 persons required per reservation rule.');
      setIsSubmitting(false);
      return;
    }

    // Validate time selection
    if (!formData.timeStart || !formData.timeEnd) {
      toast.error('Please select both start and end times.');
      setIsSubmitting(false);
      return;
    }

    const start = new Date(`${formData.date.toISOString().split('T')[0]}T${formData.timeStart}:00`);
    const end = new Date(`${formData.date.toISOString().split('T')[0]}T${formData.timeEnd}:00`);
    const duration = (end - start) / (1000 * 60 * 60);
    if (duration <= 0) {
      toast.error('End time must be after start time.');
      setIsSubmitting(false);
      return;
    }
    if (duration > 2) {
      toast.error('Maximum 2 hours per slot allowed per reservation rule.');
      setIsSubmitting(false);
      return;
    }

    // Validate library hours
    const [startHours, startMinutes] = formData.timeStart.split(':').map(Number);
    const [endHours, endMinutes] = formData.timeEnd.split(':').map(Number);
    if (day === 6) {
      // Saturday: 2:00 AM - 5:00 PM
      if (startHours < 2 || (startHours === 17 && startMinutes > 0) || endHours > 17 || (endHours === 17 && endMinutes > 0)) {
        toast.error('Reservations on Saturday must be within 2:00 AM - 5:00 PM.');
        setIsSubmitting(false);
        return;
      }
    } else {
      // Mon-Fri: 8:00 AM - 11:00 PM
      if (startHours < 8 || (startHours === 23 && startMinutes > 0) || endHours > 23 || (endHours === 23 && endMinutes > 0)) {
        toast.error('Reservations on weekdays must be within 8:00 AM - 11:00 PM.');
        setIsSubmitting(false);
        return;
      }
    }

    // Validate cleanliness acknowledgment
    if (!formData.acknowledgeClean) {
      toast.error('Please acknowledge keeping the room clean and tidy per reservation rule.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Format date as YYYY-MM-DD for backend
      const dateStr = formData.date.toISOString().split('T')[0];
      const dataToSend = { 
        ...formData, 
        date: dateStr,
        persons: parseInt(formData.persons),
        acknowledgeClean: Boolean(formData.acknowledgeClean)
      };
      
      // Remove React-specific properties that might cause issues
      delete dataToSend._id;
      
      await axios.post(`${apiUrl}/api/reservations`, dataToSend);
      setShowConfirmModal(true);
    } catch (error) {
      console.error('Error submitting reservation:', error);
      if (error.response?.status === 409) {
        toast.error('The selected time slot is already booked. Please choose another time.');
      } else if (error.response?.status === 400) {
        toast.error(error.response.data?.error || 'Invalid reservation data. Please check your inputs.');
      } else {
        toast.error('Error submitting reservation. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmModalClose = () => {
    setShowConfirmModal(false);
    setFormData({
      no: formData.no,
      date: today,
      name: '',
      id: '',
      timeStart: '',
      timeEnd: '',
      persons: 2,
      purpose: 'Study',
      room: '',
      remark: '',
      acknowledgeClean: false,
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/mmclogo.jpg" alt="MMC Logo" className="h-8 w-auto object-contain" />
              <h1 className="text-lg font-bold text-blue-800">MMC EUNPA Library</h1>
            </Link>
            <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium">← Back to Home</Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Room Reservation</h1>
            <p className="text-gray-600">Book a study room for your group activities</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">New Reservation</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                        Date *
                      </label>
                      <DatePicker
                        selected={formData.date}
                        onChange={(date) => setFormData({ ...formData, date })}
                        dateFormat="MMMM d, yyyy"
                        minDate={today}
                        maxDate={new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)}
                        filterDate={(date) => date.getDay() !== 0}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your name"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="id" className="block text-sm font-medium text-gray-700 mb-2">
                        ID *
                      </label>
                      <input
                        type="text"
                        id="id"
                        value={formData.id}
                        onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your ID"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="timeStart" className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time *
                      </label>
                      <input
                        type="time"
                        id="timeStart"
                        value={formData.timeStart}
                        onChange={(e) => setFormData({ ...formData, timeStart: parseTime(e.target.value) })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min={formData.date.getDay() === 6 ? "02:00" : "08:00"}
                        max={formData.date.getDay() === 6 ? "16:45" : "22:45"}
                        required
                      />
                      {formData.timeStart && (
                        <p className="mt-1 text-sm text-gray-500">Selected: {formatTime(formData.timeStart)}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="timeEnd" className="block text-sm font-medium text-gray-700 mb-2">
                        End Time *
                      </label>
                      <input
                        type="time"
                        id="timeEnd"
                        value={formData.timeEnd}
                        onChange={(e) => setFormData({ ...formData, timeEnd: parseTime(e.target.value) })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min={formData.date.getDay() === 6 ? "02:15" : "08:15"}
                        max={formData.date.getDay() === 6 ? "17:00" : "23:00"}
                        required
                      />
                      {formData.timeEnd && (
                        <p className="mt-1 text-sm text-gray-500">Selected: {formatTime(formData.timeEnd)}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="persons" className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Persons *
                      </label>
                      <input
                        type="number"
                        id="persons"
                        value={formData.persons}
                        onChange={(e) => setFormData({ ...formData, persons: parseInt(e.target.value) || 2 })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="2"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2">
                        Purpose *
                      </label>
                      <select
                        id="purpose"
                        value={formData.purpose}
                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="Study">Study</option>
                        <option value="Meeting">Meeting</option>
                        <option value="Group Work">Group Work</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-2">
                        Room *
                      </label>
                      <select
                        id="room"
                        value={formData.room}
                        onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Room</option>
                        {['1', '2', '3', '4'].map((r) => (
                          <option key={r} value={r}>Room {r}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="remark" className="block text-sm font-medium text-gray-700 mb-2">
                        Remark
                      </label>
                      <textarea
                        id="remark"
                        value={formData.remark}
                        onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows="4"
                        placeholder="Any additional notes"
                      ></textarea>
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.acknowledgeClean}
                          onChange={(e) => setFormData({ ...formData, acknowledgeClean: e.target.checked })}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          I acknowledge that I will keep the room clean and tidy per the reservation rules.
                        </span>
                      </label>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      'Submit Reservation'
                    )}
                  </button>
                </form>
                {message && (
                  <div className={`mt-6 p-4 rounded-lg ${message.includes('Error') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                    {message}
                  </div>
                )}
              </div>
            </div>
            <div className="md:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Reservation Rules</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-700">Reserve at Circulation Desk after submission.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-700">Maximum 2 hours per slot; extend if no conflict.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-700">For 2+ persons; advance booking (1+ day) required for future dates.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-700">Keep the room clean and tidy.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-700">Library Hours: Mon-Fri 8:00 AM–11:00 PM, Sat 8:00 AM–5:00 PM, Closed Sun.</p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Need Help?</h4>
                  <p className="text-sm text-gray-600 mb-4">Visit the Circulation Desk for assistance with reservations or any questions.</p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Library Hours:</span><br />
                    Mon-Fri: 8:00 AM–11:00 PM<br />
                    Sat: 8:00 AM–5:00 PM<br />
                    Sun: Closed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md mx-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Reservation Submitted</h3>
              <p className="text-gray-600 mb-6">
                Your reservation has been submitted successfully! Please visit the Circulation Desk to confirm your booking.
              </p>
              <button
                onClick={handleConfirmModalClose}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ReservationForm;
