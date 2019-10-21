import React from 'react'
import Services from '../services'
import './Login.css'

interface ILogin {
  enterChat : () => void
}

const Login : React.FC<ILogin> = ({ enterChat }) => {
  const inputRef = React.useRef(null)

  const enterChatHandler = async (event : any) => {
    event.preventDefault()

    const input : any = inputRef.current
    const nickname = input ? input.value : ''
    if (!nickname) {
      return
    }

    await Services.sessions.enter(nickname)
    enterChat()
  }

  return (
    <div className='enter-container'>
      <input type='text' ref={inputRef} autoFocus className='enter-input' maxLength={50} />
      <button type='submit' onClick={enterChatHandler} className='enter-button'>Enter</button>
    </div>
  )
}

export default Login
