'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const mongodb = require('mongodb')
const cuid = require('cuid')
const moment = require('moment')

// configuration
const ObjectID = mongodb.ObjectID
const MESSAGES_COLLECTION = 'messages'

// middlewares
const app = express()
app.use(bodyParser.json())

let db = null
let server = null

// initialization
mongodb.MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/gyraplus-test-chat-api', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).connect((reason, client) => {
  if (reason) {
    console.error(reason)
    process.exit(1)
  }

  db = client.db()
  console.log('Database connection ready!')

  server = app.listen(process.env.PORT || 8080, () => {
    const port = server.address().port
    console.log(`API is running on port ${port}...`)
  })
})

// routes & controllers
const handleError = (res, reason, message, code) => {
  console.error(reason)
  res.status(code || 500).json({ error: message })
}

app.get('/api/messages', (req, res) => {
  db.collection(MESSAGES_COLLECTION).find({}).toArray((reason, messages) => {
    if (reason) {
      handleError(res, reason.message, 'Failed to list messages!')
    } else {
      res.status(200).json(messages)
    }
  })
})

app.post('/api/messages', (req, res) => {
  const message = req.body

  if (
    typeof message.author !== 'string'  ||
    typeof message.content !== 'string' ||
    Object.keys(message).length !== 2
  ) {
    handleError(res, 'Invalid sent message!', 'Please only "author" and "content" fields!', 400)
  }

  const now = moment()
  message.sentDate = now.format('YYYY-MM-DD')
  message.sentHour = now.format('HH:mm:ss')
  message.messageId = cuid()

  db.collection(MESSAGES_COLLECTION).insertOne(message, (reason, payload) => {
    if (reason) {
      handleError(res, reason.message, 'Failed to send message!')
    } else {
      res.status(201).json(payload.ops[0])
    }
  })
})

app.put('/api/messages/:id', (req, res) => {
  var updateDoc = req.body;
  delete updateDoc._id;

  db.collection(MESSAGES_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, { $set: updateDoc }, (err, doc) => {
    if (err) {
      handleError(res, err.message, "Failed to edit message!");
    } else {
      updateDoc._id = req.params.id;
      res.status(200).json(updateDoc);
    }
  });
})

app.delete('/api/messages/:id', (req, res) => {
  db.collection(MESSAGES_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, (err, result) => {
    if (err) {
      handleError(res, err.message, "Failed to exclude message!");
    } else {
      res.status(200).json(req.params.id);
    }
  });
})

