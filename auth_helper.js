// Quick authentication test and login helper
const API_BASE_URL = "http://localhost:8000";

// Function to test current authentication
async function testCurrentAuth() {
  const token = localStorage.getItem("token");
  console.log("🔐 Current token:", token ? "Present" : "Missing");

  if (!token) {
    console.warn("❌ No token found. User needs to login.");
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const user = await response.json();
      console.log("✅ Current user:", user);
      console.log("👤 User role:", user.role?.name);
      return user;
    } else {
      console.warn("❌ Token invalid or expired");
      return null;
    }
  } catch (error) {
    console.error("❌ Auth check failed:", error);
    return null;
  }
}

// Function to login as superadmin
async function loginAsSuperAdmin() {
  try {
    console.log("🔑 Attempting to login as SuperAdmin...");

    const response = await fetch(`${API_BASE_URL}/auth/login-json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "superadmin",
        password: "SuperAdmin@123",
      }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      console.log("✅ SuperAdmin login successful!");
      console.log("👤 User:", data.user);
      return data;
    } else {
      const error = await response.json();
      console.error("❌ Login failed:", error);
      return null;
    }
  } catch (error) {
    console.error("❌ Login error:", error);
    return null;
  }
}

// Main execution
(async () => {
  console.log("🚀 Authentication Helper Started");
  console.log("================================");

  // Check current auth status
  const currentUser = await testCurrentAuth();

  if (!currentUser || currentUser.role?.name?.toLowerCase() !== "superadmin") {
    console.log("🔄 Need to login as SuperAdmin...");

    // Login as superadmin
    const loginResult = await loginAsSuperAdmin();

    if (loginResult) {
      console.log("🎉 Ready! You can now create schemes.");
      console.log("🔄 Please refresh the page and try again.");
    } else {
      console.error("💥 Failed to login. Please check credentials.");
    }
  } else {
    console.log(
      "✅ Already logged in as SuperAdmin. You should be able to create schemes."
    );
  }
})();
