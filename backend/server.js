const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/reservations', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Schema
const reservationSchema = new mongoose.Schema({
  no: { type: Number, default: 0 },
  date: String,
  nameId: String,
  timeStart: String,
  timeEnd: String,
  persons: Number,
  purpose: String,
  room: String,
  remark: String,
  acknowledgeClean: Boolean
});

const Reservation = mongoose.model('Reservation', reservationSchema);

// Routes
app.get('/api/reservations', async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ date: 1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reservations', async (req, res) => {
  try {
    const lastRes = await Reservation.findOne().sort({ no: -1 });
    const newRes = new Reservation({ ...req.body, no: (lastRes?.no || 0) + 1 });
    await newRes.save();
    res.status(201).json(newRes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/reservations/:id', async (req, res) => {
  try {
    const updated = await Reservation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Reservation not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));