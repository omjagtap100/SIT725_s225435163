const { Decimal128 } = require('mongodb');

const DB_NAME = 'sit725_books';
const COLLECTION_NAME = 'books';


function mapDocToBook(doc) {
  if (!doc) return null;
  return {
    id: doc.id,
    title: doc.title,
    author: doc.author,
    year: doc.year,
    genre: doc.genre,
    summary: doc.summary,
    price: decimal128ToAudString(doc.price)
  };
}

function decimal128ToAudString(value) {
  if (value == null) return null;
  if (value instanceof Decimal128) {
    return value.toString();
  }
  return String(value);
}

module.exports = {
  DB_NAME,
  COLLECTION_NAME,
  mapDocToBook,
  Decimal128
};
