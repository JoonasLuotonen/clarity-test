// app/layout.js
import './globals.css';

export const metadata = {
  title: 'Clarity Test 2.0',
  description: 'AI-enhanced clarity + conversion quick test',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
        {children}
      </body>
    </html>
  );
}
