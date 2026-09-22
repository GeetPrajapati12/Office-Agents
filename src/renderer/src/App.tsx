import React from 'react'
import { TitleBar } from './components/layout/TitleBar'
import { MainLayout } from './components/layout/MainLayout'

function App() {
  const handleMinimize = () => {
    // TODO: Wire up IPC for window controls
    console.log('Minimize')
  }

  const handleMaximize = () => {
    console.log('Maximize')
  }

  const handleClose = () => {
    console.log('Close')
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
