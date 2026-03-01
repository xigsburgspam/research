import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import BlogPage from "./pages/BlogPage";
import AdminDashboard from "./pages/AdminDashboard";
import Navbar from "./components/Navbar";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem("admin_token"));

  const handleAdminPrompt = async () => {
    const password = window.prompt("Enter Admin Password:");
    if (!password) return;

    if (password === "Talha@2006") {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem("admin_token", data.token);
          setIsAuthenticated(true);
          alert("Login successful!");
        } else {
          alert("Server authentication failed.");
        }
      } catch (err) {
        alert("An error occurred during login.");
      }
    } else {
      alert("Invalid password.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
        <Navbar 
          isAuthenticated={isAuthenticated} 
          onLogout={handleLogout} 
          onAdminClick={handleAdminPrompt} 
        />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<BlogPage />} />
            <Route 
              path="/admin/dashboard" 
              element={isAuthenticated ? <AdminDashboard /> : <Navigate to="/" />} 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
