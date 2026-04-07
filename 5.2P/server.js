const express = require('express');
const path = require('path');

const app = express();
const port = process.env.port || 3000;

const booksRoute = require('./routes/books.routes');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/books', booksRoute);

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
