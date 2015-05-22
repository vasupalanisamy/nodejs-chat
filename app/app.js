let path = require('path')
let express = require('express')
let morgan = require('morgan')
let cookieParser = require('cookie-parser')
let bodyParser = require('body-parser')
let session = require('express-session')
let MongoStore = require('connect-mongo')(session)
let mongoose = require('mongoose')
let routes = require('./routes')
let Server = require('http').Server
let io = require('socket.io')
let browserify = require('browserify-middleware')

require('songbird')
const NODE_ENV = process.env.NODE_ENV || 'development'

module.exports = class App {
    constructor(config) {
        let app = this.app = express()
        this.server = Server(app)
        this.io = io(this.server)
        this.port = process.env.PORT || 8000
		app.config = {
			database: config.database[NODE_ENV]
		}

		// connect to the database
		// mongoose.connect(app.config.database.url)

		// set up our express middleware
		app.use(morgan('dev')) // log every request to the console
		app.use(cookieParser('ilovethenodejs')) // read cookies (needed for auth)
		app.use(bodyParser.json()) // get information from html forms
		app.use(bodyParser.urlencoded({ extended: true }))

		app.set('views', path.join(__dirname, '../views'))
		app.set('view engine', 'ejs') // set up ejs for templating

		this.sessionMiddleware = session({
			secret: 'ilovethenodejs',
			store: new MongoStore({db: 'social-feeder'}),
			resave: true,
			saveUninitialized: true
		})

		// required for passport
		app.use(this.sessionMiddleware)

        this.io.use((socket, next) => {
            this.sessionMiddleware(socket.request, socket.request.res, next)
        })

		// configure routes
		routes(this.app)
		browserify.settings({transform: ['babelify']})
        app.use('/js/index.js', browserify('./public/js/index.js'))

        this.io.on('connection', socket => {
            console.log('a user connected')
            socket.on('disconnect', () => console.log('user disconnected'))

            socket.on('im', msg => {
            	console.log(JSON.stringify(socket.request.session))
                let username = socket.request.session.username
                // im received
                console.log({username, msg})
                // echo im back
                this.io.emit('im', {username, msg})
            })
        })
    }

	async initialize(port) {
		await this.server.promise.listen(port)
		// Return this to allow chaining
		return this
	}
}
