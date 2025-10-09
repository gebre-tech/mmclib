const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Prevent caching
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// MongoDB Connection
const mongoUri = process.env.MONGO_URI;
const dbName = 'library_reservations';
let db;

// Initialize MongoDB connection
async function initDb() {
  try {
    const client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db(dbName);
    
    // Create collections and indexes
    await db.collection('reservations').createIndex({ date: 1, room: 1 });
    await db.collection('reservations').createIndex({ date: 1, timeStart: 1 });
    await db.collection('reservations').createIndex({ id: 1, date: 1 });
    
    console.log('MongoDB connection successful and indexes created');
  } catch (err) {
    console.error('MongoDB initialization error:', err.stack);
    throw err;
  }
}

// Initialize database
(async () => {
  try {
    await initDb();
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.stack);
    process.exit(1);
  }
})();

// Validate library hours and rules
const validateReservation = (data, isUpdate = false) => {
  console.log('Validating reservation data:', data);
  
  const { date, timeStart, timeEnd, persons, acknowledgeClean, room, name, id } = data;
  
  // Validate required fields first
  if (!date || !timeStart || !timeEnd || !persons || !name || !id || !room) {
    return { valid: false, error: 'All required fields must be filled: Name, ID, Date, Time, Persons, and Room.' };
  }

  // Validate date format and create Date object
  let selectedDate;
  try {
    selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      return { valid: false, error: 'Invalid date format.' };
    }
  } catch (err) {
    return { valid: false, error: 'Invalid date format.' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);
  const day = selectedDate.getDay();

  // No bookings on Sunday
  if (day === 0) {
    return { valid: false, error: 'Reservations are not allowed on Sundays.' };
  }

  // Advance booking for future dates
  if (!isUpdate && selectedDate > today) {
    const diffDays = (selectedDate - today) / (1000 * 60 * 60 * 24);
    if (diffDays < 1) {
      return { valid: false, error: 'Future reservations must be booked at least 1 day in advance.' };
    }
  }

  // Date must be today or later
  if (selectedDate < today) {
    return { valid: false, error: 'Reservations must be for today or a later date.' };
  }

  // Minimum 2 persons
  if (persons < 2) {
    return { valid: false, error: 'Minimum 2 persons required per reservation rule.' };
  }

  // Cleanliness acknowledgment
  if (!acknowledgeClean) {
    return { valid: false, error: 'Must acknowledge keeping the room clean and tidy.' };
  }

  // Validate time format
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(timeStart) || !timeRegex.test(timeEnd)) {
    return { valid: false, error: 'Invalid time format. Use HH:MM (24-hour format).' };
  }

  // Validate time within library hours
  const [startHours, startMinutes] = timeStart.split(':').map(Number);
  const [endHours, endMinutes] = timeEnd.split(':').map(Number);
  
  if (day === 6) {
    // Saturday: 2:00 AM - 5:00 PM
    if (startHours < 2 || (startHours === 17 && startMinutes > 0) || endHours > 17 || (endHours === 17 && endMinutes > 0)) {
      return { valid: false, error: 'Reservations on Saturday must be within 2:00 AM - 5:00 PM.' };
    }
  } else {
    // Mon-Fri: 8:00 AM - 11:00 PM
    if (startHours < 8 || (startHours === 23 && startMinutes > 0) || endHours > 23 || (endHours === 23 && endMinutes > 0)) {
      return { valid: false, error: 'Reservations on weekdays must be within 8:00 AM - 11:00 PM.' };
    }
  }

  // Maximum 2 hours duration
  const startTime = new Date(`${date}T${timeStart}:00`).getTime();
  const endTime = new Date(`${date}T${timeEnd}:00`).getTime();
  
  if (endTime <= startTime) {
    return { valid: false, error: 'End time must be after start time.' };
  }
  
  const durationHours = (endTime - startTime) / (1000 * 60 * 60);
  if (durationHours > 2) {
    return { valid: false, error: 'Maximum 2 hours per slot allowed.' };
  }

  return { valid: true };
};

// Check for time conflicts in MongoDB
const checkTimeConflict = async (room, date, timeStart, timeEnd, excludeId = null) => {
  try {
    const query = {
      room: room,
      date: date,
      $or: [
        { 
          $and: [
            { timeStart: { $lte: timeStart } },
            { timeEnd: { $gt: timeStart } }
          ]
        },
        { 
          $and: [
            { timeStart: { $lt: timeEnd } },
            { timeEnd: { $gte: timeEnd } }
          ]
        },
        { 
          $and: [
            { timeStart: { $gte: timeStart } },
            { timeEnd: { $lte: timeEnd } }
          ]
        }
      ]
    };

    if (excludeId) {
      query._id = { $ne: new ObjectId(excludeId) };
    }

    const conflict = await db.collection('reservations').findOne(query);
    return conflict !== null;
  } catch (error) {
    console.error('Error checking time conflict:', error);
    throw error;
  }
};

