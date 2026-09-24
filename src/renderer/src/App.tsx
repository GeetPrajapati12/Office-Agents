import React from 'react'
import { TitleBar } from './components/layout/TitleBar'
import { MainLayout } from './components/layout/MainLayout'

function App() {
  const handleMinimize = () => {
    window.api.window.minimize()
  }

  const handleMaximize = () => {
    window.api.window.maximize()
  }

  const handleClose = () => {
    window.api.window.close()
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TitleBar
        onMinimize={handleMinimize}
        onMaximize={handleMaximize}
        onClose={handleClose}
      />
      <MainLayout />
    </div>
  )
}

export default App
