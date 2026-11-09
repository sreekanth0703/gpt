import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App.jsx'
import ChatPage from './ChatPage.jsx' // Rename the chat code file to ChatPage.jsx
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Redirect root or map to a landing/home page */}
        <Route path="/" element={<Navigate to="/chat" replace />} />
        
        {/* Your Chat Page Route */}
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)