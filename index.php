<?php
// login.php
session_start();
require 'db.php';
$error = '';
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $user = trim($_POST['username']);
    $pass = $_POST['password'];
    $stmt = $conn->prepare("SELECT id, password FROM users WHERE username = ?");
    $stmt->bind_param("s", $user);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows > 0) {
        $stmt->bind_result($id, $hashed_password);
        $stmt->fetch();
        if (password_verify($pass, $hashed_password)) {
            $_SESSION['loggedin'] = true;
            $_SESSION['id'] = $id;
            $_SESSION['username'] = $user;
            header("Location: control.php");
            exit;
        } else {
            $error = "Invalid password.";
        }
    } else {
        $error = "No account found with that username.";
    }
    $stmt->close();
}
$conn->close();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Login</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --accent:    #ffcc00;
      --accent-dim:#c9a000;
      --bg:        #0b0b0f;
      --surface:   #14141a;
      --surface2:  #0e0e12;
      --border:    #22222b;
      --border2:   #2a2a35;
      --text:      #e6e6e6;
      --muted:     #888;
      --error:     #e63946;
      --font-main: 'Segoe UI', system-ui, -apple-system, sans-serif;
      --radius:    8px;
    }

    html, body {
      min-height: 100vh;
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-main);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    .card {
      width: 100%;
      max-width: 380px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 2.25rem 2rem;
    }

    .card-header {
      margin-bottom: 2rem;
    }

    .eyebrow {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 0.5rem;
    }

    .card-title {
      font-size: 22px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--text);
    }

    /* Error */
    .error-box {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: rgba(230,57,70,0.1);
      border: 1px solid rgba(230,57,70,0.3);
      border-radius: var(--radius);
      padding: 0.7rem 0.9rem;
      margin-bottom: 1.5rem;
      color: var(--error);
      font-size: 13px;
    }
    .error-box svg { flex-shrink: 0; }

    /* Fields */
    .field { margin-bottom: 1.1rem; }

    label {
      display: block;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 6px;
    }

    .input-wrap { position: relative; }

    .input-wrap .icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--muted);
      pointer-events: none;
      transition: color 0.2s;
    }

    .input-wrap:focus-within .icon { color: var(--accent); }

    input[type="text"],
    input[type="password"] {
      width: 100%;
      background: var(--surface2);
      border: 1px solid var(--border2);
      border-radius: var(--radius);
      padding: 10px 12px 10px 38px;
      color: var(--text);
      font-family: var(--font-main);
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
      -webkit-appearance: none;
    }

    input[type="text"]:focus,
    input[type="password"]:focus {
      border-color: #555;
    }

    .toggle-pw {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      color: var(--muted);
      padding: 0;
      line-height: 0;
      transition: color 0.2s;
    }
    .toggle-pw:hover { color: var(--accent); }

    /* Submit */
    .btn-submit {
      width: 100%;
      margin-top: 0.75rem;
      padding: 10px 16px;
      background: var(--accent);
      color: #1a1a1a;
      border: 1px solid var(--accent);
      border-radius: var(--radius);
      font-family: var(--font-main);
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      cursor: pointer;
      transition: background 0.2s, transform 0.15s;
    }
    .btn-submit:hover {
      background: #ffe066;
      transform: translateY(-1px);
    }
    .btn-submit:active { transform: translateY(0); }

    @media (max-width: 440px) {
      .card { padding: 1.75rem 1.25rem; }
    }
  </style>
</head>
<body>

<div class="card">
  <div class="card-header">
    <p class="eyebrow">Control Panel</p>
    <h1 class="card-title">Sign In</h1>
  </div>

  <?php if ($error): ?>
  <div class="error-box">
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    <?= htmlspecialchars($error) ?>
  </div>
  <?php endif; ?>

  <form method="POST" action="">

    <div class="field">
      <label for="username">Username</label>
      <div class="input-wrap">
        <svg class="icon" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
        <input type="text" id="username" name="username"
               placeholder="your_username"
               value="<?= htmlspecialchars($_POST['username'] ?? '') ?>"
               autocomplete="username" required>
      </div>
    </div>

    <div class="field">
      <label for="password">Password</label>
      <div class="input-wrap">
        <svg class="icon" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <input type="password" id="password" name="password"
               placeholder="••••••••"
               autocomplete="current-password" required>
        <button type="button" class="toggle-pw" aria-label="Toggle password" onclick="togglePw(this)">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </div>
    </div>

    <button type="submit" class="btn-submit">Sign In</button>

  </form>
</div>

<script>
  function togglePw(btn) {
    const input = btn.closest('.input-wrap').querySelector('input');
    input.type = input.type === 'password' ? 'text' : 'password';
    btn.style.color = input.type === 'text' ? 'var(--accent)' : '';
  }
</script>
</body>
</html>