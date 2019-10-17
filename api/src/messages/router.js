'use strict'

const express = require('express')
const controller = require('./controller')

const router = express.Router()

router.get('/', controller.listMessages)
router.post('/', controller.sendMessage)
router.put('/:id', controller.editMessage)
router.delete('/:id', controller.excludeMessage)

module.exports.router = router
