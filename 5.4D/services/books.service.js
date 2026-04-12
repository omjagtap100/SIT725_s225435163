const mongoose = require('mongoose');
const { Book } = require('../models/book.model');

const CREATE_KEYS = ['id', 'title', 'author', 'year', 'genre', 'summary', 'price'];
const UPDATE_KEYS = ['title', 'author', 'year', 'genre', 'summary', 'price'];

function formatMongooseValidationError(err) {
  if (!err.errors) return err.message;
  return Object.values(err.errors)
    .map((e) => e.message)
    .join('; ');
}

function assertOnlyKeys(body, allowedSet) {
  const keys = Object.keys(body);
  for (const k of keys) {
    if (!allowedSet.has(k)) {
      return `Unknown or disallowed field: ${k}`;
    }
  }
  return null;
}

function assertCreateKeysComplete(body) {
  for (const k of CREATE_KEYS) {
    if (!(k in body)) {
      return `Missing required field: ${k}`;
    }
  }
  return null;
}

function assertUpdateKeysComplete(body) {
  for (const k of UPDATE_KEYS) {
    if (!(k in body)) {
      return `Missing required field: ${k}`;
    }
  }
  return null;
}

function isDuplicateKeyError(err) {
  return (
    err &&
    (err.code === 11000 ||
      (err.name === 'MongoServerError' && err.code === 11000) ||
      (err.message && err.message.includes('E11000')))
  );
}

async function getAllBooks() {
  const docs = await Book.find({}).sort({ id: 1 }).lean();
  return docs.map((d) => ({
    id: d.id,
    title: d.title,
    author: d.author,
    year: d.year,
    genre: d.genre,
    summary: d.summary,
    price: d.price != null && d.price.toString ? d.price.toString() : String(d.price)
  }));
}

async function getBookById(id) {
  const d = await Book.findOne({ id }).lean();
  if (!d) return null;
  return {
    id: d.id,
    title: d.title,
    author: d.author,
    year: d.year,
    genre: d.genre,
    summary: d.summary,
    price: d.price != null && d.price.toString ? d.price.toString() : String(d.price)
  };
}

async function createBook(rawBody) {
  const unknownMsg = assertOnlyKeys(rawBody, new Set(CREATE_KEYS));
  if (unknownMsg) {
    const err = new Error(unknownMsg);
    err.statusCode = 400;
    throw err;
  }
  const missingMsg = assertCreateKeysComplete(rawBody);
  if (missingMsg) {
    const err = new Error(missingMsg);
    err.statusCode = 400;
    throw err;
  }

  try {
    const doc = await Book.create(rawBody);
    const o = doc.toJSON();
    return o;
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      const e = new Error(formatMongooseValidationError(err));
      e.statusCode = 400;
      throw e;
    }
    if (err instanceof mongoose.Error.CastError) {
      const e = new Error(`Invalid type or value for field: ${err.path}`);
      e.statusCode = 400;
      throw e;
    }
    if (isDuplicateKeyError(err)) {
      const e = new Error('A book with this id already exists');
      e.statusCode = 409;
      throw e;
    }
    throw err;
  }
}

async function updateBook(routeId, rawBody) {
  if (rawBody.id !== undefined) {
    const err = new Error('id is immutable and must not appear in the request body');
    err.statusCode = 400;
    throw err;
  }

  const unknownMsg = assertOnlyKeys(rawBody, new Set(UPDATE_KEYS));
  if (unknownMsg) {
    const err = new Error(unknownMsg);
    err.statusCode = 400;
    throw err;
  }

  const missingMsg = assertUpdateKeysComplete(rawBody);
  if (missingMsg) {
    const err = new Error(missingMsg);
    err.statusCode = 400;
    throw err;
  }

  const existing = await Book.findOne({ id: routeId });
  if (!existing) {
    const err = new Error('Book not found');
    err.statusCode = 404;
    throw err;
  }

  try {
    existing.set(rawBody);
    await existing.save();
    return existing.toJSON();
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      const e = new Error(formatMongooseValidationError(err));
      e.statusCode = 400;
      throw e;
    }
    if (err instanceof mongoose.Error.CastError) {
      const e = new Error(`Invalid type or value for field: ${err.path}`);
      e.statusCode = 400;
      throw e;
    }
    throw err;
  }
}

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook
};
