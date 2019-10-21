import axios from 'axios'

const client = axios.create({
  baseURL: 'https://gyraplus-test-chat-api.herokuapp.com/api'
})

const enter = async (nickname : string) => {
  const response = await client.post(`/sessions/enter?nickname=${nickname}`)
  const session = response.data

  localStorage.setItem('nickname', nickname)
  localStorage.setItem('basic-key', session.basicKey)

  delete session.basicKey
  return session
}

const isActive = async (inputNickname : string | null | undefined) => {
  const nickname = inputNickname || localStorage.getItem('nickname')

  if (!nickname) {
    return false
  }

  try {
    const response = await client.get(`/sessions/is-active?nickname=${nickname}`)

    return response.data.status
  } catch (reason) {
    console.error(reason)
    return false
  }
}

const exit = async () => {
  const basicKey = localStorage.getItem('basic-key')

  localStorage.removeItem('basic-key')
  localStorage.removeItem('nickname')

  const response = await client.post('/sessions/exit', {}, {
    headers: {
      Authorization: `Basic ${basicKey}`
    }
  })

  return response.data
}

const list = async () => {
  const basicKey = localStorage.getItem('basic-key')

  const response = await client.get('/messages', {
    headers: {
      Authorization: `Basic ${basicKey}`
    }
  })

  return response.data
}

const send = async (content : string) => {
  const basicKey = localStorage.getItem('basic-key')

  const response = await client.post('/messages', { content }, {
    headers: {
      Authorization: `Basic ${basicKey}`
    }
  })

  return response.data
}

const sessions = { enter, isActive, exit }
const messages = { list, send }

export default { messages, sessions }

