
const { assert } = require('chai')
const db = require('../models')
const { getUser } = require('../_helpers')
const Tweet = db.Tweet
const User = db.User
const Reply = db.Reply
const helpers = require('../_helpers')

const tweetController = {
  // 首頁的推文抓取
  getTweets: (req, res, next) => {
    Tweet.findAll({
      order: [['createdAt', 'DESC']],
      include: [User],
      raw: true,
      nest: true
    })
      .then((tweets) => {
        res.render('tweets', {
          tweets
        })
      })
      .catch(err => next(err))
  },
  postTweet: async (req, res, next) => {
    try {
      const { description } = req.body
      assert(description.length <= 140, '字數140內')
      assert((description.trim() !== ''), '內容不能空白')
      const UserId = helpers.getUser(req).id
      const createdTweet = await Tweet.create({
        UserId,
        description
      })
      assert(createdTweet, 'Failed to create tweet!')
      req.flash('success_messages', '成功推文!')
      return res.redirect('back')
    } catch (err) {
      next(err)
    }
  },
  getReplies: (req, res, next) => {
    Tweet.findByPk(req.params.id, {
      include: [User, { model: Reply, include: User }],
      nest: true
    })
      .then(tweet => {
        if (!tweet) throw new Error("貼文不存在")
        res.render('replies', {
          tweet: tweet.toJSON()
        })
      })
      .catch(err => next(err))
  },
  createReply: async (req, res, next) => {
    try {
      const { comment, TweetId } = req.body
      assert((comment.trim() !== ''), '內容不能空白')
      const UserId = helpers.getUser(req).id
      await Reply.create({
        UserId,
        TweetId,
        comment
      })
      return res.redirect('back')
    } catch (err) {
      next(err)
    }
  }
}
module.exports = tweetController
