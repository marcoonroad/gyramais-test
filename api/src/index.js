'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const helpers = require('./helpers')
const messages = require('./messages')

// middlewares
const app = express()
app.use(bodyParser.json())

let server = null

app.use('/api/messages', messages.router)

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
