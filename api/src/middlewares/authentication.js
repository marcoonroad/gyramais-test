'use strict'

const system = require('../system')
const findActive = system.model.findActive

const noSessionMessage = 'Sorry, could not find active session for given authorization key!'
const errorMessage = 'Sorry, the system failed to authenticate user session!'

const middleware = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      const reason = Error('Sorry, this API expects a Basic authorization key in the HTTP headers!')
      reason.customError = true
      reason.statusCode = 403
      next(reason)
      return
    }

    const basicKey = req.headers.authorization.replace('Basic ', '')
    const [nickname, secret] = Buffer.from(basicKey, 'base64').toString('ascii').split(':')

    const session = await findActive(nickname, secret)
    if (!session) {
      const reason = Error(noSessionMessage)
      reason.customError = true
      reason.statusCode = 401
      next(reason)
    } else {
      req.query.nickname = nickname
      req.query.secret = secret
      next()
    }
  } catch (reason) {
    console.error(reason)

    next(Error(errorMessage))
  }
}

module.exports.middleware = middleware
