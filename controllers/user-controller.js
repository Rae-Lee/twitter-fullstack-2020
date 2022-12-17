const db = require('../models')
const User = db.User
const Followship = db.Followship
const { getUser } = require('../_helpers')
const userController = {
  getFollowings: (req, res, next) => {
    const userId = req.params.id 
    const followingList = getUser(req) && getUser(req).Followings.map(following => {return following.id})
    return Promise.all([
      User.findByPk(userId, { include: [{ model: User, as: 'Followings' }], raw: true, nest: true }),
      User.findAll({ include: [{model: User, as: 'Followers'}], raw: true, nest: true })
    ])
    .then(([viewUser, users]) => {
      if(!viewUser)throw new Error('該用戶不存在')
      const result = viewUser.Followings.map(following => {
        return {
          ...following,
          isFollowed: followingList.includes(following.id)
        }
      })
      const topFollowingList = users.sort((a, b) => { b.Followers.length - a.Followers.length })
      .slice(0, 10).map( topFollowing => {
        return {
          ...topFollowing,
          isFollowed: followingList.includes(topFollowing.id)
        }
      })
      return res.render('followship', { user: viewUser, followings: result, topFollowings: topFollowingList })
    })
    .catch(err => next(err))
  },
  getFollowers: (req, res, next) => {
    const userId = req.params.id
    const followingList = getUser(req) && getUser(req).Followings.map(following => { return following.id })
    return Promise.all([
      User.findByPk(userId, { include: [{ model: User, as: 'Followers' }], raw: true, nest: true }),
      User.findAll({ include: [{ model: User, as: 'Followers' }], raw: true, nest: true })
    ])
      .then(([viewUser, users]) => {
        if (!viewUser) throw new Error('該用戶不存在')
        const result = viewUser.Followers.map(follower => {
          return {
            ...follower,
            isFollowed: followingList.includes(follower.id)
          }
        })
        const topFollowingList = users.sort((a, b) => { b.Followers.length - a.Followers.length })
          .slice(0, 10).map(topFollowing => {
            return {
              ...topFollowing,
              isFollowed: followingList.includes(topFollowing.id)
            }
          })
        return res.render('followship', { user: viewUser, followings: result, topFollowings: topFollowingList })
      })
      .catch(err => next(err))
  },
  addFollowship: (req, res, next) => {
    const followingId = req.params.id
    if(followingId === getUser(req).id)throw new Error('不得追蹤自己')
    return Promise.all([
      User.findByPk(followingId),
      Followship.findOne({ where: { followingId, followerId: getUser(req).id }})
    ])
    .then(([followingUser, followship]) => {
       if(!followingUser)throw new Error('該用戶不存在')
       if(followship)throw new Error('已經追蹤該用戶')
       return Followship.create({ followingId, followerId: getUser(req).id })
    })
    .then(() => res.redirect('back'))
    .catch(err => next(err))
  },
  removeFollowship: (req, res, next) => {
    const unfollowingId = req.params.id
    return Promise.all([
      User.findByPk(unfollowingId),
      Followship.findOne({ where: { followingId: unfollowingId, followerId: getUser(req).id}})
    ])
    .then(([unfollowingUser, followship]) => {
      if(!unfollowingUser)throw new Error('該用戶不存在')
      if(!followship)throw new Error('尚未追蹤該用戶')
      return followship.destroy()
    })
    .then(() => res.redirect('back'))
    .catch(err => next(err))
  }
}
module.exports = userController