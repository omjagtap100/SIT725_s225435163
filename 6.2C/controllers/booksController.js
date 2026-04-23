const booksService = require('../services/books.service');


exports.getAllBooks = async (req, res, next) => {
  try {
    const items = await booksService.getAllBooks();
    res.json({ data: items });
  } catch (err) {
    next(err);
  }
};

exports.getBookById = async (req, res, next) => {
  try {
    const book = await booksService.getBookById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json({ data: book });
  } catch (err) {
    next(err);
  }
};
