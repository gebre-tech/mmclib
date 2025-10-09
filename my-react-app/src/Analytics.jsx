import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function Analytics() {
  const [utilizationData, setUtilizationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const utilizationResponse = await axios.get(`${apiUrl}/api/analytics/utilization?days=${timeRange}`);
      setUtilizationData(utilizationResponse.data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, timeRange]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const processRoomData = () => {
    const roomData = {};
    utilizationData.forEach(item => {
      if (!roomData[item.room]) {
        roomData[item.room] = { room: `Room ${item.room}`, bookings: 0 };
      }
      roomData[item.room].bookings += parseInt(item.bookings);
    });
    return Object.values(roomData);
  };

  const processDailyData = () => {
    const dailyData = {};
    utilizationData.forEach(item => {
      if (!dailyData[item.date]) {
        dailyData[item.date] = { date: item.date, bookings: 0 };
      }
      dailyData[item.date].bookings += parseInt(item.bookings);
    });
    return Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const roomColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/mmclogo.jpg" alt="MMC Logo" className="h-8 w-auto object-contain" />
              <h1 className="text-lg font-bold text-blue-800">MMC EUNPA Library - Analytics</h1>
            </Link>
            <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium">← Back to Home</Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Library Analytics</h1>
              <p className="text-gray-600">Room utilization and booking patterns</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
              
              <button
                onClick={fetchAnalyticsData}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Room Utilization Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Room Utilization (Last {timeRange} Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={processRoomData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="room" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="bookings" name="Number of Bookings" radius={[4, 4, 0, 0]}>
                      {processRoomData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={roomColors[index % roomColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Room Distribution Pie Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Room Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={processRoomData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ room, bookings }) => `${room}: ${bookings}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="bookings"
                    >
                      {processRoomData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={roomColors[index % roomColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Quick Insights */}
              <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Insights</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Most Popular Room</h4>
                    <p className="text-2xl font-bold text-blue-700">
                      {utilizationData.length > 0 
                        ? `Room ${processRoomData().reduce((prev, current) => 
                            prev.bookings > current.bookings ? prev : current).room}`
                        : 'N/A'
                      }
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Total Bookings</h4>
                    <p className="text-2xl font-bold text-green-700">
                      {utilizationData.reduce((sum, item) => sum + parseInt(item.bookings), 0)}
                    </p>
                    <p className="text-sm text-green-600">in last {timeRange} days</p>
                  </div>
                  
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-semibold text-orange-900 mb-2">Average Daily</h4>
                    <p className="text-2xl font-bold text-orange-700">
                      {(utilizationData.reduce((sum, item) => sum + parseInt(item.bookings), 0) / timeRange).toFixed(1)}
                    </p>
                    <p className="text-sm text-orange-600">bookings per day</p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">Utilization Rate</h4>
                    <p className="text-2xl font-bold text-purple-700">
                      {((utilizationData.reduce((sum, item) => sum + parseInt(item.bookings), 0) / (4 * timeRange)) * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-purple-600">room capacity used</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">MMC EUNPA Library &copy; {new Date().getFullYear()}</p>
          <div className="mt-2 flex justify-center space-x-4 text-sm">
            <Link to="/about" className="text-gray-400 hover:text-white">About</Link>
            <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white">Terms of Use</a>
            <a href="#" className="text-gray-400 hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Analytics;