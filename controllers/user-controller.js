const bcrypt = require('bcryptjs')
const db = require('../models')
const Tweet = db.Tweet
const User = db.User
const Followship = db.Followship
const { getUser } = require('../_helpers')
const userController = {
  signUpPage: (req, res) => {
    res.render('signup')
  },
  signUp: (req, res, next) => {
    const { account, name, email, password, checkPassword } = req.body
    if (!account || !name || !email || !password || !checkPassword) {
      req.flash('error_messages', '所有內容都需要填寫')
      return res.redirect('/signup')
    }
    if (password !== checkPassword) {
      req.flash('error_messages', '密碼與密碼確認不相符')
      return res.redirect('/signup')
    }
    if (!email.match(/^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z]+$/)) {
      req.flash('error_messages', 'email 輸入錯誤')
      return res.redirect('/signup')
    }
    if (name.length > 50 || account.length > 50) {
      req.flash('error_messages', '字數超出上限！')
      return res.redirect('/signup')
    }

    Promise.all([
      User.findOne({ where: { email } }),
      User.findOne({ where: { account } })
    ])
      .then(([userEmail, userAccount]) => {
        if (userEmail) {
          req.flash('error_messages', 'email 已重複註冊！')
          return res.redirect('/signup')
        } else if (userAccount) {
          req.flash('error_messages', 'account 已重複註冊！')
          return res.redirect('/signup')
        } else {
          User.create({
            role: 'user',
            account,
            name,
            email,
            password: bcrypt.hashSync(password, bcrypt.genSaltSync(10), null)
          })
            .then(() => {
              req.flash('success_messages', '成功註冊帳號！')
              return res.redirect('/signin')
            })
            .catch(err => next(err))
        }
      })
  },
  signInPage: (req, res) => {
    res.render('signin')
  },
  signIn: (req, res) => {
    req.flash('success_messages', '成功登入！')
    res.redirect('/tweets')
  },
  logout: (req, res, next) => {
    req.flash('success_messages', '登出成功！')
    // req.logout()
    // res.redirect('/signin')
    req.logout(function (err) {
      if (err) { return next(err) }
      res.redirect('/signin')
    })
  },
  getTweets: (req, res, next) => {
    // 個人頁面的推文抓取

    return Tweet.findAll({
      order: [['createdAt', 'DESC']],
      where: { UserId: req.params.id },
      include: [User],
      raw: true,
      nest: true
    })
      .then(tweets => {
        if (!tweets) throw new Error("Restaurant didn't exist!")
        return res.render('tweet', {
          tweets
        })
      })
      .catch(err => next(err))
  },
  getFollowings: async (req, res, next) => {
    try{
      const userId = req.params.id
      const followingList = getUser(req) && getUser(req).Followings.map(following => { return following.id })
      const viewUser = await User.findByPk(userId, {   
        include: [{ model: User, as: 'Followings' }], 
        nest: true 
      })
      const users = await User.findAll({ 
        include: [{ model: User, as: 'Followers' }], 
        nest: true 
      })
       if (!viewUser) throw new Error('該用戶不存在')
      const result = viewUser.Followings.map(following => {
        return {
          ...following.toJSON(),
          isFollowed: followingList.includes(following.id)
        }
      })
      const topFollowingList = users
        .sort((a, b) => { b.Followers.length - a.Followers.length })
        .slice(0, 10).map(topFollowing => {
          return {
            ...topFollowing.toJSON(),
            isFollowed: followingList.includes(topFollowing.id)
          }
        })
      return res.render('followship', { user: viewUser.toJSON(), followings: result, topFollowings: topFollowingList })
    }catch(error){
      next(error)
    }  
  },
  getFollowers: async (req, res, next) => {
    try{
      const userId = req.params.id
      const followingList = getUser(req) && getUser(req).Followings.map(following => { return following.id })
      const viewUser = await User.findByPk(userId, { 
        include: [{ model: User, as: 'Followers' }], 
        nest: true 
      })
      const users = await User.findAll({ 
        include: [{ model: User, as: 'Followers' }], 
        nest: true 
      })
      if (!viewUser) throw new Error('該用戶不存在')
      const result = viewUser.Followers.map(follower => {
        return {
          ...follower.toJSON(),
          isFollowed: followingList.includes(follower.id)
         }
      })
      const topFollowingList = users
         .sort((a, b) => { b.Followers.length - a.Followers.length })
         .slice(0, 10).map(topFollowing => {
           return {
            ...topFollowing.toJSON(),
            isFollowed: followingList.includes(topFollowing.id)
          }
        })
      return res.render('followship', { user: viewUser.toJSON(), followings: result, topFollowings: topFollowingList })
    }catch(error){
       next(error)
    }   
  },
  addFollowship: async(req, res, next) => {
    try{
      const followingId = req.body.id
      if (Number(followingId) === Number(getUser(req).id)) {
        req.flash('error_messages', '不得追蹤自己')
        res.status(200)
        return res.redirect('back')
      }
      const followingUser = await User.findByPk(followingId)
      const followship =  await Followship.findOne({ 
        where: { followerId: getUser(req).id, followingId }
       })
      if (!followingUser) throw new Error('該用戶不存在')
      if (followship) throw new Error('已經追蹤該用戶')
      await Followship.create({ followerId: getUser(req).id, followingId: followingId })
      return res.redirect('back')
    }catch(error){
      next(error)
    }  
  },
  removeFollowship: async (req, res, next) => {
    try{
      const unfollowingId = req.params.id
      const unfollowingUser = await User.findByPk(unfollowingId)
      const followship = await Followship.findOne({ 
        where: { followerId: getUser(req).id, followingId: unfollowingId }
       })
      if (!unfollowingUser) throw new Error('該用戶不存在')
      if (!followship) throw new Error('尚未追蹤該用戶')
      await followship.destroy()
      return res.redirect('back') 
      }catch(error){
        next(error)
      }
  }
  
}

module.exports = userController
