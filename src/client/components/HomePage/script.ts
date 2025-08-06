import { html } from "hono/html";

export const script = html`
<script>
(function () {
  "use strict";

  // Wait for DOM to be ready
  document.addEventListener("DOMContentLoaded", function () {
    console.log("🚀 Nano SaaS Homepage loaded");

    // Add smooth scroll behavior for any anchor links
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
      });
    });

    // Add click analytics (placeholder for future implementation)
    const ctaButton = document.querySelector(".google-btn");
    if (ctaButton) {
      ctaButton.addEventListener("click", function () {
        console.log("📊 CTA clicked: Google OAuth");
        // Future: Add analytics tracking here
      });
    }

    // Add feature card hover effects
    const features = document.querySelectorAll(".feature");
    features.forEach((feature) => {
      feature.addEventListener("mouseenter", function () {
        this.style.transform = "translateY(-2px)";
        this.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
        this.style.transition = "all 0.2s ease";
      });

      feature.addEventListener("mouseleave", function () {
        this.style.transform = "translateY(0)";
        this.style.boxShadow = "none";
      });
    });

    // simple loading state management
    window.NanoSaaS = {
      showLoading: function (element) {
        if (element) {
          element.style.opacity = "0.6";
          element.style.cursor = "wait";
        }
      },

      hideLoading: function (element) {
        if (element) {
          element.style.opacity = "1";
          element.style.cursor = "default";
        }
      },
    };

    console.log("✅ Nano SaaS homepage initialized");
  });
})();
</script>
`;
