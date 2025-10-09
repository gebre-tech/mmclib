import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import RoomList from './RoomList';
import ReservationForm from './ReservationForm';
import Availability from './Availability';
import Analytics from './Analytics';
import About from './About';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rooms" element={<RoomList />} />
        <Route path="/availability" element={<Availability />} />
        <Route path="/reserve" element={<ReservationForm />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Router>
  );
}

export default App;