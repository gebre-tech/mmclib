import React, { useState } from 'react';

function ToggleStatus() {
  const [status, setStatus] = useState('Available');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-100">
      <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-xl p-6 text-center animate-fadeIn">
        <p className="text-xl font-medium text-gray-800 mb-4">Room Status: {status}</p>
        <button
          onClick={() => setStatus(status === 'Available' ? 'Booked' : 'Available')}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500"
        >
          Toggle
        </button>
      </div>
    </div>
  );
}

export default ToggleStatus;