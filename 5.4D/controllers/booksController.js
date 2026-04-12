const booksService = require('../services/books.service');

const DEVELOPED_BY = 's225435163';



exports.getAllBooks = async (req, res, next) => {
  try {
    const items = await booksService.getAllBooks();
    res.json({ developedBy: DEVELOPED_BY, data: items });
  } catch (err) {
    next(err);
  }
};

exports.getBookById = async (req, res, next) => {
  try {
    const book = await booksService.getBookById(req.params.id);
    if (!book) {
      return res.status(404).json({ developedBy: DEVELOPED_BY, message: 'Book not found' });
    }
    res.json({ developedBy: DEVELOPED_BY, data: book });
  } catch (err) {
    next(err);
  }
};

exports.createBook = async (req, res, next) => {
  try {
    const created = await booksService.createBook(req.body || {});
    res.status(201).json({ developedBy: DEVELOPED_BY, data: created });
  } catch (err) {
    const code = err.statusCode;
    if (code === 400) {
      return res.status(400).json({ developedBy: DEVELOPED_BY, message: err.message });
    }
    if (code === 409) {
      return res.status(409).json({ developedBy: DEVELOPED_BY, message: err.message });
    }
    next(err);
  }
};

exports.updateBook = async (req, res, next) => {
  try {
    const updated = await booksService.updateBook(req.params.id, req.body || {});
    res.status(200).json({ developedBy: DEVELOPED_BY, data: updated });
  } catch (err) {
    const code = err.statusCode;
    if (code === 400) {
      return res.status(400).json({ developedBy: DEVELOPED_BY, message: err.message });
    }
    if (code === 404) {
      return res.status(404).json({ developedBy: DEVELOPED_BY, message: err.message });
    }
    next(err);
  }
};
