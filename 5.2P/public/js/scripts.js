(function () {
  const listEl = document.getElementById('book-list');
  const statusEl = document.getElementById('status');

  function renderBooks(books) {
    listEl.innerHTML = '';
    books.forEach(function (book) {
      const li = document.createElement('li');
      li.className = 'book-item';
      li.textContent = book.title + ' — ' + book.author;
      listEl.appendChild(li);
    });
  }

  function loadBooks() {
    fetch('/api/books')
      .then(function (res) {
        if (!res.ok) throw new Error('Request failed: ' + res.status);
        return res.json();
      })
      .then(function (body) {
        const books = body.data;
        if (!Array.isArray(books)) throw new Error('Unexpected response shape');
        statusEl.textContent = '';
        renderBooks(books);
      })
      .catch(function (err) {
        statusEl.textContent = 'Could not load books: ' + err.message;
      });
  }

  document.addEventListener('DOMContentLoaded', loadBooks);
})();
