import { useState } from "react";
import "../styles/auth.css";

const API = `${import.meta.env.VITE_API_URL}/api/auth`;

export default function Auth({ initialMode = "login", onLogin, onSignUp }) {
  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function switchMode(nextMode) {
    setError("");
    setSuccess("");
    setShowPassword(false);
    setMode(nextMode);
  }

  async function handleLogin(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!loginData.email.trim() || !loginData.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginData.email.trim(),
          password: loginData.password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || data.error || "Invalid email or password.");
      }

      if (data.token) {
        localStorage.setItem("cloudspendai_token", data.token);
      }

      localStorage.setItem(
        "cloudspendai_user",
        JSON.stringify(data.user || data)
      );

      onLogin?.(data);
    } catch (err) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !signupData.name.trim() ||
      !signupData.email.trim() ||
      !signupData.password ||
      !signupData.confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (signupData.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: signupData.name.trim(),
          email: signupData.email.trim(),
          password: signupData.password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Unable to create account."
        );
      }

      setSuccess("Account created successfully. Welcome to CloudSpendAI.");

      setSignupData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        switchMode("login");
        setLoginData({
          email: signupData.email.trim(),
          password: "",
        });
        onSignUp?.(data);
      }, 1200);
    } catch (err) {
      setError(err.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-grid"></div>

      <div className="auth-glow auth-glow-one"></div>
      <div className="auth-glow auth-glow-two"></div>
      <div className="auth-glow auth-glow-three"></div>

      <div className="auth-orbit orbit-one"></div>
      <div className="auth-orbit orbit-two"></div>

      <div className="auth-shell">

        {/* LEFT LANDING SECTION */}
        <section className="auth-landing">

          <div className="brand">
            <div className="brand-icon">
              <svg viewBox="0 0 64 64" aria-hidden="true">
                <path
                  d="M18 46h28c7 0 12-5 12-12 0-6-4-11-10-12-2-9-9-14-18-14-9 0-16 6-18 15-7 1-12 6-12 13 0 6 5 10 10 10h8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  d="M22 38l7-7 6 5 10-13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M45 23h-7M45 23v7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div>
              <div className="brand-name">
                CloudSpend<span>AI</span>
              </div>
              <div className="brand-tagline">
                Smarter cloud. Lower costs.
              </div>
            </div>
          </div>

          <div className="landing-copy">
            <div className="eyebrow">
              <span className="pulse-dot"></span>
              AI-POWERED CLOUD COST MANAGEMENT
            </div>

            <h1>
              Take control of
              <br />
              <span>your cloud costs.</span>
            </h1>

            <p>
              Monitor spending, discover savings opportunities, and make
              smarter cloud decisions from one powerful workspace.
            </p>
          </div>

          <div className="feature-list">

            <div className="feature-item">
              <div className="feature-icon">↗</div>
              <div>
                <strong>Real-time cost visibility</strong>
                <span>Understand where your cloud money goes.</span>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">✦</div>
              <div>
                <strong>AI-powered insights</strong>
                <span>Find optimization opportunities faster.</span>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">✓</div>
              <div>
                <strong>Actionable recommendations</strong>
                <span>Turn insights into measurable savings.</span>
              </div>
            </div>

          </div>

          {/* ANIMATED CLOUD VISUAL */}
          <div className="cloud-visual">

            <div className="cloud-glow"></div>

            <div className="cloud-shape">
              <div className="cloud-symbol">☁</div>

              <div className="cloud-arrow">
                ↑
              </div>
            </div>

            <div className="floating-card card-cost">
              <span>MONTHLY COST</span>
              <strong>$12,458</strong>
              <small>↓ 18% optimized</small>
            </div>

            <div className="floating-card card-ai">
              <span>AI INSIGHT</span>
              <strong>24 savings</strong>
              <small>opportunities found</small>
            </div>

            <div className="data-line line-one"></div>
            <div className="data-line line-two"></div>
            <div className="data-line line-three"></div>

          </div>

          <div className="landing-bottom">
            <div>
              <strong>MONITOR</strong>
              <span>Track spending</span>
            </div>

            <div>
              <strong>ANALYZE</strong>
              <span>Find patterns</span>
            </div>

            <div>
              <strong>OPTIMIZE</strong>
              <span>Save money</span>
            </div>
          </div>

        </section>

        {/* AUTH SECTION */}
        <section className={`auth-panel ${mode === "signup" ? "signup-mode" : ""}`}>

          <div className="auth-card">

            <div className="auth-card-top">
              <div className="welcome-badge">
                <span>✦</span>
                {mode === "login" ? "Welcome back" : "Get started"}
              </div>

              <div className="security-badge">
                <span className="security-dot"></span>
                Secure
              </div>
            </div>

            <div className="auth-heading">
              <div className="mini-cloud">☁</div>

              <h2>
                {mode === "login"
                  ? "Sign in to CloudSpendAI"
                  : "Create your CloudSpendAI account"}
              </h2>

              <p>
                {mode === "login"
                  ? "Continue managing your cloud infrastructure and spending."
                  : "Start making smarter cloud cost decisions today."}
              </p>
            </div>

            {error && (
              <div className="auth-message auth-error">
                <span>!</span>
                {error}
              </div>
            )}

            {success && (
              <div className="auth-message auth-success">
                <span>✓</span>
                {success}
              </div>
            )}

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="auth-form">

                <label>
                  Email address
                  <div className="input-wrap">
                    <span className="input-icon">@</span>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={loginData.email}
                      onChange={(e) =>
                        setLoginData({
                          ...loginData,
                          email: e.target.value,
                        })
                      }
                      autoComplete="email"
                    />
                  </div>
                </label>

                <label>
                  Password
                  <div className="input-wrap">
                    <span className="input-icon">⌁</span>

                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) =>
                        setLoginData({
                          ...loginData,
                          password: e.target.value,
                        })
                      }
                      autoComplete="current-password"
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </label>

                <div className="form-options">
                  <label className="remember">
                    <input type="checkbox" />
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    className="forgot-button"
                    onClick={() =>
                      setError("Password recovery will be available soon.")
                    }
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="auth-submit"
                  disabled={loading}
                >
                  <span>
                    {loading ? "Signing in..." : "Sign in"}
                  </span>
                  <b>→</b>
                </button>

              </form>
            ) : (
              <form onSubmit={handleSignup} className="auth-form">

                <label>
                  Full name
                  <div className="input-wrap">
                    <span className="input-icon">◉</span>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={signupData.name}
                      onChange={(e) =>
                        setSignupData({
                          ...signupData,
                          name: e.target.value,
                        })
                      }
                      autoComplete="name"
                    />
                  </div>
                </label>

                <label>
                  Email address
                  <div className="input-wrap">
                    <span className="input-icon">@</span>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={signupData.email}
                      onChange={(e) =>
                        setSignupData({
                          ...signupData,
                          email: e.target.value,
                        })
                      }
                      autoComplete="email"
                    />
                  </div>
                </label>

                <label>
                  Password
                  <div className="input-wrap">
                    <span className="input-icon">⌁</span>

                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={signupData.password}
                      onChange={(e) =>
                        setSignupData({
                          ...signupData,
                          password: e.target.value,
                        })
                      }
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </label>

                <label>
                  Confirm password
                  <div className="input-wrap">
                    <span className="input-icon">✓</span>

                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Repeat your password"
                      value={signupData.confirmPassword}
                      onChange={(e) =>
                        setSignupData({
                          ...signupData,
                          confirmPassword: e.target.value,
                        })
                      }
                      autoComplete="new-password"
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  className="auth-submit"
                  disabled={loading}
                >
                  <span>
                    {loading ? "Creating account..." : "Create account"}
                  </span>
                  <b>→</b>
                </button>

              </form>
            )}

            <div className="auth-divider">
              <span></span>
              <small>OR</small>
              <span></span>
            </div>

            <div className="auth-switch">

              {mode === "login" ? (
                <>
                  <span>Don't have an account?</span>
                  <button
                    type="button"
                    onClick={() => switchMode("signup")}
                  >
                    Create an account →
                  </button>
                </>
              ) : (
                <>
                  <span>Already have an account?</span>
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                  >
                    ← Sign in
                  </button>
                </>
              )}

            </div>

            <div className="auth-footer">
              <span>CloudSpendAI</span>
              <span>•</span>
              <span>Intelligent cloud cost management</span>
            </div>

          </div>

        </section>

      </div>
    </main>
  );
}