const { expect } = require('chai');
const request = require('supertest');

const app = require('../app');
const booksService = require('../services/books.service');

describe('Books REST API', function () {
  const seedBooks = [
    {
      id: 'B001',
      title: 'Clean Code',
      author: 'Robert C. Martin',
      year: 2008,
      genre: 'Software Engineering',
      summary: 'A handbook of agile software craftsmanship.',
      price: '59.99'
    },
    {
      id: 'B002',
      title: 'The Pragmatic Programmer',
      author: 'Andrew Hunt',
      year: 1999,
      genre: 'Software Engineering',
      summary: 'Journey to mastery for software developers.',
      price: '49.99'
    }
  ];

  before(function () {
    const fakeCollection = {
      find() {
        return {
          sort() {
            return {
              async toArray() {
                return [...seedBooks];
              }
            };
          }
        };
      },
      async findOne(query) {
        return seedBooks.find((book) => book.id === query.id) || null;
      }
    };

    booksService.setBooksCollection(fakeCollection);
  });

  it('returns all books with HTTP 200 (valid behaviour)', async function () {
    const res = await request(app).get('/api/books');

    expect(res.status).to.equal(200);
    expect(res.body.data).to.be.an('array').with.lengthOf(2);
  });

  it('returns one book by id with HTTP 200 (edge case: exact id match)', async function () {
    const res = await request(app).get('/api/books/B001');

    expect(res.status).to.equal(200);
    expect(res.body.data).to.include({ id: 'B001', title: 'Clean Code' });
  });

  it('returns 404 when book id does not exist (invalid behaviour)', async function () {
    const res = await request(app).get('/api/books/UNKNOWN');

    expect(res.status).to.equal(404);
    expect(res.body).to.deep.equal({ message: 'Book not found' });
  });
});
