// Nano SaaS Dashboard JavaScript
(function () {
  "use strict";

  // Wait for DOM to be ready
  document.addEventListener("DOMContentLoaded", function () {
    console.log("📊 Nano SaaS Dashboard loaded");

    // Initialize dashboard features
    initializeDashboard();
  });

  function initializeDashboard() {
    // Add any dashboard-specific functionality here
    console.log("✅ Dashboard initialized");
  }

  // Global functions for dashboard
  window.upgradeAccount = async function () {
    try {
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Error creating checkout session. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error upgrading account. Please try again.");
    }
  };

  window.loadUserData = async function () {
    try {
      const response = await fetch("/api/me");
      const data = await response.json();

      if (data.user) {
        // Update UI with latest user data if needed
        console.log("User data loaded:", data.user);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };
})();
