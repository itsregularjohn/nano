import { html } from "hono/html";

export const styles = html`<style>
body {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    sans-serif;
  margin: 0;
  background: linear-gradient(135deg, #ff7f7f 0%, #ff6b9d 50%, #c44569 100%);
  min-height: 100vh;
  color: #2d3748;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 15px 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(196, 69, 105, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.nav-brand {
  font-size: 24px;
  font-weight: bold;
  color: #c44569;
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 20px;
  align-items: center;
  position: relative;
}

.nav-link {
  color: #666;
  text-decoration: none;
  padding: 8px 15px;
  border-radius: 5px;
  transition: background 0.2s;
}

.nav-link:hover {
  background: rgba(255, 127, 127, 0.1);
  color: #c44569;
}

.nav-link.active {
  background: #ff6b9d;
  color: white;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #666;
  font-weight: 500;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.logout-btn {
  background: none;
  border: 1px solid #f87171;
  color: #f87171;
  padding: 5px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.logout-btn:hover {
  background: #f87171;
  color: white;
}

.pro-badge {
  background: linear-gradient(135deg, #ff6b9d, #c44569);
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
}

.user-menu {
  position: relative;
  display: inline-block;
}

.user-menu-button {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background 0.2s;
}

.user-menu-button:hover {
  background: rgba(255, 127, 127, 0.1);
  color: #c44569;
}

.user-dropdown {
  display: none;
  position: absolute;
  right: 0;
  top: 100%;
  background: white;
  border: 1px solid rgba(255, 127, 127, 0.2);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(196, 69, 105, 0.15);
  min-width: 200px;
  z-index: 1000;
  margin-top: 5px;
}

.user-dropdown.show {
  display: block;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 10px 15px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 14px;
  color: #333;
}

.dropdown-item:hover {
  background: rgba(255, 127, 127, 0.1);
  color: #c44569;
}

.dropdown-item.danger {
  color: #e74c3c;
}

.dropdown-item.danger:hover {
  background: rgba(231, 76, 60, 0.1);
  color: #c0392b;
}
</style>`;
