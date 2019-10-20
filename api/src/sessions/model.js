'use strict'

const cuid = require('cuid')
const moment = require('moment')
const spadille = require('spadille')
const helpers = require('../helpers')
const system = require('../system')

const COLLECTION = helpers.constants.collections.SESSIONS
const { findActive, sendEnterStatus, sendExitStatus } = system.model

const isActive = async ({ nickname }) => {
  const session = await findActive(nickname, null, true)

  return { status: !!session }
}

const enter = async ({ nickname }) => {
  const deferred = helpers.promises.defer()

  try {
    if (
      typeof nickname !== 'string' ||
      nickname.length === 0
    ) {
      const reason = Error(
        'Pardon me, this is an invalid passed nickname, it must be a filled string!'
      )
      reason.customError = true
      reason.statusCode = 400

      deferred.reject(reason)
      return deferred.promise
    }

    const session = await findActive(nickname, null, true)
    if (session) {
      const reason = Error(`User ${nickname} is already active in this chat room!`)
      reason.customError = true
      reason.statusCode = 400
      deferred.reject(reason)

      return deferred.promise
    }
    const now = moment()
    const secret = Buffer.from(await spadille.secret.generate(20), 'binary').toString('hex')
    const object = {
      _id: cuid(),
      nickname,
      secret,
      active: true,
      enterHour: now.format('HH:mm:ss'),
      enterDate: now.format('YYYY-MM-DD')
    }

    const db = await helpers.database.getConnection()

    db.collection(COLLECTION).insertOne(object, async (reason, payload) => {
      if (reason) {
        deferred.reject(reason)
      } else {
        try {
          // TODO: use mongo transactions here
          const statusMessage = await sendEnterStatus(nickname)
          deferred.resolve(Object.assign({ statusMessage }, payload.ops[0]))
        } catch (reason2) {
          deferred.reject(reason2)
        }
      }
    })
  } catch (reason) {
    deferred.reject(reason)
  }

  return deferred.promise
}

const exit = async ({ nickname, secret }) => {
  const deferred = helpers.promises.defer()

  try {
    const session = await findActive(nickname, secret)

    if (!session) {
      const reason = Error(`Could not find an active session for user ${nickname}!`)
      reason.customError = true
      reason.statusCode = 400
      deferred.reject(reason)
    } else {
      const sessionObj = JSON.parse(JSON.stringify(session))

      const where = {
        _id: sessionObj._id,
        nickname: sessionObj.nickname,
        active: sessionObj.active,
        secret: sessionObj.secret
      }

      const now = moment()
      const changes = {
        secret: '',
        active: false,
        exitHour: now.format('HH:mm:ss'),
        exitDate: now.format('YYYY-MM-DD')
      }

      const db = await helpers.database.getConnection()
      db.collection(COLLECTION).updateOne(where, { $set: changes }, async (reason, payload) => {
        if (reason) {
          deferred.reject(reason)
        } else if (payload.result.n !== 1) {
          const errorMessage = ([
            'Pardon me, could not exit the channel,',
            'this is a fatal and unexpected error!'
          ]).join(' ')
          const reason = Error(errorMessage)
          reason.customError = true
          reason.statusCode = 400

          deferred.reject(reason)
        } else {
          try {
            // TODO: use mongo transactions here
            const statusMessage = await sendExitStatus(nickname)
            deferred.resolve(Object.assign({ statusMessage }, where, changes))
          } catch (reason2) {
            deferred.reject(reason2)
          }
        }
      })
    }
  } catch (reason) {
    deferred.reject(reason)
  }

  return deferred.promise
}

module.exports.enter = enter
module.exports.isActive = isActive
module.exports.exit = exit
