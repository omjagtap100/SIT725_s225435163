const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const { DB_NAME } = require('./models/book.model');
const booksRoute = require('./routes/books.routes');

const app = express();
const port = process.env.port || 3000;

const uri =
  'mongodb+srv://omjagtap3304_db_user:bu24sMMXlXo5jO8G@cluster0.zyrfzy8.mongodb.net/';

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api', booksRoute);

app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(500)
    .json({ developedBy: 's225435163', message: 'Server error' });
});

async function run() {
  await mongoose.connect(uri, { dbName: DB_NAME });
  console.log(`Connected to MongoDB (Mongoose, ${DB_NAME})`);

  app.listen(port, () => {
    console.log(`App listening on http://localhost:${port}`);
  });
}

run().catch((ex) => {
  console.error('MongoDB connection failed:', ex);
  process.exit(1);
});
