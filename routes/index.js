const express = require('express')
const router = express.Router()
const tweetController = require('../controllers/tweet-controller') 
const userController = require('../controllers/user-controller')
const admin = require('./modules/admin')
const passport = require('../config/passport')
const { generalErrorHandler } = require('../middleware/error-handler')

router.use('/admin',  admin)

router.get('/tweets',  tweetController.getTweets)
router.get('/users/:id/followings',  userController.getFollowings)
router.get('/users/:id/followers',  userController.getFollowers)
router.post('/followships/:id',  userController.addFollowship)
router.delete('/followships/:id',  userController.removeFollowship)
router.get('/', (req, res) => res.render('followship'))
// router.use('/', (req, res) => res.redirect('/tweets'))
router.use('/', generalErrorHandler)
module.exports = router