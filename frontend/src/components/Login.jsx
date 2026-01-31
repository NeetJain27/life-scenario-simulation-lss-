import { useState } from "react";
import { login, register } from "../api/auth";

export default function Login({ onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(isRegister) {
    try {
      setError("");
      if (isRegister) {
        await register(email, password);
      }
      await login(email, password);
      onAuth();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      <h2>Login / Register</h2>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={() => handleLogin(false)}>Login</button>
      <button onClick={() => handleLogin(true)}>Register</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
