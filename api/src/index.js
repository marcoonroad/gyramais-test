'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const helpers = require('./helpers')
const messages = require('./messages')
const sessions = require('./sessions')

// middlewares
const app = express()
app.use(bodyParser.json())

let server = null

app.use('/api/messages', messages.router)
app.use('/api/sessions', sessions.router)

// handles 404 not found
app.use('*', (req, res, next) => {
  const reason = Error('Sorry, the passed endpoint/resource was not found in this API!')
  reason.customError = true
  reason.statusCode = 404
  next(reason)
})

app.use((reason, req, res, next) => {
  console.error(reason)

  if (res.headersSent) {
    next(reason)
    return
  }

  reason.statusCode = reason.statusCode || 500
  reason.message = reason.customError ? reason.message : 'Fatal internal server error!'

  res.status(reason.statusCode).json({ error: reason.message })
})

helpers.database.getConnection().then(() => {
  console.log('Database connection ready!')

  server = app.listen(process.env.PORT || 8080, () => {
    const port = server.address().port
    console.log(`API is running on port ${port}...`)
  })
}).catch((reason) => {
  console.error(reason)
  process.exit(1)
})
