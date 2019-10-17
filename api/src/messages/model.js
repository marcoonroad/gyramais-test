'use strict'

const cuid = require('cuid')
const moment = require('moment')
const helpers = require('../helpers')
const COLLECTION = 'messages'

const listMessages = async (params) => {
  const deferred = helpers.promises.defer()

  const sinceDate = params.sinceDate || '2000-01-01'
  const untilDate = params.untilDate || moment().format('YYYY-MM-DD')
  const author = params.author

  if (
    !moment(sinceDate, 'YYYY-MM-DD').isValid() ||
    !moment(untilDate, 'YYYY-MM-DD').isValid()
  ) {
    const reason = Error(
      'If passed, the query parameters ?sinceDate and ?untilDate must be under format YYYY-MM-DD!'
    )
    reason.validationError = true

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
    const reason = Error('If passed, the query parameter ?author must be filled!')
    reason.validationError = true

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

  return deferred.promise
}

const sendMessage = async (message) => {
  const deferred = helpers.promises.defer()

  if (
    !message ||
    typeof message.author !== 'string' ||
    message.author.length === 0 ||
    typeof message.content !== 'string' ||
    message.content.length === 0 ||
    Object.keys(message).length !== 2
  ) {
    const reason = Error('Invalid sent message, please send only filled "author" and "content" fields!')
    reason.validationError = true

    deferred.reject(reason)
    return deferred.promise
  }

  const db = await helpers.database.getConnection()

  const now = moment()

  const object = {
    author: message.author,
    content: message.content,
    sentDate: now.format('YYYY-MM-DD'),
    sentHour: now.format('HH:mm:ss'),
    _id: cuid(),
    edited: false,
    excluded: false
  }

  db.collection(COLLECTION).insertOne(object, (reason, payload) => {
    if (reason) {
      deferred.reject(reason)
    } else {
      deferred.resolve(payload.ops[0])
    }
  })

  return deferred.promise
}

const excludeMessage = async (id) => {
  const deferred = helpers.promises.defer()
  const db = await helpers.database.getConnection()
  const now = moment()

  const updateMsg = {
    content: '',
    excluded: true,
    excludedDate: now.format('YYYY-MM-DD'),
    excludedHour: now.format('HH:mm:ss')
  }

  const where = {
    _id: id,
    excluded: false
  }

  db.collection(COLLECTION).updateOne(where, { $set: updateMsg }, (reason, payload) => {
    if (reason) {
      deferred.reject(reason)
    } else if (payload.result.n !== 1) {
      const reason = Error(
        'Could not exclude message, please check if ID is valid and if message is not already excluded!'
      )
      reason.validationError = true

      deferred.reject(reason)
    } else {
      updateMsg._id = id
      deferred.resolve(updateMsg)
    }
  })

  return deferred.promise
}

const editMessage = async (id, changes) => {
  const deferred = helpers.promises.defer()

  if (
    !changes ||
    typeof changes.content !== 'string' ||
    changes.content.length === 0 ||
    Object.keys(changes).length !== 1
  ) {
    const reason = Error(
      'Invalid edited message content, Please send only filled "content" field to edit message!'
    )
    reason.validationError = true

    deferred.reject(reason)
    return deferred.promise
  }

  const now = moment()
  const updateMsg = {
    editedDate: now.format('YYYY-MM-DD'),
    editedHour: now.format('HH:mm:ss'),
    edited: true,
    content: changes.content
  }

  const where = {
    _id: id,
    excluded: false
  }

  const db = await helpers.database.getConnection()

  db.collection(COLLECTION).updateOne(where, { $set: updateMsg }, (reason, payload) => {
    if (reason) {
      deferred.reject(reason)
    } else if (payload.result.n !== 1) {
      const reason = Error(
        'Could not edit message, please check if ID is valid and if message is not excluded!'
      )
      reason.validationError = true

      deferred.reject(reason)
    } else {
      updateMsg._id = id
      deferred.resolve(updateMsg)
    }
  })

  return deferred.promise
}

module.exports.listMessages = listMessages
module.exports.sendMessage = sendMessage
module.exports.excludeMessage = excludeMessage
module.exports.editMessage = editMessage
