const booksService = require('../services/books.service');

exports.getAllBooks = (req, res) => {
  const items = booksService.getAllBooks();
  res.json({ data: items });
};

exports.getBookById = (req, res) => {
  const book = booksService.getBookById(req.params.id);
  if (!book) {
    return res.status(404).json({ message: 'Book not found' });
  }
  res.json({ data: book });
};
