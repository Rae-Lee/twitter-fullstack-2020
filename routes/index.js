const express = require('express')
const router = express.Router()
const tweetController = require('../controllers/tweet-controller') 
const userController = require('../controllers/user-controller')
const admin = require('./modules/admin')

router.use('/admin', authenticatedAdmin, admin)

router.get('/tweets', authenticated, tweetController.getTweets)
router.get('/users/:id/followings', authenticated, userController.getFollowings)
router.get('/users/:id/followers', authenticated, userController.getFollowers)
router.post('/followships/:id', authenticated, userController.addFollowship)
router.delete('/followships/:id', authenticated, userController.removeFollowship)
router.use('/', (req, res) => res.redirect('/tweets'))

module.exports = router