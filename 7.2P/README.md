# SIT725 7.2P - Socket Programming

This is a custom Express + Socket.IO real-time application for 7.2P.

## Features
- Real-time online user count (`users:count`)
- Real-time live poll updates (`votes:state`)
- Custom vote event (`votes:submit`)
- Input validation with error event (`votes:error`)

## Run
1. Install dependencies:
   - `npm install`
2. Start server:
   - `npm start`
3. Open:
   - `http://localhost:3000`
4. Open the same URL in multiple browser tabs/windows and vote.  
   Results update instantly across all clients.
