/**
 * Puente entre Angular y el SDK de PagoPlux.
 * Se carga mediante la clave "scripts" de angular.json para que
 * esté disponible de forma global antes de que arranque la app.
 */

function iniciarDatos(dataPago) {
  if (typeof Data !== 'undefined' && Data) {
    Data.init(dataPago);
  } else {
    throw new Error('PagoPlux SDK no disponible');
  }
}

function reload(data) {
  if (typeof Data !== 'undefined' && Data) {
    Data.reload(data);
  }
}
