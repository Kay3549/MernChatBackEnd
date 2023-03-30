import express, { urlencoded, json } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import './connection.js';
import userRoutes from './routes/userRoutes.js'
import User from './models/User.js';
import Message from './models/Message.js'; 

const rooms = ['general', 'tech', 'finance', 'crypto']
const app = express();

app.use(urlencoded({ extended: true }))
app.use(json())
app.use(cors())
app.use('/users', userRoutes)

const server = createServer(app);
const PORT = 5001;
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});


async function getLastMessagesFromRoom(room) {
  let roomMessages = await Message.aggregate([
    { $match: { to: room } },
    { $group: { _id: '$date', messagesByDate: { $push: '$$ROOT' } } }
  ])

  return roomMessages;
}


function sortRoomMessagesByDate(messages) {

  return messages.sort(function (a, b) {
    let date1 = a._id.split('/');
    let date2 = b._id.split('/');

    date1 = date1[2] + date1[0] + date1[1];
    date2 = date2[2] + date2[0] + date2[1];
    return date1 < date2 ? -1 : 1
  })
}


io.on('connection', (socket) => {

  socket.on('new-user', async () => {
    const members = await User.find();
    io.emit('new-user', members)
  })


  socket.on('join-room', async (room) => {

    socket.join(room)
    let roomMessages = await getLastMessagesFromRoom(room)
    console.log(roomMessages)
    roomMessages = sortRoomMessagesByDate(roomMessages)
    socket.emit('room-messages', roomMessages)
  })


  socket.on('message-room', async (room, content, sender, time, date) => {
    const newMessage = await Message.create({ content, from: sender, time, date, to: room })
    let roomMessages = await getLastMessagesFromRoom(room)
    roomMessages = sortRoomMessagesByDate(roomMessages)

    io.to(room).emit('room-messages', roomMessages)

    socket.broadcast.emit('notifications', room)  
  })   


  app.delete('/logout', async (req, res) => { 
    try {
      const { _id, newMessages } = req.body;
      const user = await User.findById(_id)
      user.status = "offline";
      user.newMessages = newMessages
      await user.save(); 
      const members = await User.find();
      socket.broadcast.emit('new-user', members)
      res.status(200).send()
    } catch (e) {
      console.log(e)
      res.status(400).send()
    }
  })


})

app.get('/rooms', (req, res) => {
  res.json(rooms)
})

server.listen(PORT, () => {
  console.log('server is listening the port', PORT)
})