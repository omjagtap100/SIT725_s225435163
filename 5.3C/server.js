const express = require('express');
const path = require('path');
const { MongoClient, ServerApiVersion } = require('mongodb');

const { DB_NAME, COLLECTION_NAME } = require('./models/book.model');
const booksService = require('./services/books.service');
const booksRoute = require('./routes/books.routes');

const app = express();
const port = process.env.port || 3000;


const uri =
  'mongodb+srv://omjagtap3304_db_user:bu24sMMXlXo5jO8G@cluster0.zyrfzy8.mongodb.net/';

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api', booksRoute);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

async function run() {
  await client.connect();
  const coll = client.db(DB_NAME).collection(COLLECTION_NAME);
  booksService.setBooksCollection(coll);
  console.log(`Connected to MongoDB (${DB_NAME}.${COLLECTION_NAME})`);

  app.listen(port, () => {
    console.log(`App listening on http://localhost:${port}`);
  });
}

run().catch((ex) => {
  console.error('MongoDB connection failed:', ex);
  process.exit(1);
});
