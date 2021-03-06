const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('msg');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const usersList = document.getElementById('users');

// Get username and room from url
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const socket = io();

// Join Chat room
socket.emit('joinRoom', { username, room });

// Get room and users
socket.on('roomUsers', ({ room, users }) => {
    outputRoomName(room);
    outputUsers(users);
});

// Message from server
socket.on('message', message => {
    outputMessage(message);
    
    // Scroll down
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message submit
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // get message text
    const msg = e.target.elements.msg.value;

    // Emit message to server
    socket.emit('chatMessage', msg);

    // Clear input
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
});

// User is typing
messageInput.addEventListener('input', () => socket.emit('userTyping'));

socket.on('userIsTyping', msg => {
    document.getElementById('typing').innerText = msg;
    
    setTimeout(() => {
        document.getElementById('typing').innerText = '';
    }, 1000);
});

// Output message to dom
function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
    <p class="text">${message.text}</p>`;

    chatMessages.appendChild(div);
}

// Add room name to DOM
function outputRoomName(room) {
    roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
    usersList.innerHTML = `${users.map(user => `<li>${user.username}</li>`).join('')}`;
}