const express = require('express');
const router = express.Router();
const pool = require('../Connection');

router.post('/users', async (req, res) => {
  const { user_str_id, display_name } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO users (user_str_id, display_name) VALUES ($1, $2) RETURNING *',
      [user_str_id, display_name]
    );
    res.json({ ...result.rows[0], status: 'created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/connections', async (req, res) => {
  const { user1_str_id, user2_str_id } = req.body;
  const [u1, u2] = [user1_str_id, user2_str_id].sort();
  try {
    const [user1, user2] = await Promise.all([
      pool.query('SELECT id FROM users WHERE user_str_id = $1', [u1]),
      pool.query('SELECT id FROM users WHERE user_str_id = $1', [u2])
    ]);

    if (!user1.rowCount || !user2.rowCount) return res.status(404).json({ error: 'User not found' });

    const exists = await pool.query(
      'SELECT 1 FROM connections WHERE user1_id = $1 AND user2_id = $2',
      [user1.rows[0].id, user2.rows[0].id]
    );
    if (exists.rowCount) return res.status(409).json({ error: 'Connection already exists' });

    await pool.query(
      'INSERT INTO connections (user1_id, user2_id) VALUES ($1, $2)',
      [user1.rows[0].id, user2.rows[0].id]
    );
    res.json({ status: 'connection_added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/users/:user_str_id/friends', async (req, res) => {
  const { user_str_id } = req.params;
  try {
    const user = await pool.query('SELECT id FROM users WHERE user_str_id = $1', [user_str_id]);
    if (!user.rowCount) return res.status(404).json({ error: 'User not found' });

    const userId = user.rows[0].id;
    const result = await pool.query(`
      SELECT u.user_str_id, u.display_name FROM users u
      JOIN connections c ON (u.id = c.user1_id OR u.id = c.user2_id)
      WHERE (c.user1_id = $1 OR c.user2_id = $1) AND u.id != $1
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/connections', async (req, res) => {
  const { user1_str_id, user2_str_id } = req.body;
  const [u1, u2] = [user1_str_id, user2_str_id].sort();
  try {
    const [user1, user2] = await Promise.all([
      pool.query('SELECT id FROM users WHERE user_str_id = $1', [u1]),
      pool.query('SELECT id FROM users WHERE user_str_id = $1', [u2])
    ]);
    if (!user1.rowCount || !user2.rowCount) return res.status(404).json({ error: 'User not found' });

    await pool.query('DELETE FROM connections WHERE user1_id = $1 AND user2_id = $2', [
      user1.rows[0].id,
      user2.rows[0].id
    ]);
    res.json({ status: 'connection_removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;