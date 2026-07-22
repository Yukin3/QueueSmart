import React, { useState } from "react";

export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
  });
  const [errors, setErrors] = useState({});

  const isRegister = mode === "register";

  function updateField(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function validate() {
    const nextErrors = {};

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!form.email.includes("@")) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.password) {
      nextErrors.password = "Password is required.";
    } else if (form.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    if (isRegister && form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = "Passwords must match.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }



//TODO: use login API 
async function handleSubmit(e) {
  e.preventDefault();
  if (!validate()) return;

  const normalizedEmail = form.email.trim().toLowerCase();

  if (mode === "login") {
    try{
      const response = await fetch("http://localhost:5000/api/auth/login", {  //call login API
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }, 
        body: JSON.stringify({  //send input
          email: form.email,
          password: form.password,
        }),
    }); 

    const data = await response.json();

    if (!response.ok){
      setErrors({
        login: data.error || "Invalid login credentials! Please try again."
      });
      return;
    }


    onLogin?.(data.user);
    return;
  } catch (error){
    setErrors({
      login: "Failed to connect to backend server."
    });
    return;
  }
 }


  // Registration mock: use selected role
  onLogin?.({
    id: `mock-${Date.now()}`,
    name: form.email.split("@")[0],
    email: form.email,
    role: form.role,
    organizationId: "org-mock",
  });
}


  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">QS</div>
          <div>
            <h1>QueueSmart</h1>
          </div>
        </div>

        <h2>{isRegister ? "Sign up to get started." : "Welcome Back!"}</h2>


        <form onSubmit={handleSubmit} className="auth-form">
          <label>Email</label>
          <input
            name="email"
            type="email"
            placeholder="user@example.com"
            value={form.email}
            onChange={updateField}
          />
          {errors.email && <span className="auth-error">{errors.email}</span>}

          <label>Password</label>
          <input
            name="password"
            type="password"
            placeholder="Enter password"
            value={form.password}
            onChange={updateField}
          />
          {errors.password && <span className="auth-error">{errors.password}</span>}

          {isRegister && (
            <>
              <label>Confirm Password</label>
              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirm password"
                value={form.confirmPassword}
                onChange={updateField}
              />
              {errors.confirmPassword && (
                <span className="auth-error">{errors.confirmPassword}</span>
              )}
            </>
          )}

          {errors.login && <span className="auth-error">{errors.login}</span>}

        {isRegister && (
        <>
            <label>Role</label>
            <select name="role" value={form.role} onChange={updateField}>
            <option value="user">User</option>
            <option value="admin">Administrator</option>
            </select>
        </>
        )}

          <button type="submit" className="auth-button">
            {isRegister ? "Register" : "Login"}
          </button>
        </form>

        <p className="auth-toggle">
          {isRegister ? "Already have an account?" : "Don't have an account?"}
          <button
            type="button"
            onClick={() => {
              setMode(isRegister ? "login" : "register");
              setErrors({});
            }}
          >
            {isRegister ? "Login" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}