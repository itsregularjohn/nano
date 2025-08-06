import { styles } from "./styles";
import { script } from "./script";

export const DashboardPage = ({ user }: { user: any }) => {
  return (
    <>
      {styles}
      
      <div class="dashboard-container">
        <div class="dashboard-header">
          <div>
            <h1 class="dashboard-title">Welcome back, {user.name}!</h1>
            <p class="item-meta">Your personalized dashboard</p>
          </div>
          {user.isPro ? (
            <div class="pro-badge">
              ✨ PRO
            </div>
          ) : (
            <button 
              onclick="upgradeAccount()"
              class="new-item-btn"
            >
              🚀 Upgrade to Pro
            </button>
          )}
        </div>
        
        {/* Main content area */}
        <div class="item-card">
          <div>
            <h3>🚀 Ready to Build</h3>
            <p class="item-meta">Your application is deployed and ready for development!</p>
          </div>
        </div>
      </div>

      {script}
    </>
  )
}
