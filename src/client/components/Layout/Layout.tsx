import { styles } from "./styles";
import { script } from "./script";

export const Layout = ({ children }: { children: any }) => {
  return (
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Nano SaaS</title>
        
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
        <meta name="msapplication-TileColor" content="#FF7F7F" />
        <meta name="msapplication-TileImage" content="/assets/ms-icon-144x144.png" />
        <meta name="theme-color" content="#FF7F7F" />
        
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {styles}
      </head>
      <body>
        <div class="container">
          <nav class="navbar">
            <a href="/" class="nav-brand">Nano</a>
            <div class="nav-links">
              <a href="/dashboard" class="nav-link">Dashboard</a>
              <div class="user-menu">
                <button onclick="toggleUserMenu()" class="user-menu-button">
                  <div class="user-info">
                    <span id="user-name"></span>
                    <span id="pro-badge"></span>
                    <span style="margin-left: 5px;">▼</span>
                  </div>
                </button>
                <div id="user-dropdown" class="user-dropdown">
                  <div id="manage-subscription-item" style="display: none;">
                    <button onclick="manageSubscription()" class="dropdown-item">Manage Subscription</button>
                    <hr style="margin: 5px 0; border: none; border-top: 1px solid #eee;" />
                  </div>
                  <button onclick="logout()" class="dropdown-item">Logout</button>
                  <hr style="margin: 5px 0; border: none; border-top: 1px solid #eee;" />
                  <button onclick="deleteAccount()" class="dropdown-item danger">Delete Account</button>
                </div>
              </div>
            </div>
          </nav>
          <main>{children}</main>
        </div>
        
        {script}
      </body>
    </html>
  )
}
