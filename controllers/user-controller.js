const bcrypt = require('bcryptjs')
const db = require('../models')
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
						role: "user",
						account: account,
						name: name,
						email: email,
						password: bcrypt.hashSync(password, bcrypt.genSaltSync(10), null)
					})
					.then(() => {
						req.flash('success_messages', '成功註冊帳號！')
						return res.redirect('/signin')
					})
					.catch(err => next(err))
		}})
	},
	signInPage: (req, res) => {
		res.render('signin')
	},
	signIn: (req, res) => {
		req.flash('success_messages', '成功登入！')
		res.redirect('/tweets')
	},
	logout: (req, res) => {
		req.flash('success_messages', '登出成功！')
		req.logout()
		res.redirect('/signin')
	},
    getFollowings: (req, res, next) => {
      const userId = req.params.id
      const followingList = getUser(req) && getUser(req).Followings.map(following => { return following.id })
      return Promise.all([
        User.findByPk(userId, { include: [{ model: User, as: 'Followings' }], raw: true, nest: true }),
        User.findAll({ include: [{ model: User, as: 'Followers' }], raw: true, nest: true })
      ])
        .then(([viewUser, users]) => {
          if (!viewUser) throw new Error('該用戶不存在')
          const result = viewUser.Followings.map(following => {
            return {
              ...following,
              isFollowed: followingList.includes(following.id)
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
      if (followingId === getUser(req).id) throw new Error('不得追蹤自己')
      return Promise.all([
        User.findByPk(followingId),
        Followship.findOne({ where: { followingId, followerId: getUser(req).id } })
      ])
        .then(([followingUser, followship]) => {
          if (!followingUser) throw new Error('該用戶不存在')
          if (followship) throw new Error('已經追蹤該用戶')
          return Followship.create({ followingId, followerId: getUser(req).id })
        })
        .then(() => res.redirect('back'))
        .catch(err => next(err))
    },
    removeFollowship: (req, res, next) => {
      const unfollowingId = req.params.id
      return Promise.all([
        User.findByPk(unfollowingId),
        Followship.findOne({ where: { followingId: unfollowingId, followerId: getUser(req).id } })
      ])
        .then(([unfollowingUser, followship]) => {
          if (!unfollowingUser) throw new Error('該用戶不存在')
          if (!followship) throw new Error('尚未追蹤該用戶')
          return followship.destroy()
        })
        .then(() => res.redirect('back'))
        .catch(err => next(err))
    }
}

module.exports = userController