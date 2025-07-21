const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const pool = require('./Connection');
const userRoutes = require('./Routes/UserRoutes');
const app = express();
const PORT = process.env.PORT || 8000;
app.use(cors());
app.use(express.json());
pool.connect();

pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
  } else {
    console.log('Database connected successfully at:', result.rows[0].now);
  }
});

app.use('/api',userRoutes);

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})