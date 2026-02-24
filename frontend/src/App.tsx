import { Toaster } from 'react-hot-toast'
import { useConnectionStore } from './store/connectionStore'
import ConnectPage from './pages/ConnectPage'
import Dashboard from './pages/Dashboard'

export default function App() {
  const { connected } = useConnectionStore()
  return (
    <>
      {connected ? <Dashboard /> : <ConnectPage />}
      <Toaster position="top-right" toastOptions={{
        className: '!rounded-xl !text-sm !shadow-lg',
        duration: 3500,
      }} />
    </>
  )
}