// Check for user time conflicts across all rooms
const checkUserTimeConflict = async (userId, date, timeStart, timeEnd, excludeId = null) => {
  try {
    const query = {
      id: userId,
      date: date,
      $or: [
        { 
          $and: [
            { timeStart: { $lte: timeStart } },
            { timeEnd: { $gt: timeStart } }
          ]
        },
        { 
          $and: [
            { timeStart: { $lt: timeEnd } },
            { timeEnd: { $gte: timeEnd } }
          ]
        },
        { 
          $and: [
            { timeStart: { $gte: timeStart } },
            { timeEnd: { $lte: timeEnd } }
          ]
        }
      ]
    };

    if (excludeId) {
      query._id = { $ne: new ObjectId(excludeId) };
    }

    const conflict = await db.collection('reservations').findOne(query);
    return conflict !== null;
  } catch (error) {
    console.error('Error checking user time conflict:', error);
    throw error;
  }
};

// Routes
app.get('/api/reservations', async (req, res) => {
  try {
    const { date, room } = req.query;
    let query = {};
    
    if (date && room) {
      query = { date, room };
    } else if (date) {
      query = { date };
    } else if (room) {
      query = { room };
    }

    const result = await db.collection('reservations')
      .find(query)
      .sort({ date: 1, timeStart: 1 })
      .toArray();
    
    res.json(result);
  } catch (err) {
    console.error('GET /api/reservations error:', err.stack);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

// Get dashboard statistics
app.get('/api/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const totalReservations = await db.collection('reservations').countDocuments();
    const todayReservations = await db.collection('reservations').countDocuments({ date: today });
    const upcomingBookings = await db.collection('reservations').countDocuments({ 
      date: { $gt: today } 
    });
    
    res.json({
      totalReservations: totalReservations,
      todayReservations: todayReservations,
      upcomingBookings: upcomingBookings,
      availableRooms: 4 - todayReservations
    });
  } catch (err) {
    console.error('GET /api/stats error:', err.stack);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get room utilization
app.get('/api/analytics/utilization', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    const startDateStr = startDate.toISOString().split('T')[0];

    const result = await db.collection('reservations')
      .aggregate([
        {
          $match: {
            date: { $gte: startDateStr }
          }
        },
        {
          $group: {
            _id: {
              date: "$date",
              room: "$room"
            },
            bookings: { $sum: 1 }
          }
        },
        {
          $project: {
            date: "$_id.date",
            room: "$_id.room",
            bookings: 1,
            _id: 0
          }
        },
        {
          $sort: { date: -1 }
        }
      ])
      .toArray();

    res.json(result);
  } catch (err) {
    console.error('GET /api/analytics/utilization error:', err.stack);
    res.status(500).json({ error: 'Failed to fetch utilization data' });
  }
});

// Search reservations
app.get('/api/reservations/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const result = await db.collection('reservations')
      .find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { id: { $regex: query, $options: 'i' } },
          { purpose: { $regex: query, $options: 'i' } },
          { room: { $regex: query, $options: 'i' } }
        ]
      })
      .sort({ date: -1, timeStart: -1 })
      .toArray();

    res.json(result);
  } catch (err) {
    console.error('GET /api/reservations/search error:', err.stack);
    res.status(500).json({ error: 'Failed to search reservations' });
  }
});

