'use strict'

const model = require('./model')

const listMessages = async (req, res) => {
  try {
    const { author, sinceDate, untilDate } = req.query
    const messages = await model.listMessages({ author, sinceDate, untilDate })

    res.status(200).json(messages)
  } catch (reason) {
    console.error(reason)

    if (reason.validationError) {
      res.status(400).json({ error: reason.message })
    } else {
      res.status(500).json({ error: 'Failed to list messages!' })
    }
  }
}

const sendMessage = async (req, res) => {
  try {
    const message = req.body
    const result = await model.sendMessage(message)

    res.status(201).json(result)
  } catch (reason) {
    console.error(reason)

    if (reason.validationError) {
      res.status(400).json({ error: reason.message })
    } else {
      res.status(500).json({ error: 'Failed to send message!' })
    }
  }
}

const editMessage = async (req, res) => {
  try {
    const id = req.params.id
    const changes = req.body
    const result = await model.editMessage(id, changes)

    res.status(200).json(result)
  } catch (reason) {
    console.error(reason)

    if (reason.validationError) {
      res.status(400).json({ error: reason.message })
    } else {
      res.status(500).json({ error: 'Failed to edit message!' })
    }
  }
}

const excludeMessage = async (req, res) => {
  try {
    const id = req.params.id
    const result = await model.excludeMessage(id)

    res.status(200).json(result)
  } catch (reason) {
    console.error(reason)

    if (reason.validationError) {
      res.status(400).json({ error: reason.message })
    } else {
      res.status(500).json({ error: 'Failed to exclude message!' })
    }
  }
}

module.exports.listMessages = listMessages
module.exports.sendMessage = sendMessage
module.exports.editMessage = editMessage
module.exports.excludeMessage = excludeMessage
