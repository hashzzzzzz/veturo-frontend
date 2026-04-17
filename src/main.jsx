import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'

const googleClientId =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "538620980600-32ql7i28jnchnkeekimm5lg3m1pktd8a.apps.googleusercontent.com";

createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <App />
  </GoogleOAuthProvider>,
)
