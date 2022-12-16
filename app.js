if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config()
}

const express = require('express')
const helpers = require('./_helpers');
const handlebars = require('express-handlebars')
const routes = require('./routes')

const app = express()
const port = process.env.PORT || 3000

app.engine('hbs', handlebars({ extname: '.hbs' }))
app.set('view engine', 'hbs')
app.use(express.static('public'))

const db = require('./models')
// use helpers.getUser(req) to replace req.user
// use helpers.ensureAuthenticated(req) to replace req.isAuthenticated()

app.use(routes)
// app.get('/', (req, res) => res.send('Hello World!'))

// app.get('/twitter', twitterController.getTwitters)

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

module.exports = app
