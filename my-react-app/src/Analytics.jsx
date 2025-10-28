import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function Analytics() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Library Analytics</h2>
              <p className="text-xs text-gray-600 mt-1">Room utilization and booking patterns</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={fetchAnalyticsData}
                disabled={loading}
                className="flex items-center space-x-1 px-2 py-1.5 bg-white text-gray-700 rounded border border-gray-200 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 text-xs"
              >
                <svg className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
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
        </section>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Room Utilization Chart */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Room Utilization (Last {timeRange} Days)</h3>
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
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Room Distribution</h3>
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
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 lg:col-span-2">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Insights</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-1 text-xs">Most Popular Room</h4>
                    <p className="text-lg font-bold text-blue-700">
                      {utilizationData.length > 0 
                        ? `Room ${processRoomData().reduce((prev, current) => 
                            prev.bookings > current.bookings ? prev : current).room}`
                        : 'N/A'
                      }
                    </p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-1 text-xs">Total Bookings</h4>
                    <p className="text-lg font-bold text-green-700">
                      {utilizationData.reduce((sum, item) => sum + parseInt(item.bookings), 0)}
                    </p>
                    <p className="text-xs text-green-600">in last {timeRange} days</p>
                  </div>
                  
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-orange-900 mb-1 text-xs">Average Daily</h4>
                    <p className="text-lg font-bold text-orange-700">
                      {(utilizationData.reduce((sum, item) => sum + parseInt(item.bookings), 0) / timeRange).toFixed(1)}
                    </p>
                    <p className="text-xs text-orange-600">bookings per day</p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-1 text-xs">Utilization Rate</h4>
                    <p className="text-lg font-bold text-purple-700">
                      {((utilizationData.reduce((sum, item) => sum + parseInt(item.bookings), 0) / (4 * timeRange)) * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-purple-600">room capacity used</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
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

export default Analytics;