'use strict'

const model = require('./model')

const listMessages = async (req, res, next) => {
  try {
    const { author, sinceDate, untilDate } = req.query
    const messages = await model.listMessages({ author, sinceDate, untilDate })

    res.status(200).json(messages)
  } catch (reason) {
    next(reason)
  }
}

const sendMessage = async (req, res, next) => {
  try {
    const message = req.body
    const { nickname, secret } = req.query
    const result = await model.sendMessage(message, { nickname, secret })

    res.status(201).json(result)
  } catch (reason) {
    next(reason)
  }
}

const editMessage = async (req, res, next) => {
  try {
    const id = req.params.id
    const changes = req.body
    const { nickname, secret } = req.query
    const result = await model.editMessage(id, changes, { nickname, secret })

    res.status(200).json(result)
  } catch (reason) {
    next(reason)
  }
}

const excludeMessage = async (req, res, next) => {
  try {
    const id = req.params.id
    const { nickname, secret } = req.query
    const result = await model.excludeMessage(id, { nickname, secret })

    res.status(200).json(result)
  } catch (reason) {
    next(reason)
  }
}

module.exports.listMessages = listMessages
module.exports.sendMessage = sendMessage
module.exports.editMessage = editMessage
module.exports.excludeMessage = excludeMessage
