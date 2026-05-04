(function () {
  const statusEl = document.getElementById('status');
  const getAllBooksBtn = document.getElementById('getAllBooksBtn');
  const listSection = document.getElementById('list-section');
  const bookList = document.getElementById('book-list');
  const detailSection = document.getElementById('detail-section');
  const detailEl = document.getElementById('book-detail');

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : String(text);
    return div.innerHTML;
  }

  function detailPriceAud(priceStr) {
    if (priceStr == null || priceStr === '') return '—';
    return String(priceStr);
  }

  function renderBookList(books) {
    bookList.innerHTML = '';
    books.forEach(function (book) {x
      const li = document.createElement('li');
      li.className = 'book-item';
      li.tabIndex = 0;
      li.dataset.id = book.id;
      const pricePart =
        book.price == null || book.price === '' ? '—' : String(book.price);
      li.textContent = book.title + ' ' + pricePart + ' AUD';

      li.addEventListener('click', function () {
        setSelectedItem(li, book.id);
      });
      li.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setSelectedItem(li, book.id);
        }
      });
      bookList.appendChild(li);
    });
  }

  let selectedLi = null;

  function setSelectedItem(li, id) {
    if (selectedLi) selectedLi.classList.remove('is-selected');
    selectedLi = li;
    li.classList.add('is-selected');
    loadBookDetail(id);
  }

  function loadBookDetail(id) {
    detailSection.hidden = false;
    detailEl.innerHTML = '<dt>Loading…</dt><dd></dd>';

    fetch('/api/books/' + encodeURIComponent(id))
      .then(function (res) {
        if (!res.ok) throw new Error('Request failed: ' + res.status);
        return res.json();
      })
      .then(function (body) {
        const b = body.data;
        detailEl.innerHTML =
          '<dt>Title</dt><dd>' +
          escapeHtml(b.title) +
          '</dd>' +
          '<dt>Author</dt><dd>' +
          escapeHtml(b.author) +
          '</dd>' +
          '<dt>Year</dt><dd>' +
          escapeHtml(String(b.year)) +
          '</dd>' +
          '<dt>Genre</dt><dd>' +
          escapeHtml(b.genre) +
          '</dd>' +
          '<dt>Summary</dt><dd class="summary">' +
          escapeHtml(b.summary) +
          '</dd>' +
          '<dt>Price (AUD)</dt><dd>' +
          escapeHtml(detailPriceAud(b.price)) +
          '</dd>';
      })
      .catch(function (err) {
        detailEl.innerHTML =
          '<dt>Error</dt><dd>' + escapeHtml(err.message) + '</dd>';
      });
  }

  function onGetAllBooks() {
    statusEl.textContent = 'Loading…';
    listSection.hidden = true;
    detailSection.hidden = true;
    bookList.innerHTML = '';
    detailEl.innerHTML = '';
    selectedLi = null;

    fetch('/api/books')
      .then(function (res) {
        if (!res.ok) throw new Error('Request failed: ' + res.status);
        return res.json();
      })
      .then(function (body) {
        const books = body.data;
        if (!Array.isArray(books)) throw new Error('Unexpected response shape');
        statusEl.textContent = '';
        renderBookList(books);
        listSection.hidden = false;
      })
      .catch(function (err) {
        statusEl.textContent = 'Could not load books: ' + err.message;
      });
  }

  getAllBooksBtn.addEventListener('click', onGetAllBooks);
})();
