import { html } from "hono/html";

export const script = html`
<script>
async function manageSubscription() {
  try {
    const response = await fetch("/api/subscription/portal", {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to access billing portal");
    }

    const data = await response.json();
    window.location.href = data.url;
  } catch (error) {
    console.error(error);
    alert("Error accessing billing portal: " + error.message);
  }
}

function logout() {
  fetch("/api/auth/logout", { method: "POST" })
    .then(() => {
      window.location.href = "/";
    })
    .catch((error) => {
      console.error("Logout error:", error);
      // Fallback - redirect anyway
      window.location.href = "/";
    });
}

function toggleUserMenu() {
  const dropdown = document.getElementById("user-dropdown");
  dropdown.classList.toggle("show");
}

// Close dropdown when clicking outside
document.addEventListener("click", function (event) {
  const userMenu = document.querySelector(".user-menu");
  const dropdown = document.getElementById("user-dropdown");

  if (userMenu && !userMenu.contains(event.target)) {
    dropdown.classList.remove("show");
  }
});

async function deleteAccount() {
  const confirmed = confirm(
    "Are you sure you want to delete your account?\\n\\n" +
      "This will permanently delete:\\n" +
      "• Your account\\n" +
      "• All your data\\n" +
      "• Your subscription (if any)\\n\\n" +
      "This action cannot be undone."
  );

  if (!confirmed) return;

  const secondConfirm = confirm(
    "This is your FINAL warning.\\n\\n" +
      'Type "DELETE" in the next dialog to confirm account deletion.'
  );

  if (!secondConfirm) return;

  const deleteConfirmation = prompt(
    'Type "DELETE" (in capital letters) to confirm:'
  );

  if (deleteConfirmation !== "DELETE") {
    alert("Account deletion cancelled.");
    return;
  }

  try {
    const response = await fetch("/api/account", {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete account");
    }

    alert(
      "Your account and all associated data have been permanently deleted."
    );
    window.location.href = "/";
  } catch (error) {
    console.error("Account deletion error:", error);
    alert("Error deleting account: " + error.message);
  }
}

// Load user info for navbar
async function loadUserInfo() {
  try {
    const response = await fetch("/api/me");

    if (response.ok) {
      const data = await response.json();
      const user = data.user;

      document.getElementById("user-name").textContent = user.name;
      if (user.isPro) {
        document.getElementById("pro-badge").innerHTML =
          '<span class="pro-badge">PRO</span>';
        document.getElementById("manage-subscription-item").style.display =
          "block";
      } else {
        document.getElementById("manage-subscription-item").style.display =
          "none";
      }
    }
  } catch (error) {
    console.error("Failed to load user info:", error);
  }
}

window.updateHeaderSubscriptionStatus = function (isPro) {
  if (isPro) {
    document.getElementById("pro-badge").innerHTML =
      '<span class="pro-badge">PRO</span>';
    document.getElementById("manage-subscription-item").style.display = "block";
  } else {
    document.getElementById("pro-badge").innerHTML = "";
    document.getElementById("manage-subscription-item").style.display = "none";
  }
};

loadUserInfo();
</script>
`;
