// @ts-check

'use strict'

const cuid = require('cuid')
const moment = require('moment')
const helpers = require('../helpers')

const COLLECTION = helpers.constants.collections.MESSAGES

/**
 * @param {{
 *   sinceDate : string | null | undefined,
 *   untilDate : string | null | undefined,
 *   author : string | null | undefined
 * }} params
 * @returns {Promise<{
 *   _id : string,
 *   author : string,
 *   content : string,
 *   edited : boolean,
 *   excluded : boolean,
 *   status : boolean,
 *   sentHour : string,
 *   sentDate : string,
 *   editedHour : string | null | undefined,
 *   editedDate : string | null | undefined,
 *   excludedHour : string | null | undefined,
 *   excludedDate : string | null | undefined
 * }[]>}
 */
const listMessages = async (params) => {
  const deferred = helpers.promises.defer()

  try {
    const sinceDate = params.sinceDate || '2000-01-01'
    const untilDate = params.untilDate || moment().format('YYYY-MM-DD')
    const author = params.author
    if (
      !moment(sinceDate, 'YYYY-MM-DD').isValid() ||
      !moment(untilDate, 'YYYY-MM-DD').isValid()
    ) {
      /** @type any */
      const reason = Error(
        'If passed, the query parameters ?sinceDate and ?untilDate must be under format YYYY-MM-DD!'
      )
      reason.customError = true
      reason.statusCode = 400

      deferred.reject(reason)
      return deferred.promise
    }

    const where = {
      sentDate: {
        $gte: sinceDate,
        $lte: untilDate
      },
      author: author
    }

    if (author === null || author === undefined) {
      delete where.author
    } else if (author.length === 0) {
      /** @type any */
      const reason = Error('If passed, the query parameter ?author must be filled!')
      reason.customError = true
      reason.statusCode = 400

      deferred.reject(reason)
      return deferred.promise
    }

    const db = await helpers.database.getConnection()

    db.collection(COLLECTION).find(where).sort({ _id: 1 }).toArray((reason, messages) => {
      if (reason) {
        deferred.reject(reason)
      } else {
        deferred.resolve(messages)
      }
    })
  } catch (reason) {
    deferred.reject(reason)
  }

  return deferred.promise
}

/**
 * @param {{ content : string }} message
 * @param {{ nickname : string }} authData
 * @returns {Promise<{
 *   _id : string,
 *   author : string,
 *   content : string,
 *   sentDate : string,
 *   sentHour : string,
 *   edited : boolean,
 *   excluded : boolean,
 *   status : boolean
 * }>}
 */
const sendMessage = async (message, { nickname }) => {
  const deferred = helpers.promises.defer()

  try {
    if (
      !message ||
      typeof message.content !== 'string' ||
      message.content.length === 0 ||
      Object.keys(message).length !== 1
    ) {
      /** @type any */
      const reason = Error(
        'Pardon me, this is an invalid sent message, please send only filled "content" field!'
      )
      reason.customError = true
      reason.statusCode = 400

      deferred.reject(reason)
      return deferred.promise
    }

    const now = moment()
    const inputMessage = {
      author: nickname,
      content: message.content,
      sentDate: now.format('YYYY-MM-DD'),
      sentHour: now.format('HH:mm:ss'),
      _id: cuid(),
      edited: false,
      excluded: false,
      status: false
    }

    const db = await helpers.database.getConnection()

    db.collection(COLLECTION).insertOne(inputMessage, (reason, payload) => {
      if (reason) {
        deferred.reject(reason)
      } else {
        const createdMessage = payload.ops[0]
        deferred.resolve(createdMessage)
      }
    })
  } catch (reason) {
    deferred.reject(reason)
  }

  return deferred.promise
}

/**
 * @param {string} id
 * @param {{ nickname : string }} authData
 * @returns {Promise<{
 *   _id : string,
 *   author : string,
 *   excluded : boolean,
 *   content : string,
 *   excludedDate : string,
 *   excludedHour : string
 * }>}
 */
const excludeMessage = async (id, { nickname }) => {
  const deferred = helpers.promises.defer()

  try {
    const now = moment()
    const changes = {
      content: '',
      excluded: true,
      excludedDate: now.format('YYYY-MM-DD'),
      excludedHour: now.format('HH:mm:ss')
    }

    const where = {
      _id: id,
      excluded: false,
      author: nickname // user must be the author of this message
    }

    const db = await helpers.database.getConnection()

    db.collection(COLLECTION).updateOne(where, { $set: changes }, (reason, payload) => {
      if (reason) {
        deferred.reject(reason)
      } else if (payload.result.n !== 1) {
        const errorMessage = ([
          'Pardon me, could not exclude message,',
          'please check if ID is valid, if you',
          'are the author of this message',
          'and if the message itself is not already excluded!'
        ]).join(' ')
        /** @type any */
        const reason = Error(errorMessage)
        reason.customError = true
        reason.statusCode = 400

        deferred.reject(reason)
      } else {
        changes._id = id
        changes.author = nickname
        deferred.resolve(changes)
      }
    })
  } catch (reason) {
    deferred.reject(reason)
  }

  return deferred.promise
}

/**
 * @param {string} id
 * @param {{ content : string }} userChanges
 * @param {{ nickname : string }} authData
 * @returns {Promise<{
 *   _id : string,
 *   author : string,
 *   edited : boolean,
 *   editedDate : string,
 *   editedHour : string,
 *   content : string
 * }>}
 */
const editMessage = async (id, userChanges, { nickname }) => {
  const deferred = helpers.promises.defer()

  try {
    if (
      !userChanges ||
      typeof userChanges.content !== 'string' ||
      userChanges.content.length === 0 ||
      Object.keys(userChanges).length !== 1
    ) {
      /** @type any */
      const reason = Error(
        'Invalid edited message content, Please send only filled "content" field to edit message!'
      )
      reason.customError = true
      reason.statusCode = 400

      deferred.reject(reason)
      return deferred.promise
    }

    const now = moment()
    const changes = {
      editedDate: now.format('YYYY-MM-DD'),
      editedHour: now.format('HH:mm:ss'),
      edited: true,
      content: userChanges.content
    }

    const where = {
      _id: id,
      excluded: false,
      author: nickname // user must be the author of this message
    }

    const db = await helpers.database.getConnection()

    db.collection(COLLECTION).updateOne(where, { $set: changes }, (reason, payload) => {
      if (reason) {
        deferred.reject(reason)
      } else if (payload.result.n !== 1) {
        const errorMessage = ([
          'Pardon me, could not edit the message,',
          'please check if ID is valid, if you',
          'are the author of this message',
          'and if the message itself is not excluded!'
        ]).join(' ')
        /** @type any */
        const reason = Error(errorMessage)
        reason.customError = true
        reason.statusCode = 400

        deferred.reject(reason)
      } else {
        changes._id = id
        changes.author = nickname
        deferred.resolve(changes)
      }
    })
  } catch (reason) {
    deferred.reject(reason)
  }

  return deferred.promise
}

module.exports.listMessages = listMessages
module.exports.sendMessage = sendMessage
module.exports.excludeMessage = excludeMessage
module.exports.editMessage = editMessage
