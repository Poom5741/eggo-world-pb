// Force hard redirect to localhost for local dev
const redirectWithAuth = `http://localhost:3000/auth/line?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&user=${encodeURIComponent(JSON.stringify({
    id: user.id,
    email: user.email,
    name: user.name
  }))}`;
window.location.href = redirectWithAuth;
