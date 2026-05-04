(function () {
  const socket = io();
  const messageEl = document.getElementById('message');
  const onlineUsersEl = document.getElementById('online-users');
  const backendCountEl = document.getElementById('backend-count');
  const frontendCountEl = document.getElementById('frontend-count');
  const cloudCountEl = document.getElementById('cloud-count');
  const voteButtons = document.querySelectorAll('.vote-button');

  function setMessage(text) {
    messageEl.textContent = text;
  }

  function renderVotes(votes) {
    backendCountEl.textContent = String(votes.backend || 0);
    frontendCountEl.textContent = String(votes.frontend || 0);
    cloudCountEl.textContent = String(votes.cloud || 0);
  }

  voteButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      const topic = button.getAttribute('data-topic');
      socket.emit('votes:submit', topic);
      setMessage('Vote submitted. Waiting for live update...');
    });
  });

  socket.on('users:count', function (count) {
    onlineUsersEl.textContent = String(count);
  });

  socket.on('votes:state', function (votes) {
    renderVotes(votes);
    setMessage('Live results updated.');
  });

  socket.on('votes:error', function (errorText) {
    setMessage(errorText);
  });
})();
