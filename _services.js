const { Op } = require('sequelize')
const helpers = require('./_helpers')
const db = require('./models')
const User = db.User
const Tweet = db.Tweet
const Like = db.Like
const Reply = db.Reply
const Followship = db.Followship
module.exports = {
  // 推薦追蹤用戶
  getTopUsers: async (req) => {
    const viewUser = helpers.getUser(req)
    const followingList = viewUser && viewUser.Followings.map(following => following.id)
    const allUsers = await User.findAll({
      where: {
        role: 'user',
        id: { [Op.not]: Number(helpers.getUser(req).id) }
      },
      include: [{ model: User, as: 'Followers' }],
      nest: true
    })
    const topFollowings = allUsers
      .sort((a, b) => {
        b.Followers.length - a.Followers.length
      })
      .slice(0, 10)
      .map(topFollowing => {
        return {
          ...topFollowing.toJSON(),
          isFollowed: followingList.includes(topFollowing.id)
        }
      })
    return topFollowings
  },
  // 貼文抓取
  getTweets: async (req) => {
    const viewUser = helpers.getUser(req)
    const UserId = req.params.id || ''
    const tweets = await Tweet.findAll({
      where: UserId ? { UserId } : {},
      order: [['createdAt', 'DESC']],
      include: [User, Like, Reply],
      nest: true
    }) || []
    const data = tweets.map(t => ({
      ...t.toJSON(),
      User: t.User.dataValues,
      description: t.description.substring(0, 140),
      isLiked: t.Likes.some(f => f.UserId === viewUser.id)
    }))
    return data
  },
  // 單一貼文回覆抓取
  getReplies: async (req) => {
    const TweetId = req.params.id || ''
    const replies = await Reply.findAll({
      where: { TweetId },
      order: [['createdAt', 'DESC']],
      include: [User],
      nest: true,
      raw: true
    }) || []
    return replies
  },
  // 抓取個人檔案用戶
  getUser: async (req) => {
    const userId = req.params.id
    const viewUser = helpers.getUser(req)
    const followingList = viewUser && viewUser.Followings.map(following => following.id)
    const findUser = await User.findByPk(userId, {
      include: [
        Tweet,
        { model: User, as: 'Followings', order: [[Followship, 'createdAt', 'DESC']]},
        { model: User, as: 'Followers', order: [[Followship, 'createdAt', 'DESC']] }
      ],
      nest: true
    })
    const user = {
      ...findUser.toJSON(),
      isFollowed: followingList.includes(findUser.id)
    }
    return user
  }
}
