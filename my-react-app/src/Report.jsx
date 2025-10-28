// Report.jsx
import React, { useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function Report() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [reportStartDate, setReportStartDate] = useState(null);
  const [reportEndDate, setReportEndDate] = useState(null);
  const [isSingleDate, setIsSingleDate] = useState(true);
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const today = new Date();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const normalizeDate = (date) => {
    if (!date) return null;
    const normalized = new Date(date);
    normalized.setHours(12, 0, 0, 0);
    return normalized;
  };

  const formatDateForReport = (date) => {
    const d = new Date(date);
    d.setHours(d.getHours() + 3);
    return d.toISOString().split('T')[0];
  };

  const fetchReservations = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${apiUrl}/api/reservations`);
      setReservations(response.data);
    } catch (error) {
      console.error('Error fetching reservations:', error.stack);
      toast.error('Failed to load reservations. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

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
    } else {
      toast.success(`Report generated for ${report.length} day(s)`);
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
    toast.success('CSV downloaded successfully!');
  };

  React.useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  return (
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
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Generate Reservation Report</h2>
              <p className="text-xs text-gray-600 mt-1">Select a date or range to generate a comprehensive report</p>
            </div>
            <div className="flex space-x-2">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Checkbox - Full width on mobile, first column on desktop */}
            <div className="flex items-center space-x-2 md:col-span-1">
              <input
                type="checkbox"
                id="single-date"
                checked={isSingleDate}
                onChange={() => {
                  setIsSingleDate(!isSingleDate);
                  if (!isSingleDate) setReportEndDate(null);
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="single-date" className="text-sm font-medium text-gray-700">Single Date</label>
            </div>
            
            {/* Date pickers - Full width on mobile, span 2 columns on desktop */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    if (isSingleDate) setReportEndDate(normalized);
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
            </div>

            {/* Buttons - Full width on mobile, but positioned properly */}
            <div className="md:col-span-3 flex items-end space-x-3">
              <button
                onClick={generateReport}
                disabled={isLoading}
                className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 text-sm"
              >
                <span>{isLoading ? 'Generating...' : 'Generate Report'}</span>
              </button>
              
              {reportData.length > 0 && (
                <button
                  onClick={downloadCSV}
                  className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-all duration-200 text-sm"
                >
                  <span>Download CSV</span>
                </button>
              )}
            </div>
          </div>

          {reportData.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Report Results</h4>
              <div className="overflow-x-auto">
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
                          {new Date(row.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{row.roomsBooked}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{row.totalPersons}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-700 text-sm">
                  Total: {reportData.length} day(s) | 
                  Total Rooms Booked: {reportData.reduce((sum, row) => sum + row.roomsBooked, 0)} | 
                  Total Users: {reportData.reduce((sum, row) => sum + row.totalPersons, 0)}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer - Exact copy from Home.jsx - Now at the bottom */}
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
  );
}

export default Report;