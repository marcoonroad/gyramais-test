'use strict'

const express = require('express')
const authMiddleware = require('../middlewares').authentication
const controller = require('./controller')

const router = express.Router()

router.use(authMiddleware)
router.get('/', controller.listMessages)
router.post('/', controller.sendMessage)
router.put('/:id', controller.editMessage)
router.delete('/:id', controller.excludeMessage)

module.exports.router = router
