const express = require('express');
const Controllers = require('../controllers');

const booksRouter = express.Router();
booksRouter.get('/', Controllers.booksController.getAllBooks);
booksRouter.get('/:id', Controllers.booksController.getBookById);

const apiRouter = express.Router();

apiRouter.use('/books', booksRouter);

module.exports = apiRouter;
