'use strict'

const express = require('express')
const authMiddleware = require('../middlewares').authentication
const controller = require('./controller')

const router = express.Router()

router.post('/enter', controller.enter)
router.post('/exit', authMiddleware, controller.exit)
router.get('/is-active', controller.isActive)

module.exports.router = router
