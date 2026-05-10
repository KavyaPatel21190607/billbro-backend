const mongoose = require('mongoose');

async function connectDB(uri) {
  const mongoUri = uri || process.env.MONGODB_URI || process.env.MONGO_URI;
  
  if (!mongoUri) {
    throw new Error('MongoDB connection string is missing. Please set MONGODB_URI in your .env file.');
  }

  await mongoose.connect(mongoUri, {
    autoIndex: true,
  });
  return mongoose.connection;
}

module.exports = { connectDB };