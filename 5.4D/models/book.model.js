const mongoose = require('mongoose');

const DB_NAME = 'sit725_books';
const COLLECTION_NAME = 'books';

function audRangeValidator(v) {
  if (v == null) return false;
  const s = typeof v === 'string' ? v : v.toString();
  const n = Number(s);
  return Number.isFinite(n) && n >= 0.01 && n <= 999999.99;
}

const bookSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: [true, 'id is required'],
      unique: true,
      trim: true,
      maxlength: [64, 'id cannot exceed 64 characters'],
      match: [/^b[a-zA-Z0-9_-]+$/, 'id must start with b and contain only letters, digits, hyphen, underscore']
    },
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
      minlength: [2, 'title must be at least 2 characters'],
      maxlength: [300, 'title cannot exceed 300 characters']
    },
    author: {
      type: String,
      required: [true, 'author is required'],
      trim: true,
      minlength: [2, 'author must be at least 2 characters'],
      maxlength: [200, 'author cannot exceed 200 characters']
    },
    year: {
      type: Number,
      required: [true, 'year is required'],
      validate: {
        validator(v) {
          if (!Number.isInteger(v)) return false;
          if (v < 1000 || v > new Date().getFullYear()) return false;
          return true;
        },
        message:
          'year must be an integer between 1000 and the current calendar year (inclusive)'
      }
    },
    genre: {
      type: String,
      required: [true, 'genre is required'],
      trim: true,
      minlength: [2, 'genre must be at least 2 characters'],
      maxlength: [100, 'genre cannot exceed 100 characters']
    },
    summary: {
      type: String,
      required: [true, 'summary is required'],
      trim: true,
      minlength: [10, 'summary must be at least 10 characters'],
      maxlength: [20000, 'summary cannot exceed 20000 characters']
    },
    price: {
      type: mongoose.Schema.Types.Decimal128,
      required: [true, 'price is required'],
      validate: {
        validator: audRangeValidator,
        message: 'price must be a positive AUD amount between 0.01 and 999999.99'
      }
    }
  },
  {
    collection: COLLECTION_NAME,
    strict: true,
    versionKey: false
  }
);

bookSchema.set('toJSON', {
  transform: (_doc, ret) => {
    if (ret.price != null && ret.price.toString) {
      ret.price = ret.price.toString();
    }
    delete ret._id;
    return ret;
  }
});

const Book = mongoose.model('Book', bookSchema);

module.exports = {
  DB_NAME,
  COLLECTION_NAME,
  Book
};
