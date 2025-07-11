import { StrictMode } from 'react'
import {BrowserRouter as Router} from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import  { Toaster } from 'react-hot-toast';
import './index.css'
import App from './App'
createRoot(document.getElementById('root')).render(
  <Router>
    <App />
    <Toaster position='top-center' reverseOrder={false} />
  </Router>
    
  
)
