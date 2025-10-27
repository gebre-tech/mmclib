// Report.jsx
import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function Report() {
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
    <div className="flex flex-col min-h-screen bg-gray-50">
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

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Generate Reservation Report</h1>
            <p className="text-gray-600">Select a date or range to generate a comprehensive report</p>
          </div>

          <section className="bg-white rounded-xl shadow-lg p-6">
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
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Generating...' : 'Generate Report'}
                </button>
                
                {reportData.length > 0 && (
                  <button
                    onClick={downloadCSV}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Download CSV
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
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-700 text-sm">
                    Total: {reportData.length} day(s) | 
                    Total Rooms Booked: {reportData.reduce((sum, row) => sum + row.roomsBooked, 0)} | 
                    Total Users: {reportData.reduce((sum, row) => sum + row.totalPersons, 0)}
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="mt-auto bg-gray-800 text-white py-6">
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

export default Report;