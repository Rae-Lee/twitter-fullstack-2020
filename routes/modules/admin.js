const express = require('express')
const router = express.Router()
const adminController = require('../../controllers/admin-controller')
<<<<<<< HEAD
router.get('/tweets', adminController.getTweets)
router.use('/', (req, res) => res.render('followers'))
// router.use('/', (req, res) => res.redirect('/admin/tweets'))
=======
const passport = require('../../config/passport')
const {  authenticatedAdmin } = require('../../middleware/auth')

router.get('/signin', adminController.signInPage)
router.post('/signin', passport.authenticate('local', { failureRedirect: '/admin/signin', failureFlash: true }), adminController.signIn)

router.get('/logout', adminController.logout)

router.get('/tweets', authenticatedAdmin, adminController.getTweets)

router.use('/', (req, res) => res.redirect('/admin/tweets'))
>>>>>>> main

module.exports = router
