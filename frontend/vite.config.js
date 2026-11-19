import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Security-Policy': "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval' blob: https://checkout.razorpay.com; style-src * 'unsafe-inline' https://fonts.googleapis.com; font-src * data: https://fonts.gstatic.com; img-src * data: blob: https:; connect-src * ws: wss:; frame-src * https://checkout.razorpay.com https://api.razorpay.com;"
    }
  }
})
