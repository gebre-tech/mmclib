import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ErrorBoundary from './ErrorBoundary';
import { toast } from 'react-toastify';

function RoomList() {
  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchReservations = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/reservations`);
      setReservations(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      setError('Failed to load reservations. Please try again later.');
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const today = new Date().toISOString().split('T')[0]; // "2025-10-02"
  const reservedRooms = reservations.filter(r => r.date === today);

  const handleExtend = async (reservation) => {
    try {
      // Parse current timeEnd and add 2 hours
      const currentEnd = new Date(`${today} ${reservation.timeEnd}:00`).getTime(); // Use today’s date for consistency
      const newEndTime = new Date(currentEnd + 2 * 60 * 60 * 1000); // Add 2 hours
      const updatedTimeEnd = newEndTime.toTimeString().slice(0, 5); // Format as HH:MM

      // Check if extension is valid (e.g., not past library hours, assuming 6:00 PM close)
      const maxEndTime = new Date(`${today} 18:00:00`).getTime();
      if (newEndTime.getTime() > maxEndTime) {
        toast.error('Cannot extend beyond 6:00 PM.');
        return;
      }

      // Send update to backend using _id
      const updatedReservation = { ...reservation, timeEnd: updatedTimeEnd };
      await axios.put(`${apiUrl}/api/reservations/${reservation._id}`, updatedReservation);
      await fetchReservations(); // Refresh the list
      toast.success('Reservation extended successfully!');
    } catch (error) {
      console.error('Error extending reservation:', error);
      toast.error('Failed to extend reservation. Please check the time slot or try again.');
    }
  };

  const handleDelete = async (reservationId) => {
    try {
      // Use _id for the request
      await axios.delete(`${apiUrl}/api/reservations/${reservationId}`);
      await fetchReservations(); // Refresh the list
      toast.success('Reservation deleted successfully!');
    } catch (error) {
      console.error('Error deleting reservation:', error);
      toast.error('Failed to delete reservation. Please try again.');
    }
  };

  return (
    <ErrorBoundary>
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
              <h1 className="text-xl font-bold text-gray-900">Current Reservations</h1>
            </div>
            <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium">Back to Home</Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <section className="bg-white rounded-xl shadow-lg p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
            {reservedRooms.length > 0 ? (
              <div className="space-y-6">
                {reservedRooms.map((r) => (
                  <div key={r._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">Reservation #{r.no}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Room {r.room}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                      <p><span className="font-medium text-gray-900">Date:</span> {r.date}</p>
                      <p><span className="font-medium text-gray-900">Name ID:</span> {r.nameId}</p>
                      <p><span className="font-medium text-gray-900">Time:</span> {r.timeStart} - {r.timeEnd}</p>
                      <p><span className="font-medium text-gray-900">Persons:</span> {r.persons}</p>
                      <p><span className="font-medium text-gray-900">Purpose:</span> {r.purpose}</p>
                      <p><span className="font-medium text-gray-900">Remark:</span> {r.remark || 'N/A'}</p>
                      <p><span className="font-medium text-gray-900">Clean Acknowledged:</span> {r.acknowledgeClean ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="mt-4 flex space-x-3">
                      <button
                        onClick={() => handleExtend(r)}
                        className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium disabled:bg-blue-400"
                        disabled={new Date(`${today} ${r.timeEnd}:00`).getTime() + 2 * 60 * 60 * 1000 > new Date(`${today} 18:00:00`).getTime()}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Extend +2h
                      </button>
                      <button
                        onClick={() => handleDelete(r._id)}
                        className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c2.219 0 4-1.781 4-4s-1.781-4-4-4-4 1.781-4 4 1.781 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No Reservations Today</h3>
                <p className="mt-2 text-gray-600">It looks like there are no reservations scheduled for Thursday, October 02, 2025. Check back later or make a new reservation!</p>
                <Link to="/reserve" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">Book a Room</Link>
              </div>
            )}
          </section>
        </main>

        <footer className="bg-gray-800 text-white py-6 mt-12">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm">MMC EUNPA Library &copy; {new Date().getFullYear()}</p>
            <div className="mt-2 flex justify-center space-x-4 text-sm">
              <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white">Terms of Use</a>
              <a href="#" className="text-gray-400 hover:text-white">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default RoomList;