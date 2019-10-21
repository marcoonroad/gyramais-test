import React from 'react'
import moment from 'moment'
import Spinner from 'react-spinkit'
import ScrollableFeed from 'react-scrollable-feed'
import Services from '../services'
import './Chat.css'

const ISO_MASK = 'YYYY-MM-DD HH:mm:ss'

interface IChat {
  exitChat : () => void
}

const ChannelHeader : React.FC<IChat> = ({ exitChat }) => {
  const exitChatHandler = async (event : any) => {
    event.preventDefault()

    await Services.sessions.exit()
    exitChat()
  }

  return (
    <div className='chat-header'>
      <button type='submit' onClick={exitChatHandler} className='exit-button'>Exit</button>
    </div>
  )
}

interface IWriteMessage {
  pushMessage : (message : any) => void
}

const WriteMessage : React.FC<IWriteMessage> = ({ pushMessage }) => {
  const inputRef = React.useRef(null)

  const writeMessageHandler = async (event : any) => {
    event.preventDefault()

    const input : any = inputRef.current
    const message = input ? input.value : ''

    if (!message) {
      if (input) {
        input.focus()
      }

      return
    }

    const createdMessage = await Services.messages.send(message)

    input.value = ''
    input.focus()
    pushMessage(createdMessage)
  }
  return (
    <div className='chat-footer'>
      <input type='text' className='send-input' ref={inputRef} autoFocus />
      <button type='submit' className='send-button' onClick={writeMessageHandler}>{'>>'}</button>
    </div>
  )
}

const plotMessage = (currentUser : string) => (message : any) => {
  const time = moment(message.sentDate + ' ' + message.sentHour, ISO_MASK)

  if (message.author && !message.status) {
    const sameUser = currentUser === message.author
    const className = sameUser ? 'sent-message' : 'received-message'

    const editedLabel = message.edited && !message.excluded? ', edited' : ''
    const excludedLabel = message.excluded ? ', excluded' : ''

    return (
      <div className={className} key={message._id}>
        <span className='message-author'>{sameUser ? 'You' : message.author}</span>
        {editedLabel ? (<span className='message-edited'>{editedLabel}</span>) : null}
        {excludedLabel ? (<span className='message-excluded'>{excludedLabel}</span>) : null}

        <br/>
        <span className='message-content'>{message.content}</span><br/>
        <span className='message-hour'>{time.format('HH:mm')} | </span>
        <span className='message-date'>{time.format('MMM DD, YYYY')}</span>
      </div>
    )
  }

  return (
    <div className={'status-message'} key={message._id}>
      <span className='message-content'>{message.content}</span><br/>
      <span className='message-hour'>{time.format('HH:mm')} | </span>
      <span className='message-date'>{time.format('MMM DD, YYYY')}</span>
    </div>
  )
}

interface IChannelMessages {
  messages : any[],
  user : string
}

const ChannelMessages : React.FC<IChannelMessages> = ({ messages, user }) => {
  if (messages && messages.length) {
    return (
      <div className='chat-content'>
        <ScrollableFeed>
          {messages.map(plotMessage(user))}
        </ScrollableFeed>
      </div>
    )
  } else {
    return (
      <Spinner name='circle' color='white' className='no-border no-outline'/>
    )
  }
}

const Chat : React.FC<IChat> = ({ exitChat }) => {
  const [current, update] = React.useState({
    user: localStorage.getItem('nickname') || '',
    messages: []
  })

  React.useEffect(() => {
    const loadMessages = async () => {
      const messages = await Services.messages.list()

      update(state => {
        return { ...state, messages }
      })
    }

    if (current.messages && current.messages.length) {
      setTimeout(loadMessages, 5000) // para não sobrecarregar a cota free do Heroku
    } else {
      loadMessages()
    }
  }, [current.messages])

  const pushMessage = (message : any) => {
    const messages = JSON.parse(JSON.stringify(current.messages))

    messages.push(message)

    update(state => {
      return { ...state, messages }
    })
  }

  return (
    <div className='chat-container'>
      <ChannelHeader exitChat={exitChat}/>
      <ChannelMessages messages={current.messages} user={current.user}/>
      <WriteMessage pushMessage={pushMessage}/>
    </div>
  )
}

export default Chat
