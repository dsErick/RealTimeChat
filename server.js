const path = require('path');
const express = require('express');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');
const formatMessage = require('./utils/messages');
const botName = 'ChatCord Bot';


const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Run when a client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room)
        
        socket.join(user.room);
        
        // Welcome current user
        socket.emit('message', formatMessage(botName, 'Bem vindo(a) a ChatCord!'));
    
        // BroadCast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} entrou na conversa`));

        // Send users and room info 
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });
    
    // Listen for chatMessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);
        
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    // Listen for userTyping
    socket.on('userTyping', () => {
        const user = getCurrentUser(socket.id);
        
        socket.broadcast.to(user.room).emit('userIsTyping', `${user.username} is typing...`);
    });
    
    // Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} saiu da conversa`));

            // Send users and room info 
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, console.log(`Server running on port ${PORT}`));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error(err.message);
    // Close server && Exit process
    server.close(() => process.exit(1));
});