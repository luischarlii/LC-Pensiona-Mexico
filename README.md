# LC Pensiona México — versión 0.1.0

Aplicación web estática para GitHub Pages, adaptable a iPhone y con modo PWA básico.

## Estado real de esta entrega

- Formulario guiado de tres pasos.
- Orientación preliminar por institución y fecha de primera cotización.
- Descarga local de un reporte TXT.
- Reglas separadas en `rules/rules.json`.
- Sin cuenta, sin Supabase y sin envío ni persistencia de los datos capturados.
- No calcula importes de pensión, costos de Modalidad 40 ni declara una modalidad ganadora.
- El archivo `supabase/schema.sql` es una propuesta para una fase posterior; no ejecutarlo en bases de datos existentes.

## Publicar desde iPhone

1. Abre GitHub en Safari e inicia sesión.
2. Pulsa `+` y crea un repositorio llamado `LC-Pensiona-Mexico`.
3. Para el repositorio, elige `Public` si quieres usar GitHub Pages gratuito sin restricciones de plan.
4. Entra al repositorio y pulsa **Add file → Upload files**.
5. Sube todos los archivos y carpetas de este paquete conservando esta estructura:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `manifest.json`
   - `icon.svg`
   - `sw.js`
   - `rules/rules.json`
   - `supabase/schema.sql`
   - `README.md`
6. Pulsa **Commit changes**.
7. En el repositorio abre **Settings → Pages**.
8. En **Build and deployment**, selecciona **Deploy from a branch**.
9. Elige la rama `main` y la carpeta `/(root)`, y pulsa **Save**.
10. Espera la publicación y abre la URL que GitHub Pages muestre en esa pantalla. Normalmente tendrá la forma `https://TU-USUARIO.github.io/LC-Pensiona-Mexico/`; no asumas que está activa hasta verla en GitHub.
11. En iPhone, abre la URL en Safari, pulsa **Compartir → Añadir a pantalla de inicio**.

## Probar la beta

- Completa los tres pasos.
- Revisa que la recomendación no dé importes ni afirme derechos definitivos.
- Pulsa **Descargar reporte .txt**. En iOS, Safari puede mostrar una vista previa o abrir el menú de compartir.
- Prueba una fecha anterior y otra posterior al 1 de julio de 1997.
- Prueba ISSSTE, otra institución y datos opcionales vacíos.

## Reglas legales y actualización

`rules/rules.json` es la fuente de reglas de orientación de la interfaz. Los parámetros que no se han validado están expresamente marcados como no implementados. No añadas fórmulas o tasas copiadas de blogs. Antes de activar cálculos, documenta:
1. Artículo y disposición aplicable.
2. URL oficial y fecha de consulta.
3. Fecha de vigencia.
4. Ejemplos de prueba con resultado comprobable.
5. Revisión independiente y prueba de regresión.

Fuentes de partida:
- https://www.imss.gob.mx/pensiones
- https://www.imss.gob.mx/tramites/imss02007
- https://www.consar.gob.mx/gobmx/aplicativo/calculadora/Calculadoras/
- https://www.gob.mx/issste
- https://www.diputados.gob.mx/LeyesBiblio/

## Fase Supabase (no activada)

1. Crea un proyecto Supabase separado para LC Pensiona México.
2. En el SQL Editor ejecuta `supabase/schema.sql` solo en ese proyecto nuevo.
3. Revisa que RLS siga activado y prueba con dos cuentas distintas.
4. No agregues `service_role` a ningún archivo frontend.
5. La beta no necesita credenciales; no configures conexión hasta que se implemente el flujo de cuenta opcional.

## Limitaciones

Esta aplicación es una herramienta informativa, no asesoría legal, cálculo oficial ni resolución del IMSS/ISSSTE/AFORE. Los datos capturados no se guardan al salir de la página. La PWA ofrece una caché básica, pero el análisis puede requerir cargar el archivo de reglas; verifica la primera apertura con conexión.
