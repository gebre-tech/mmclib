import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export function RoomList({ reservations: propReservations, fetchReservations: propFetch }) {
  const [localReservations, setLocalReservations] = useState(propReservations || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5173';
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const fetchLocal = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${apiUrl}/api/reservations`);
      setLocalReservations(response.data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      setError('Failed to load reservations.');
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    if (!propReservations) {
      fetchLocal();
    }
  }, [fetchLocal, propReservations]);

  useEffect(() => {
    setLocalReservations(propReservations || []);
  }, [propReservations]);

  const displayReservations = propReservations || localReservations;

  const addHoursToTime = (timeStr, hours) => {
    const [h, m] = timeStr.split(':').map(Number);
    const date = new Date(2000, 0, 1, h, m);
    date.setHours(date.getHours() + hours);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const isEligibleForExtension = (r) => {
    const nextStart = r.timeEnd;
    const nextEnd = addHoursToTime(r.timeEnd, 2);
    return !displayReservations.some(
      (other) =>
        other._id !== r._id &&
        other.date === r.date &&
        other.room === r.room &&
        (nextStart < other.timeEnd && nextEnd > other.timeStart)
    );
  };

  const handleExtend = useCallback(
    async (r) => {
      setLoading(true);
      setError(null);
      try {
        const newTimeEnd = addHoursToTime(r.timeEnd, 2);
        await axios.put(`${apiUrl}/api/reservations/${r._id}`, { timeEnd: newTimeEnd });
        if (propFetch) propFetch();
        else fetchLocal();
      } catch (error) {
        console.error('Error extending reservation:', error);
        setError('Failed to extend reservation.');
      } finally {
        setLoading(false);
      }
    },
    [apiUrl, fetchLocal, propFetch]
  );

  const handleDelete = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        await axios.delete(`${apiUrl}/api/reservations/${id}`);
        if (propFetch) propFetch();
        else fetchLocal();
      } catch (error) {
        console.error('Error deleting reservation:', error);
        setError('Failed to delete reservation.');
      } finally {
        setLoading(false);
      }
    },
    [apiUrl, fetchLocal, propFetch]
  );

  const handleEdit = (r) => {
    setEditingId(r._id);
    setEditData({ ...r });
  };

  const handleSaveEdit = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        await axios.put(`${apiUrl}/api/reservations/${id}`, editData);
        setEditingId(null);
        setEditData({});
        if (propFetch) propFetch();
        else fetchLocal();
      } catch (error) {
        console.error('Error updating reservation:', error);
        setError('Failed to update reservation.');
      } finally {
        setLoading(false);
      }
    },
    [apiUrl, editData, fetchLocal, propFetch]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return <p className="text-gray-500 text-center py-4 animate-fadeIn">Loading...</p>;
  }

  if (displayReservations.length === 0) {
    return <p className="text-gray-500 text-center py-4 animate-fadeIn">No reservations yet. Book one above!</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg shadow-md animate-fadeIn">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4 text-center">{error}</div>
      )}
      <table className="w-full text-sm text-gray-700 hidden md:table">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">No.</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Name ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Time</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Persons</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Purpose</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Room</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Remark</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {displayReservations.map((r, i) => (
            <tr key={r._id || i} className="hover:bg-gray-50 transition-colors duration-200">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.no || i + 1}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {editingId === r._id ? (
                  <input
                    type="date"
                    name="date"
                    value={editData.date}
                    onChange={handleChange}
                    className="w-full p-1 border rounded"
                  />
                ) : (
                  r.date
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {editingId === r._id ? (
                  <input
                    type="text"
                    name="nameId"
                    value={editData.nameId}
                    onChange={handleChange}
                    className="w-full p-1 border rounded"
                  />
                ) : (
                  r.nameId
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {editingId === r._id ? (
                  <>
                    <input
                      type="time"
                      name="timeStart"
                      value={editData.timeStart}
                      onChange={handleChange}
                      className="w-20 p-1 border rounded"
                    /> -{' '}
                    <input
                      type="time"
                      name="timeEnd"
                      value={editData.timeEnd}
                      onChange={handleChange}
                      className="w-20 p-1 border rounded"
                    />
                  </>
                ) : (
                  `${r.timeStart} - ${r.timeEnd}`
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {editingId === r._id ? (
                  <input
                    type="number"
                    name="persons"
                    value={editData.persons}
                    onChange={handleChange}
                    className="w-full p-1 border rounded"
                  />
                ) : (
                  r.persons
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {editingId === r._id ? (
                  <select
                    name="purpose"
                    value={editData.purpose}
                    onChange={handleChange}
                    className="w-full p-1 border rounded"
                  >
                    <option value="Study">Study</option>
                    <option value="Group Project">Group Project</option>
                    <option value="Meeting">Meeting</option>
                  </select>
                ) : (
                  r.purpose
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{r.room}</td>
              <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                {editingId === r._id ? (
                  <input
                    type="text"
                    name="remark"
                    value={editData.remark}
                    onChange={handleChange}
                    className="w-full p-1 border rounded"
                  />
                ) : (
                  r.remark
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {new Date(r.date) < new Date() ? 'Expired' : isEligibleForExtension(r) ? 'Extendable' : 'Active'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {editingId === r._id ? (
                  <button
                    onClick={() => handleSaveEdit(r._id)}
                    className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 mr-2"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    onClick={() => handleEdit(r)}
                    className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 mr-2"
                  >
                    Edit
                  </button>
                )}
                {isEligibleForExtension(r) && !editingId && (
                  <button
                    onClick={() => handleExtend(r)}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-md hover:from-green-600 hover:to-emerald-700"
                  >
                    Extend +2h
                  </button>
                )}
                {!editingId && (
                  <button
                    onClick={() => handleDelete(r._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 ml-2"
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {displayReservations.map((r, i) => (
          <div key={r._id || i} className="bg-white/90 backdrop-blur-md rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-gray-900">Reservation #{r.no || i + 1}</h3>
              <span className="text-sm text-gray-600">
                {new Date(r.date) < new Date() ? 'Expired' : isEligibleForExtension(r) ? 'Extendable' : 'Active'}
              </span>
            </div>
            <p><strong>Date:</strong> {r.date}</p>
            <p><strong>Name ID:</strong> {r.nameId}</p>
            <p><strong>Time:</strong> {`${r.timeStart} - ${r.timeEnd}`}</p>
            <p><strong>Persons:</strong> {r.persons}</p>
            <p><strong>Purpose:</strong> {r.purpose}</p>
            <p><strong>Room:</strong> <span className="text-blue-600">{r.room}</span></p>
            <p><strong>Remark:</strong> {r.remark || 'N/A'}</p>
            <div className="mt-2 flex flex-col space-y-2">
              {editingId === r._id ? (
                <button
                  onClick={() => handleSaveEdit(r._id)}
                  className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600"
                >
                  Save
                </button>
              ) : (
                <button
                  onClick={() => handleEdit(r)}
                  className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600"
                >
                  Edit
                </button>
              )}
              {isEligibleForExtension(r) && !editingId && (
                <button
                  onClick={() => handleExtend(r)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-md hover:from-green-600 hover:to-emerald-700"
                >
                  Extend +2h
                </button>
              )}
              {!editingId && (
                <button
                  onClick={() => handleDelete(r._id)}
                  className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RoomList;