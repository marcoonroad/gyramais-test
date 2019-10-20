'use strict'

const model = require('./model')

const enter = async (req, res, next) => {
  try {
    const { nickname } = req.query
    const result = await model.enter({ nickname })
    const session = JSON.parse(JSON.stringify(result))
    const authData = session.nickname + ':' + session.secret
    session.basicKey = Buffer.from(authData, 'ascii').toString('base64')

    res.status(200).json(session)
  } catch (reason) {
    next(reason)
  }
}

const exit = async (req, res, next) => {
  try {
    const { nickname, secret } = req.query
    const result = await model.exit({ nickname, secret })
    const session = JSON.parse(JSON.stringify(result))

    res.status(200).json(session)
  } catch (reason) {
    next(reason)
  }
}

const isActive = async (req, res, next) => {
  try {
    const { nickname } = req.query
    const result = await model.isActive({ nickname })
    const status = JSON.parse(JSON.stringify(result))

    res.status(200).json(status)
  } catch (reason) {
    next(reason)
  }
}

module.exports.enter = enter
module.exports.exit = exit
module.exports.isActive = isActive
