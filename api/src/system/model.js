'use strict'

const cuid = require('cuid')
const moment = require('moment')
const helpers = require('../helpers')
const { SESSIONS, MESSAGES } = helpers.constants.collections

const findActive = async (nickname, secret, skipAuth) => {
  const deferred = helpers.promises.defer()

  try {
    const where = { nickname, secret, active: true }

    if (skipAuth) {
      delete where.secret
    }

    const db = await helpers.database.getConnection()

    db.collection(SESSIONS).find(where).sort({ _id: -1 }).limit(1).toArray((reason, sessions) => {
      if (reason) {
        deferred.reject(reason)
      } else {
        const session = sessions[0]

        deferred.resolve(session)
      }
    })
  } catch (reason) {
    deferred.reject(reason)
  }

  return deferred.promise
}

const sendStatus = async (content) => {
  const deferred = helpers.promises.defer()

  try {
    const now = moment()

    const status = {
      author: '',
      status: true,
      content: content,
      sentDate: now.format('YYYY-MM-DD'),
      sentHour: now.format('HH:mm:ss'),
      _id: cuid(),
      edited: false,
      excluded: false
    }

    const db = await helpers.database.getConnection()

    db.collection(MESSAGES).insertOne(status, (reason, payload) => {
      if (reason) {
        deferred.reject(reason)
      } else {
        deferred.resolve(payload.ops[0])
      }
    })
  } catch (reason) {
    deferred.reject(reason)
  }

  return deferred.promise
}

const sendEnterStatus = (nickname) => {
  return sendStatus(`User ${nickname} entered on this channel.`)
}

const sendExitStatus = (nickname) => {
  return sendStatus(`User ${nickname} exited the channel.`)
}

module.exports.findActive = findActive
module.exports.sendEnterStatus = sendEnterStatus
module.exports.sendExitStatus = sendExitStatus
