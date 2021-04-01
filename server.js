const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.get("/test", (req, res) => {
    res.send("test");
})

const server = app.listen(3001, function () {
    console.log('server running on port 3001');
});

const io = require('socket.io')(server, {
    cors: {
        origin: '*',
    }
});

io.use((socket, next) => {
    console.log("io.use");
    const username = socket.handshake.auth.username;
    if (!username) {
        return next(new Error("invalid username"));
    }
    socket.username = username;
    next();
});

io.on('connection', function (socket) {
    console.log("socketId= " + socket.id)

    //Mesaj
    socket.on('SEND_MESSAGE', function (data) {
	//private mesaj
        if (data.receiverSocketId) {
            io.to(data.receiverSocketId).emit("MESSAGE", data);
        } else {
            io.emit('MESSAGE', data)
        }
    });

    socket.on('GET_USERS', function () {
        const users = [];
        for (let [id, socket] of io.of("/").sockets) {
            users.push({
                userID: id,
                username: socket.username,
                emitEvent: "USERLIST"
            });
        }
        socket.emit("USERLIST", users);
    })

    // Tüm kullanıcıları döner.
    const users = [];
    for (let [id, socket] of io.of("/").sockets) {
        users.push({
            userID: id,
            username: socket.username,
            emitEvent: "users"
        });
    }
    socket.emit("users", users);

    //Yeni bir user katıldığında diğer mevcut kullanıcılara bilgi gönderir.
    socket.broadcast.emit("user connected", {
        userID: socket.id,
        username: socket.username,
        emitEvent: "user connected"
    });
});