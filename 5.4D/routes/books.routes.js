const express = require('express');
const Controllers = require('../controllers');

const booksRouter = express.Router();
booksRouter.get('/', Controllers.booksController.getAllBooks);
booksRouter.post('/', Controllers.booksController.createBook);
booksRouter.get('/:id', Controllers.booksController.getBookById);
booksRouter.put('/:id', Controllers.booksController.updateBook);

const apiRouter = express.Router();

apiRouter.use('/books', booksRouter);

module.exports = apiRouter;
