import React from 'react'
import './App.css'
import ChatView from './views/Chat'
import LoginView from './views/Login'

const App: React.FC = () => {
  const hasNickname = !!localStorage.getItem('nickname')
  const hasBasicKey = !!localStorage.getItem('basic-key')

  const [current, update] = React.useState({
    sessionActive: hasNickname && hasBasicKey,
  })

  const enterChat = () => {
    update(state => {
      return { ...state, sessionActive: true }
    })
  }

  const exitChat = () => {
    update(state => {
      return { ...state, sessionActive: false }
    })
  }

  const mode = current.sessionActive ? 'chat' : 'login'

  return (
    <React.StrictMode>
      <div className={'app-container app-container-' + mode}>{
        current.sessionActive ?
        (<ChatView exitChat={exitChat} />) :
        (<LoginView enterChat={enterChat} />)
      }</div>
    </React.StrictMode>
  );
}

export default App;
