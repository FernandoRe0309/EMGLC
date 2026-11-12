/* =====================================================================
   CONFIGURACIÓN DEL MANUAL DE SEÑALIZACIÓN
   Este es el ÚNICO archivo que hay que editar para conectar con SharePoint.
   ===================================================================== */

window.TABLERO_CONFIG = {

  // 1) URL de la carpeta de SharePoint donde se guardarán las fotos.
  //    Abre la carpeta en SharePoint y copia la dirección del navegador
  //    (o usa "Copiar vínculo" sobre la carpeta) y pégala entre las comillas.
  //    Dentro de esa carpeta se crean solas las subcarpetas:
  //        <Formato>/<Área>/<foto>.jpg     por ejemplo  W2/Carnes/Alergenos.jpg
  //    y el archivo tablero.json con la distribución.
  sharepointFolderUrl: '',

  // 2) Datos de la app registrada por TI en Microsoft Entra ID (una sola vez).
  //    Sirven para que cada persona inicie sesión con su cuenta de la empresa;
  //    nadie tiene que pegar tokens. Ver README.md → "Registro de la app".
  clientId: '',   // "Application (client) ID", p. ej. 1a2b3c4d-....
  tenantId: '',   // "Directory (tenant) ID" o el dominio, p. ej. miempresa.onmicrosoft.com

};
