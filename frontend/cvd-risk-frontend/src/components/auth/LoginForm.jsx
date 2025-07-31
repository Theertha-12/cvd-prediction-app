import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      const detail = err.response?.data?.detail;
      let msg = "Login failed";
      if (typeof detail === "string") msg = detail;
      else if (Array.isArray(detail)) msg = detail.map(d => d.msg).join(", ");
      else if (detail?.msg) msg = detail.msg;
      else if (err.message) msg = err.message;
      setError(msg);
    }
  };

  return (
    <form className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow" onSubmit={handleSubmit}>
      <h2 className="text-2xl mb-6 font-semibold text-center">Sign In</h2>
      {error && <p className="mb-4 text-red-600">{error}</p>}
      <div className="mb-4">
        <label className="block mb-1 font-medium">Email</label>
        <input
          type="email"
          className="w-full border rounded px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
      </div>
      <div className="mb-6">
        <label className="block mb-1 font-medium">Password</label>
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        Login
      </button>
      <p className="mt-4 text-center text-sm">
        Don’t have an account?{" "}
        <Link to="/register" className="text-blue-600 hover:underline">
          Register here
        </Link>
      </p>
    </form>
  );
};

export default LoginForm;




