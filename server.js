const express = require('express')
const cors = require('cors')
const path = require('path')
const cookieParser = require('cookie-parser')


const app = express()
const http = require('http').createServer(app)

// Express App Config
app.use(cookieParser())
app.use(express.json())


if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'public')))
} else {
    const corsOptions = {
        origin: ['http://127.0.0.1:5173', 'http://localhost:5173'],
        credentials: true,
        methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }
    app.use(cors(corsOptions))
}

const authRoutes = require('./api/auth/auth.routes')
const userRoutes = require('./api/user/user.routes')
const taskRoutes = require('./api/task/task.routes')
const { setupSocketAPI } = require('./services/socket.service')

// routes
// const setupAsyncLocalStorage = require('./middlewares/setupAls.middleware')
// app.all('*', setupAsyncLocalStorage)

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/task', taskRoutes)
setupSocketAPI(http)

// Make every server-side-route to match the index.html
// so when requesting http://localhost:3030/index.html/task/123 it will still respond with
// our SPA (single page app) (the index.html file) and allow vue/react-router to take it from there
app.get('/**', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})


const logger = require('./services/logger.service')
const port = process.env.PORT || 3030
http.listen(port, () => {
    logger.info('Server is running on port: ' + port)
})