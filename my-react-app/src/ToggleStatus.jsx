import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function ToggleStatus({ room, date, isAdmin = false, apiUrl = 'http://localhost:5000' }) {
  const [status, setStatus] = useState('Available');
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/reservations?date=${date}&room=${room}`);
      const hasBooking = response.data.some(r => r.purpose === 'Status Toggle' && r.name === 'Admin');
      setStatus(hasBooking ? 'Booked' : 'Available');
    } catch (error) {
      console.error('Error fetching room status:', error.stack);
    }
  }, [apiUrl, date, room]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleToggle = async () => {
    if (!isAdmin) {
      toast.error('Only library staff can toggle room status.');
      return;
    }

    setLoading(true);
    try {
      await axios.put(`${apiUrl}/api/rooms/${room}/status`, {
        date,
        status: status === 'Available' ? 'Booked' : 'Available',
      });
      setStatus(status === 'Available' ? 'Booked' : 'Available');
      toast.success(`Room ${room} status updated to ${status === 'Available' ? 'Booked' : 'Available'}.`);
    } catch (error) {
      console.error('Error toggling status:', error.stack);
      toast.error('Failed to update room status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <p className="text-sm font-medium text-gray-800">Room {room} Status: {status}</p>
      <button
        onClick={handleToggle}
        disabled={loading || !isAdmin}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          loading || !isAdmin ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {loading ? 'Updating...' : 'Toggle'}
      </button>
    </div>
  );
}

export default ToggleStatus;