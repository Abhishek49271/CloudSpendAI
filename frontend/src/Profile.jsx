import { useEffect, useMemo, useRef, useState } from "react";

function getCurrentEmail() {
  const token = localStorage.getItem("cloudspendai_token");
  if (!token) return "";

  try {
    const payloadPart = token.split(".")[1];
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(padded));
    return payload.sub || payload.email || "";
  } catch {
    return localStorage.getItem("cloudspendai_user") || "";
  }
}

const defaults = {
  displayName: "CloudSpend User",
  jobTitle: "Cloud Cost Analyst",
  department: "Engineering",
  phone: "",
  timezone: "Asia/Kolkata",
  bio: "Tell your team a little about yourself.",
  emailUpdates: true,
  anomalyAlerts: true,
  weeklyDigest: true,
};

function Profile({ userRole = "USER", onNavigate }) {
  const email = useMemo(() => getCurrentEmail(), []);
  const photoInputRef = useRef(null);
  const [profile, setProfile] = useState(defaults);
  const [photo, setPhoto] = useState("");
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("cloudspendai_profile") || "{}");
      setProfile({ ...defaults, ...stored });
      setPhoto(localStorage.getItem("cloudspendai_profile_photo") || "");
    } catch {
      setProfile(defaults);
    }
  }, []);

  const initials = (profile.displayName || "CU")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  function update(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
    setSaved(false);
  }

  function handlePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      window.alert("Please choose an image smaller than 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || "");
      setPhoto(value);
      localStorage.setItem("cloudspendai_profile_photo", value);
    };
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    setPhoto("");
    localStorage.removeItem("cloudspendai_profile_photo");
  }

  function saveProfile() {
    localStorage.setItem("cloudspendai_profile", JSON.stringify(profile));
    window.dispatchEvent(new Event("cloudspend:profile-updated"));
    setEditing(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2400);
  }

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div>
          <p className="eyebrow">ACCOUNT & PERSONALIZATION</p>
          <h1>My Profile</h1>
          <p className="subtitle">Manage your identity, preferences and CloudSpend AI experience.</p>
        </div>
        <div className="profile-header-actions">
          {saved && <span className="profile-saved">✓ Changes saved</span>}
          {!editing ? (
            <button type="button" className="profile-primary-button" onClick={() => setEditing(true)}>Edit profile</button>
          ) : (
            <>
              <button type="button" className="profile-secondary-button" onClick={() => setEditing(false)}>Cancel</button>
              <button type="button" className="profile-primary-button" onClick={saveProfile}>Save changes</button>
            </>
          )}
        </div>
      </header>

      <section className="profile-hero-card">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">
            {photo ? <img src={photo} alt="Profile" /> : <span>{initials}</span>}
          </div>
          <button type="button" className="avatar-camera" onClick={() => photoInputRef.current?.click()} aria-label="Change profile photo">✎</button>
          <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhoto} hidden />
        </div>
        <div className="profile-hero-copy">
          <div className="profile-name-row">
            <h2>{profile.displayName}</h2>
            <span className="role-pill">{userRole}</span>
          </div>
          <p>{profile.jobTitle || "CloudSpend AI user"} · {profile.department || "No department"}</p>
          <span className="profile-email">{email || "Signed-in account"}</span>
          <div className="profile-photo-actions">
            <button type="button" onClick={() => photoInputRef.current?.click()}>Upload photo</button>
            {photo && <button type="button" className="danger-link" onClick={removePhoto}>Remove photo</button>}
            <small>JPG, PNG or WebP · max 5 MB · stored locally</small>
          </div>
        </div>
      </section>

      <div className="profile-grid">
        <section className="profile-card">
          <div className="profile-card-title"><div><h3>Personal information</h3><p>Keep your workspace identity up to date.</p></div><span>01</span></div>
          <div className="profile-form-grid">
            <label>Display name<input disabled={!editing} value={profile.displayName} onChange={(e) => update("displayName", e.target.value)} /></label>
            <label>Email address<input value={email} disabled readOnly /></label>
            <label>Job title<input disabled={!editing} value={profile.jobTitle} onChange={(e) => update("jobTitle", e.target.value)} /></label>
            <label>Department<input disabled={!editing} value={profile.department} onChange={(e) => update("department", e.target.value)} /></label>
            <label>Phone number<input disabled={!editing} value={profile.phone} onChange={(e) => update("phone", e.target.value)} placeholder="Optional" /></label>
            <label>Time zone<select disabled={!editing} value={profile.timezone} onChange={(e) => update("timezone", e.target.value)}><option value="Asia/Kolkata">India Standard Time</option><option value="Asia/Dubai">Gulf Standard Time</option><option value="Europe/London">United Kingdom</option><option value="America/New_York">Eastern Time</option><option value="America/Los_Angeles">Pacific Time</option></select></label>
            <label className="full-field">About you<textarea disabled={!editing} value={profile.bio} onChange={(e) => update("bio", e.target.value)} rows="4" /></label>
          </div>
        </section>

        <section className="profile-card">
          <div className="profile-card-title"><div><h3>Notifications</h3><p>Choose what CloudSpend AI sends you.</p></div><span>02</span></div>
          <div className="preference-list">
            {[
              ["emailUpdates", "Product updates", "New CloudSpend features and important product news."],
              ["anomalyAlerts", "Cost anomaly alerts", "Be notified when unusual spending is detected."],
              ["weeklyDigest", "Weekly cost digest", "Receive a compact summary of cloud spending trends."],
            ].map(([key, title, description]) => (
              <label className="preference-row" key={key}>
                <div><strong>{title}</strong><p>{description}</p></div>
                <input type="checkbox" disabled={!editing} checked={profile[key]} onChange={(e) => update(key, e.target.checked)} />
              </label>
            ))}
          </div>
        </section>

        <section className="profile-card">
          <div className="profile-card-title"><div><h3>Account & security</h3><p>Quick account information and safe actions.</p></div><span>03</span></div>
          <div className="security-list">
            <div><span>Account role</span><strong>{userRole}</strong></div>
            <div><span>Authentication</span><strong className="online-text">● JWT session active</strong></div>
            <div><span>Data location</span><strong>Local environment</strong></div>
            <div><span>Profile storage</span><strong>Browser local storage</strong></div>
          </div>
          <div className="profile-security-note">Your profile preferences and photo are stored locally in this browser. Your sign-in credentials are not editable from this page.</div>
        </section>

        <section className="profile-card profile-shortcuts">
          <div className="profile-card-title"><div><h3>Workspace shortcuts</h3><p>Jump back into the parts of CloudSpend you use most.</p></div><span>04</span></div>
          <div className="profile-shortcut-grid">
            <button type="button" onClick={() => onNavigate?.("dashboard")}><span>▦</span><div><strong>Dashboard</strong><small>Spend overview</small></div><b>→</b></button>
            <button type="button" onClick={() => onNavigate?.("analysis")}><span>◈</span><div><strong>Cost analysis</strong><small>Explore drivers</small></div><b>→</b></button>
            <button type="button" onClick={() => onNavigate?.("alerts")}><span>⚠</span><div><strong>Cost alerts</strong><small>Review anomalies</small></div><b>→</b></button>
            <button type="button" onClick={() => onNavigate?.("resources")}><span>◉</span><div><strong>Resources</strong><small>Browse infrastructure</small></div><b>→</b></button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Profile;
