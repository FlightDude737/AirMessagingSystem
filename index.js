const hbs = require('hbs')
const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const request = require('request')
const fs = require('fs')

request({url: 'http://api.ipstack.com/check?access_key=0639bd367002f6981e9d4833899307fd', json: true}, (error, response) => {
  console.log("Internet Protocol: " + response.body.ip)
  ip = response.body.ip
})

io.on('connection', (socket) => {
  if (JSON.parse(fs.readFileSync('public/userinfo/users.json')) !== "[]") {
    var users = JSON.parse(fs.readFileSync('public/userinfo/users.json'))
    users.forEach((userdata) => {
      socket.emit('add-controller', userdata.username)
    })
  } else {
    console.log('no-users')
  }
  socket.on('printMessage', (message, username) => {
    io.emit('new-message', message, username)

    /* Possible idea for left and right had side coordination:
    socket.broadcast.emit('your message')
    socket.emit(node with text-align: left (seperate function)) 
    Specific Socket.id => io.to(socketId).emit('hey', 'I just met you'); */
  })
  socket.on('disconnect', () => {
    var every = 0;
    var dataBuffer = fs.readFileSync('public/userinfo/users.json')
    var users = JSON.parse(dataBuffer)
    users.forEach((data) => {
      if (data.socketId == socket.id) {
        users.splice(every, 1)
        var newData = JSON.stringify(users)
        fs.writeFileSync('public/userinfo/users.json', newData)
       io.emit('delete-user', socket.id)
      } else {
        every++
      }
    })
  })
  socket.on('terminal-receive', (info) => {
    io.emit('terminal', info)
  })
  socket.on('new-user', username => {
    var dataBuffer = fs.readFileSync('public/userinfo/users.json')
    var data = JSON.parse(dataBuffer)
    data.push({
      username,
      socketId: socket.id
    })
    var newData = JSON.stringify(data)
    fs.writeFileSync('public/userinfo/users.json', newData)
    socket.emit('get-id', socket.id)
    io.emit('add-controller', username, socket.id)
  })
  socket.on('disconnected-user', id => {
    var every = 0;
    var dataBuffer = fs.readFileSync('public/userinfo/users.json')
    var users = JSON.parse(dataBuffer)
    users.forEach((data) => {
      if (data.socketId == id) {
        users.splice(every, 1)
        var newData = JSON.stringify(users)
        fs.writeFileSync('public/userinfo/users.json', newData)
        io.emit('delete-user', id)
      } else {
        every++
      }
    })
  })
})

app.use(express.static('public/images'))
app.set('view engine', 'hbs')
app.set('views', 'public/views')

app.get('/', (req, res) => {
  res.render('index')
})

http.listen(3000, () => {
  console.log("Server up on port *3000")
})