app.post('/api/reservations', async (req, res) => {
  try {
    const validation = validateReservation(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { date, name, id, timeStart, timeEnd, persons, purpose, room, remark, acknowledgeClean } = req.body;

    // Check for time slot conflicts in the selected room
    const roomConflict = await checkTimeConflict(room, date, timeStart, timeEnd);
    if (roomConflict) {
      return res.status(409).json({ error: 'The selected time slot is already booked in this room.' });
    }

    // Check if user already has a reservation in any room for the same time slot
    const userConflict = await checkUserTimeConflict(id, date, timeStart, timeEnd);
    if (userConflict) {
      return res.status(409).json({ error: 'You already have a reservation in another room for this time slot.' });
    }

    // Get the last reservation number
    const lastRes = await db.collection('reservations')
      .find()
      .sort({ no: -1 })
      .limit(1)
      .toArray();
    
    const newNo = (lastRes[0]?.no || 0) + 1;

    const reservation = {
      no: newNo,
      date,
      name,
      id,
      timeStart,
      timeEnd,
      persons,
      purpose,
      room,
      remark,
      acknowledgeClean,
      createdAt: new Date()
    };

    const result = await db.collection('reservations').insertOne(reservation);
    reservation._id = result.insertedId;

    res.json(reservation);
  } catch (err) {
    console.error('POST /api/reservations error:', err.stack);
    res.status(500).json({ error: 'Failed to create reservation' });
  }
});

app.put('/api/reservations/:id', async (req, res) => {
  try {
    const reservationId = req.params.id;
    const currentRes = await db.collection('reservations').findOne({ _id: new ObjectId(reservationId) });
    
    if (!currentRes) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const validation = validateReservation(req.body, true);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { room, date, timeStart, timeEnd, id } = req.body;

    // Check for time slot conflicts in the selected room (excluding current reservation)
    const roomConflict = await checkTimeConflict(room, date, timeStart, timeEnd, reservationId);
    if (roomConflict) {
      return res.status(409).json({ error: 'The selected time slot is already booked in this room.' });
    }

    // Check if user already has another reservation in any room for the same time slot
    const userConflict = await checkUserTimeConflict(id, date, timeStart, timeEnd, reservationId);
    if (userConflict) {
      return res.status(409).json({ error: 'You already have another reservation for this time slot.' });
    }

    const updateData = { ...req.body };
    delete updateData._id; // Remove _id from update data

    const result = await db.collection('reservations').findOneAndUpdate(
      { _id: new ObjectId(reservationId) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    res.json(result.value);
  } catch (err) {
    console.error('PUT /api/reservations/:id error:', err.stack);
    res.status(500).json({ error: 'Failed to update reservation' });
  }
});

// Extend reservation endpoint
app.put('/api/reservations/:id/extend', async (req, res) => {
  try {
    const reservationId = req.params.id;
    const { extendBy = 2 } = req.body; // Extend by 2 hours by default

    // Get current reservation
    const reservation = await db.collection('reservations').findOne({ _id: new ObjectId(reservationId) });
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const now = new Date();
    const currentEnd = new Date(`${reservation.date}T${reservation.timeEnd}:00`);

    // Check if reservation has expired or current time has reached the end time
    if (now < currentEnd) {
      return res.status(400).json({ error: 'Cannot extend reservation until the current time has reached the end time.' });
    }

    // Calculate new end time
    const newEndTime = new Date(currentEnd.getTime() + extendBy * 60 * 60 * 1000);
    
    // Check library closing time
    const date = new Date(reservation.date);
    const day = date.getDay();
    const maxEndHour = day === 6 ? 17 : 23; // Sat: 5 PM, Weekdays: 11 PM
    const maxEndTime = new Date(`${reservation.date}T${maxEndHour.toString().padStart(2, '0')}:00:00`);

    if (newEndTime > maxEndTime) {
      return res.status(400).json({ 
        error: `Cannot extend beyond library closing time (${maxEndHour}:00).` 
      });
    }

    const newEndTimeStr = newEndTime.toTimeString().slice(0, 5);

    // Check for conflicts with the extended time
    const conflict = await checkTimeConflict(
      reservation.room, 
      reservation.date, 
      reservation.timeEnd, 
      newEndTimeStr, 
      reservationId
    );

    if (conflict) {
      return res.status(409).json({ error: 'Extension conflicts with another reservation.' });
    }

    // Update the reservation
    const result = await db.collection('reservations').findOneAndUpdate(
      { _id: new ObjectId(reservationId) },
      { $set: { timeEnd: newEndTimeStr } },
      { returnDocument: 'after' }
    );

    res.json(result.value);
  } catch (err) {
    console.error('PUT /api/reservations/:id/extend error:', err.stack);
    res.status(500).json({ error: 'Failed to extend reservation' });
  }
});

app.delete('/api/reservations/:id', async (req, res) => {
  try {
    const result = await db.collection('reservations').findOneAndDelete({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (!result.value) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    res.json({ message: 'Reservation deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/reservations/:id error:', err.stack);
    res.status(500).json({ error: 'Failed to delete reservation' });
  }
});

// ToggleStatus endpoint
app.put('/api/rooms/:room/status', async (req, res) => {
  try {
    const { room } = req.params;
    const { date, status } = req.body;

    if (status === 'Booked') {
      const adminReservation = {
        no: 0,
        date,
        name: 'Admin',
        id: 'ADMIN',
        timeStart: new Date(date).getDay() === 6 ? '02:00' : '08:00',
        timeEnd: new Date(date).getDay() === 6 ? '17:00' : '23:00',
        persons: 2,
        purpose: 'Status Toggle',
        room,
        remark: 'Room status set to Booked',
        acknowledgeClean: true,
        createdAt: new Date()
      };

      await db.collection('reservations').insertOne(adminReservation);
    } else {
      await db.collection('reservations').deleteMany({
        room,
        date,
        name: 'Admin',
        purpose: 'Status Toggle'
      });
    }

    res.json({ message: `Room ${room} status updated to ${status}` });
  } catch (err) {
    console.error('PUT /api/rooms/:room/status error:', err.stack);
    res.status(500).json({ error: 'Failed to update room status' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));