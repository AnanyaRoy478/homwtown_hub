require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const app = require('./app');
const connectDB = require('./config/db');

const required = ['MONGO_URI', 'JWT_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(', ')}. Copy server/.env.example to server/.env`);
  process.exit(1);
}

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('Failed to start:', err.message);
    process.exit(1);
  });
