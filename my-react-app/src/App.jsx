import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import RoomList from './RoomList';
import ReservationForm from './Form';
import ToggleStatus from './ToggleStatus';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rooms" element={<RoomList />} />
        <Route path="/reserve" element={<ReservationForm />} />
        <Route path="/toggle" element={<ToggleStatus />} />
      </Routes>
    </BrowserRouter>
  );
}