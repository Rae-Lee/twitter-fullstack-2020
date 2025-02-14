const { assert } = require('chai')
const db = require('../models')
const Followship = db.Followship
const Tweet = db.Tweet
const User = db.User
const Like = db.Like
const Reply = db.Reply
const helpers = require('../_helpers')
const services = require('../_services')
const tweetController = {
  // 首頁的推文抓取
  getTweets: async (req, res, next) => {
    const viewUser = helpers.getUser(req)
    try {
      const data = await services.getTweets(req)
      const topFollowings = await services.getTopUsers(req)
      res.render('tweets', {
        tweets: data,
        viewUser,
        topFollowings
      })
    } catch (err) { next(err) }
  },
  postTweet: (req, res, next) => {
    const userId = Number(helpers.getUser(req).id)
    const { description } = req.body
    if (!description) throw new Error('內容不能空白')
    if (description.length > 140) throw new Error('字數超過140')

    return Tweet.create({ UserId: userId, description })
      .then(() => res.redirect('/'))
      .catch(err => next(err))
  },
  addLike: (req, res, next) => {
    const TweetId = req.params.id
    const UserId = helpers.getUser(req).id
    Like.create({
      UserId,
      TweetId
    }).then(() => {
      res.redirect('back')
    })
      .catch(err => next(err))
  },
  removeLike: (req, res, next) => {
    const TweetId = req.params.id

    return Like.findOne({
      where: {
        UserId: helpers.getUser(req).id,
        TweetId
      }
    }).then(like => {
      return like.destroy()
        .then(() => {
          res.redirect('back')
        })
    })
      .catch(err => next(err))
  },
  getReplies: async (req, res, next) => {
    const viewUser = helpers.getUser(req)
    try {
      const tweet = await Tweet.findByPk(req.params.id, {
        include: [User, Like],
        nest: true
      })
      if (!tweet) throw new Error('貼文不存在')
      const data = {
        ...tweet.toJSON(),
        isLiked: tweet && tweet.Likes.some(f => f.UserId === viewUser.id)
      }
      const replies = await services.getReplies(req)
      const topFollowings = await services.getTopUsers(req)
      res.render('replies', {
        viewUser,
        tweet: data,
        replies,
        topFollowings
      })
    } catch (err) { next(err) }
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
