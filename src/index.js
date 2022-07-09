const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const Filter = require('bad-words');
const {generateMessage, generateLocationMessage} = require("./utils/messages")
const {addUser, removeUser, getUser, getUsersInRoom} = require("./utils/users") 

const app = express();
//we dont change de behavior, we just make express refactoring to allow socket.it to run along express
const server = http.createServer(app);
const io = socketIo(server); // now our server support web sockets



            //socket emit => that sent the event to the specific client
            //io.emit => sent event to all conected clients
            //socket.broadcast.emit => sending event to all clients except the one that sent the message
            //io.to.emit => sent event to everybody in the specific room
            //socket.broadcast.to.emit => sending event to all clients except the one that sent the message limited to specific chat room

            // to send an event use socket.emit
            // here we made custome event countUpdated
                //socket.emit('countUpdated', count);

            //to receive an event use socket.on
            //here we made custome event increment
                // socket.on('increment', () => {
                //     count++
            //emit an event called countUpdated
            // socket.emit('countUpdated', count) /-> it will increment but only for 1 client at the time
                // io.emit('countUpdated', count) // it will increment for all clients
                // })

                // socket.on('message', (message) => {
                //     console.log(message)
                // })


const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')


//server index.html from public directory
app.use(express.static(publicDirectoryPath));

//socket parameter in this case is an object and it contains information about a new connection and it will fire when new client will make connection
io.on('connection', (socket) => {
    console.log('New WebSocket connection')
        socket.on('join', (options, callback) => {

            const {error, user} = addUser({id: socket.id, ...options})

            if(error) {
                return callback(error)
            }

            socket.join(user.room)
            
            socket.emit('message', generateMessage('Admin', "Welcome!"))

            //broadcast method is used to sent message to all clients except the one that sent the message for specifis room
            socket.broadcast.to(user.room).emit('message', generateMessage('Admin' ,`${user.username} has joined`))

            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })

            callback()

        })

        socket.on('sendMessage', (message, callback) => {
            const user = getUser(socket.id)
            const filter = new Filter();

            if (filter.isProfane(message)) {
                return callback('Profanity is not allowed')
            }
            io.to(user.room).emit('message', generateMessage(user.username, message))
            callback()
        }) 


        socket.on('sendLocation', (coords, callback) => {

            const user = getUser(socket.id)
            // console.log(user)
            
            io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, coords.latitude, coords.longitude))
            callback('Ack  from server')
        })


        
        socket.on('disconnect', () => {
            const user = removeUser(socket.id)

            if(user) {
                io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`))
                io.to(user.room).emit('roomData', {
                    room: user.room,
                    users: getUsersInRoom(user.room)
                })
            }

            console.log('user disconnected')
        })
})


// run express server on port 3000
server.listen(port, () => {
    console.log(`Server started on port ${port}`);
    }
);