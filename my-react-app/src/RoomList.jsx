import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Tooltip } from 'react-tooltip';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ErrorBoundary from './ErrorBoundary';
import ToggleStatus from './ToggleStatus';

function RoomList() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reportStartDate, setReportStartDate] = useState(null);
  const [reportEndDate, setReportEndDate] = useState(null);
  const [isSingleDate, setIsSingleDate] = useState(true);
  const [reportData, setReportData] = useState([]);
  const [showReportView, setShowReportView] = useState(false); // Toggle between views
  const today = new Date();
  today.setHours(today.getHours() + 3); // Adjust to EAT (UTC+3)
  const todayStr = today.toISOString().split('T')[0];
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const isAdmin = true;

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const adjustedHours = hours % 12 || 12;
    return `${adjustedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const normalizeDate = (date) => {
    if (!date) return null;
    const normalized = new Date(date);
    normalized.setHours(12, 0, 0, 0); // Set to noon to avoid timezone shifts
    return normalized;
  };

  const formatDateForReport = (date) => {
    const d = new Date(date);
    d.setHours(d.getHours() + 3); // Adjust to EAT
    return d.toISOString().split('T')[0];
  };

  const fetchReservations = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${apiUrl}/api/reservations`);
      setReservations(response.data);
      setFilteredReservations(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching reservations:', error.stack);
      setError('Failed to load reservations. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchReservations();
    const interval = setInterval(fetchReservations, 30000);
    return () => clearInterval(interval);
  }, [fetchReservations]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = reservations.filter(reservation =>
        reservation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reservation.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reservation.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reservation.room.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredReservations(filtered);
    } else {
      setFilteredReservations(reservations);
    }
  }, [searchQuery, reservations]);

  const canExtendReservation = (reservation) => {
    const now = new Date();
    now.setHours(now.getHours() + 3); // Adjust to EAT
    const reservationEnd = new Date(`${reservation.date}T${reservation.timeEnd}:00`);
    return now >= reservationEnd;
  };

  const handleExtend = async (reservation) => {
    try {
      if (!canExtendReservation(reservation)) {
        toast.error('Can only extend reservation after the current end time has been reached.');
        return;
      }

      const extendBy = 2; // Extend by 2 hours
      const response = await axios.put(`${apiUrl}/api/reservations/${reservation._id}/extend`, {
        extendBy
      });

      setReservations(prev => prev.map(r => (r._id === reservation._id ? response.data : r)));
      toast.success(`Reservation extended by ${extendBy} hours successfully!`);
    } catch (error) {
      console.error('Error extending reservation:', error.stack);
      if (error.response?.status === 409) {
        toast.error(error.response.data.error);
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to extend reservation. Please try again.');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reservation?')) {
      return;
    }

    try {
      await axios.delete(`${apiUrl}/api/reservations/${id}`);
      setReservations(prev => prev.filter(r => r._id !== id));
      toast.success('Reservation deleted successfully!');
    } catch (error) {
      console.error('Error deleting reservation:', error.stack);
      toast.error('Failed to delete reservation. Please try again.');
    }
  };

  const generateReport = useCallback(() => {
    if (!reportStartDate) {
      toast.error('Please select a date for the report.');
      return;
    }

    if (!isSingleDate && !reportEndDate) {
      toast.error('Please select an end date for the report range.');
      return;
    }

    if (!isSingleDate && reportEndDate < reportStartDate) {
      toast.error('End date cannot be earlier than start date.');
      return;
    }

    const start = normalizeDate(reportStartDate);
    const end = isSingleDate ? normalizeDate(reportStartDate) : normalizeDate(reportEndDate);
    const report = [];

    // Generate date range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = formatDateForReport(d);
      const dayReservations = reservations.filter(r => r.date === dateStr);
      const uniqueRooms = [...new Set(dayReservations.map(r => r.room))].length;
      const totalPersons = dayReservations.reduce((sum, r) => sum + (r.persons || 0), 0);

      report.push({
        date: dateStr,
        roomsBooked: uniqueRooms,
        totalPersons: totalPersons
      });
    }

    setReportData(report);

    if (report.length === 0) {
      toast.info('No reservations found for the selected date(s).');
    }
  }, [reportStartDate, reportEndDate, isSingleDate, reservations]);

  const downloadCSV = () => {
    if (reportData.length === 0) {
      toast.error('No report data to download.');
      return;
    }

    const headers = ['Date', 'Number of Rooms Booked', 'Total Number of Users'];
    const csvRows = [
      headers.join(','),
      ...reportData.map(row =>
        `"${new Date(row.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}",${row.roomsBooked},${row.totalPersons}`
      )
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const fileName = isSingleDate
      ? `reservations_report_${formatDateForReport(reportStartDate)}.csv`
      : `reservations_report_${formatDateForReport(reportStartDate)}_to_${formatDateForReport(reportEndDate)}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex flex-col">
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

        <main className="flex-1 container mx-auto px-3 py-4">
          <section className="mb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                  {showReportView ? 'Generate Reservation Report' : 'Room Reservations'}
                </h2>
                <p className="text-xs text-gray-600 mt-1">
                  {showReportView ? 'Select a date or range to generate a report' : 'Manage and view all reservations'}
                </p>
              </div>
              <div className="flex space-x-2">
                {showReportView ? (
                  <button
                    onClick={() => setShowReportView(false)}
                    className="flex items-center space-x-1 px-2 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-all duration-200 text-xs"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Back to Reservations</span>
                  </button>
                ) : (
                  <>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search reservations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-48 text-xs"
                      />
                      <svg className="w-3 h-3 text-gray-400 absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <button
                      onClick={() => setShowReportView(true)}
                      className="flex items-center space-x-1 px-2 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all duration-200 text-xs"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6m12 0v-6a2 2 0 00-2-2h-2a2 2 0 00-2 2v6m6 0V7a2 2 0 012-2h2a2 2 0 012 2v10" />
                      </svg>
                      <span>Generate Report</span>
                    </button>
                    <Link
                      to="/analytics"
                      className="flex items-center space-x-1 px-2 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition-all duration-200 text-xs"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>Analytics</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </section>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            {showReportView ? (
              <div>
                <div className="flex flex-col sm:flex-row gap-4 mb-4 items-center">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="single-date"
                      checked={isSingleDate}
                      onChange={() => {
                        setIsSingleDate(!isSingleDate);
                        if (!isSingleDate) setReportEndDate(null); // Clear end date when switching to single date
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="single-date" className="text-sm font-medium text-gray-700">Single Date</label>
                  </div>
                  <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
                      {isSingleDate ? 'Date' : 'From Date'}
                    </label>
                    <DatePicker
                      id="start-date"
                      selected={reportStartDate}
                      onChange={(date) => {
                        const normalized = normalizeDate(date);
                        setReportStartDate(normalized);
                        if (isSingleDate) setReportEndDate(normalized); // Sync end date for single date
                      }}
                      dateFormat="MMM d, yyyy"
                      maxDate={today}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholderText="Select date"
                    />
                  </div>
                  {!isSingleDate && (
                    <div>
                      <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                      <DatePicker
                        id="end-date"
                        selected={reportEndDate}
                        onChange={(date) => setReportEndDate(normalizeDate(date))}
                        dateFormat="MMM d, yyyy"
                        minDate={reportStartDate}
                        maxDate={today}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholderText="Select end date"
                      />
                    </div>
                  )}
                  <div className="flex items-end">
                    <button
                      onClick={generateReport}
                      className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all duration-200 text-sm"
                    >
                      <span>Generate Report</span>
                    </button>
                  </div>
                  {reportData.length > 0 && (
                    <div className="flex items-end">
                      <button
                        onClick={downloadCSV}
                        className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-all duration-200 text-sm"
                      >
                        <span>Download CSV</span>
                      </button>
                    </div>
                  )}
                </div>

                {reportData.length > 0 && (
                  <div className="overflow-x-auto">
                    <h4 className="text-md font-semibold text-gray-900 mb-2">Report Results</h4>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rooms Booked</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Users</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                              {new Date(row.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{row.roomsBooked}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{row.totalPersons}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {isAdmin && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Today's Room Status (Admin)</h4>
                    <div className="grid gap-4">
                      {['1', '2', '3', '4'].map(room => (
                        <ToggleStatus key={room} room={room} date={todayStr} isAdmin={isAdmin} apiUrl={apiUrl} />
                      ))}
                    </div>
                  </div>
                )}

                {searchQuery && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-blue-700 text-sm">
                      Showing {filteredReservations.length} result{filteredReservations.length !== 1 ? 's' : ''} for "{searchQuery}"
                    </p>
                  </div>
                )}

                {error ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Error</h3>
                    <p className="mt-2 text-gray-600">{error}</p>
                    <button
                      onClick={fetchReservations}
                      className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                ) : isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading reservations...</p>
                  </div>
                ) : filteredReservations.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        All Reservations ({filteredReservations.length})
                      </h3>
                      <div className="text-sm text-gray-600">
                        Showing {filteredReservations.length} reservation{filteredReservations.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reserved By</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Persons</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remark</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredReservations.map(r => (
                            <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{r.room}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                {new Date(r.date).toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                                {r.date === todayStr && (
                                  <span className="ml-2 inline-flex px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">Today</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                {formatTime(r.timeStart)} - {formatTime(r.timeEnd)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{r.name}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{r.id}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{r.persons}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{r.purpose}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{r.remark || '-'}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span
                                  className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                    canExtendReservation(r) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {canExtendReservation(r) ? 'Eligible for Extension' : 'Cannot Extend Yet'}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleExtend(r)}
                                    disabled={!canExtendReservation(r)}
                                    className={`p-2 rounded-md transition-colors ${
                                      canExtendReservation(r)
                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                    data-tooltip-id={`extend-${r._id}`}
                                    data-tooltip-content={
                                      canExtendReservation(r) ? 'Extend by 2 hours' : 'Can only extend after current end time'
                                    }
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDelete(r._id)}
                                    className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                                    data-tooltip-id={`delete-${r._id}`}
                                    data-tooltip-content="Delete reservation"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                  <Tooltip id={`extend-${r._id}`} />
                                  <Tooltip id={`delete-${r._id}`} />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c2.219 0 4-1.781 4-4s-1.781-4-4-4-4 1.781-4 4 1.781 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      {searchQuery ? 'No matching reservations' : 'No Reservations Found'}
                    </h3>
                    <p className="mt-2 text-gray-600">
                      {searchQuery 
                        ? `No reservations found matching "${searchQuery}"`
                        : 'No reservations have been made yet. Be the first to book a room!'
                      }
                    </p>
                    {!searchQuery && (
                      <Link to="/reserve" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                        Book a Room
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Footer - Exact copy from Home.jsx */}
        <footer className="bg-blue-50 border-t border-blue-100 py-3 mt-auto">
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
    </ErrorBoundary>
  );
}

export default RoomList;