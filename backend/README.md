# Backend - Gestor Financiero (Pareja)

Este es el backend de la aplicación del Gestor Financiero para Parejas, construido con Node.js, Express y PostgreSQL.

## Variables de Entorno

Para ejecutar el servidor localmente o en producción (ej. Railway), debes configurar las siguientes variables de entorno:

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Cadena de conexión de la base de datos PostgreSQL | `postgresql://postgres:password@localhost:5432/finanzas` |
| `GOOGLE_WEB_CLIENT_ID` | Client ID de Google Web para autenticación OAuth | `12345678-abc.apps.googleusercontent.com` |
| `ALLOWED_ORIGINS` | Orígenes CORS permitidos (lista separada por comas) | `http://localhost:8100,https://finanzas.railway.app` |
| `PORT` | Puerto de escucha del servidor (inyectado por Railway) | `3000` |

## Comandos Disponibles

En el directorio del backend, puedes ejecutar los siguientes comandos:

* **Instalación de Dependencias**:
  ```bash
  npm install
  ```

* **Modo Desarrollo** (recarga en caliente con ts-node-dev):
  ```bash
  npm run dev
  ```

* **Construcción para Producción** (compilación TypeScript a JavaScript):
  ```bash
  npm run build
  ```

* **Iniciar Servidor en Producción**:
  ```bash
  npm run start
  ```

* **Ejecutar Migración de Base de Datos** (creación del esquema SQL):
  ```bash
  npm run migrate
  ```
