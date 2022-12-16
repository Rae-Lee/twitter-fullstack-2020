const express = require('express')
const router = express.Router()
const tweetController = require('../controllers/tweet-controller') 
const admin = require('./modules/admin')

router.use('/admin', admin)

router.get('/tweets', tweetController.getTweets)
router.get('/', (req, res) => res.render('partials/topFollowers'))
//router.use('/', (req, res) => res.redirect('/tweets'))

module.exports = router