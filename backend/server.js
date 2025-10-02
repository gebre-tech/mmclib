const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL Connection
const pool = new Pool({
  connectionString: process.env.PG_URI || 'postgres://postgres:2794@localhost:5432/reservations',
});

async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        "_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "no" INTEGER,
        "date" TEXT,
        "name" TEXT,
        "id" TEXT,
        "nameId" TEXT,
        "timeStart" TEXT,
        "timeEnd" TEXT,
        "persons" INTEGER,
        "purpose" TEXT,
        "room" TEXT,
        "remark" TEXT,
        "acknowledgeClean" BOOLEAN
      )
    `);
    console.log('PostgreSQL table ready');
  } catch (err) {
    console.error('PostgreSQL init error:', err);
  }
}

initDb();

// Routes
app.get('/api/reservations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reservations ORDER BY "date" ASC, "timeStart" ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reservations', async (req, res) => {
  try {
    const lastRes = await pool.query('SELECT "no" FROM reservations ORDER BY "no" DESC LIMIT 1');
    const newNo = (lastRes.rows[0]?.no || 0) + 1;
    const { date, name, id, nameId, timeStart, timeEnd, persons, purpose, room, remark, acknowledgeClean } = req.body;
    
    // Use provided nameId or create from name and id
    const finalNameId = nameId || `${name}-${id}`;
    
    const result = await pool.query(
      `INSERT INTO reservations ("no", "date", "name", "id", "nameId", "timeStart", "timeEnd", "persons", "purpose", "room", "remark", "acknowledgeClean")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [newNo, date, name, id, finalNameId, timeStart, timeEnd, persons, purpose, room, remark, acknowledgeClean]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/reservations/:id', async (req, res) => {
  try {
    const fields = Object.keys(req.body).map((key, i) => `"${key}" = $${i + 1}`).join(', ');
    const values = Object.values(req.body);
    values.push(req.params.id);
    const result = await pool.query(
      `UPDATE reservations SET ${fields} WHERE "_id" = $${values.length} RETURNING *`,
      values
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Reservation not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/reservations/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM reservations WHERE "_id" = $1 RETURNING *', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Reservation not found' });
    res.json({ message: 'Reservation deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
