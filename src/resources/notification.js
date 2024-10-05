import Toastify from 'toastify-js'
import '@fontsource-variable/outfit';

export function showMessage (message, type = 'success') {
  Toastify({
    text: message,
    duration: 3000,
    newWindow: true,
    close: true,
    gravity: 'bottom', // `top` or `bottom`
    position: 'center', // `left`, `center` or `right`
    stopOnFocus: true, // Prevents dismissing of toast on hover
    style: {
        background: type === 'success' ? '#bc62f8' : '#f86262', // Colores en formato hexadecimal
        color: '#fff', // Opcional: color del texto
        borderRadius: '4px', // Opcional: radio de borde
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)', // Opcional: sombra
        fontFamily: "'Outfit Variable', sans-serif"
      },
    onClick: function () { } // Callback after click
  }).showToast()
}
