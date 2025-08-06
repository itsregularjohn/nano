import { styles } from "./styles";
import { script } from "./script";

export const HomePage = () => {
  return (
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Nano SaaS - Modern Full-Stack Template</title>
        
        {/* Favicon and App Icons */}
        <link rel="apple-touch-icon" sizes="57x57" href="/assets/apple-icon-57x57.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/assets/apple-icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/assets/apple-icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/assets/apple-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/assets/apple-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/assets/apple-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/assets/apple-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/assets/apple-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-icon-180x180.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/assets/android-icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/assets/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16x16.png" />
        <link rel="manifest" href="/assets/manifest.json" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="msapplication-TileImage" content="/assets/ms-icon-144x144.png" />
        <meta name="theme-color" content="#ffffff" />
        
        {/* SEO Meta Tags */}
        <meta name="description" content="A production-ready foundation for building scalable SaaS applications with modern deployment infrastructure." />
        <meta name="keywords" content="SaaS, boilerplate, Next.js, TypeScript, Stripe, AWS, serverless" />
        <meta name="author" content="Nano SaaS" />
        
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        
        {styles}
      </head>
      <body>
        <div class="container">
          <div class="hero">
            <h1>Nano SaaS Boilerplate</h1>
            <p>
              A production-ready foundation for building scalable SaaS applications. 
              Complete with authentication, payments, and modern deployment infrastructure.
            </p>
            
            <div class="cta-card">
              <h2>Get Started</h2>
              <p>
                Sign in with Google to access your dashboard.<br/>
                <small style="color: #95a5a6;">OAuth integration ready to customize!</small>
              </p>
              
              <a href="/oauth/google" class="google-btn">
                <svg class="google-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </a>
              
              <div class="features">
                <h3>What's Included</h3>
                <div class="features-grid">
                  <div class="feature">
                    <span class="feature-icon">🔐</span>
                    <span>Google OAuth</span>
                  </div>
                  <div class="feature">
                    <span class="feature-icon">💳</span>
                    Stripe Integration
                  </div>
                  <div class="feature">
                    <span class="feature-icon">🗄️</span>
                    DynamoDB + S3
                  </div>

                  <div class="feature">
                    <span class="feature-icon">⚡</span>
                    Serverless Ready
                  </div>
                  <div class="feature">
                    <span class="feature-icon">🚀</span>
                    Production Deployment
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <a href="/privacy">Privacy Policy</a> • <a href="/terms">Terms of Service</a>
          </div>
        </div>
        {script}
      </body>
    </html>
  )
}
