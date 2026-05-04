const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const port = process.env.PORT || 3000;
const httpServer = http.createServer(app);
const io = new Server(httpServer);

app.use(express.static(path.join(__dirname, 'public')));

const liveVotes = {
  backend: 0,
  frontend: 0,
  cloud: 0,
};

let onlineUsers = 0;

io.on('connection', (socket) => {
  onlineUsers += 1;
  io.emit('users:count', onlineUsers);

  socket.emit('votes:state', liveVotes);

  socket.on('votes:submit', (topic) => {
    if (!Object.prototype.hasOwnProperty.call(liveVotes, topic)) {
      socket.emit('votes:error', 'Invalid topic selected.');
      return;
    }

    liveVotes[topic] += 1;
    io.emit('votes:state', liveVotes);
  });

  socket.on('disconnect', () => {
    onlineUsers = Math.max(0, onlineUsers - 1);
    io.emit('users:count', onlineUsers);
  });
});

httpServer.listen(port, () => {
  console.log(`7.2P app listening on http://localhost:${port}`);
});
