import React from 'react'
// import logo from './logo.svg'
import './App.css'
// import Services from './services'
import ChatView from './views/Chat'
import LoginView from './views/Login'

/*
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.tsx</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
*/

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

  return (
    <React.StrictMode>
      <div className='app-container'>{
        current.sessionActive ?
        (<ChatView exitChat={exitChat} />) :
        (<LoginView enterChat={enterChat} />)
      }</div>
    </React.StrictMode>
  );
}

export default App;
