import './App.css'
import Page from './Page'
import { BrowserRouter } from 'react-router-dom'

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Page />
      </BrowserRouter>
    </div>
  )
}

export default App
