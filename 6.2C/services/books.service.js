const { mapDocToBook } = require('../models/book.model');

let collection = null;

function setBooksCollection(coll) {
  collection = coll;
}

function requireCollection() {
  if (!collection) {
    throw new Error('Books collection is not initialised');
  }
  return collection;
}

async function getAllBooks() {
  const col = requireCollection();
  const docs = await col.find({}).sort({ id: 1 }).toArray();
  return docs.map(mapDocToBook);
}

async function getBookById(id) {
  const col = requireCollection();
  const doc = await col.findOne({ id });
  return mapDocToBook(doc);
}

module.exports = {
  setBooksCollection,
  getAllBooks,
  getBookById
};
