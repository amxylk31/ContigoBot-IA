// Mostrar/Ocultar contraseña
const eye = document.getElementById('eye');
const passwordInput = document.getElementById('password');

eye.addEventListener("click", function() {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    eye.style.opacity = 0.8;
  } else {
    passwordInput.type = "password";
    eye.style.opacity = 0.2;
  }
});