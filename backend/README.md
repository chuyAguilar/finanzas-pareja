# Backend — Gestor Financiero

Este directorio contiene la API en Node/Express que maneja la autenticación, grupos y transacciones.

## Variables de Entorno

Crea un archivo `.env` en este directorio con las siguientes variables:

* `DATABASE_URL`: URL de conexión de PostgreSQL. Soporta SSL condicional (ej. interno para Railway).
* `GOOGLE_WEB_CLIENT_ID`: ID del cliente web de Google Auth para la validación de tokens de login.
* `ALLOWED_ORIGINS`: Lista de orígenes de CORS permitidos separados por comas (por defecto `*`).

### Ejemplo de `.env`
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/finanzas_pareja
PORT=3000
GOOGLE_WEB_CLIENT_ID=your-client-id.apps.googleusercontent.com
ALLOWED_ORIGINS=http://localhost:8100,http://localhost:5173
```

## Comandos Disponibles

### Instalar dependencias
```bash
npm install
```

### Ejecutar en desarrollo (con recarga automática)
```bash
npm run dev
```

### Compilar TypeScript a JavaScript
```bash
npm run build
```

### Iniciar en producción
```bash
npm run start
```

### Ejecutar migraciones de base de datos
```bash
npm run migrate
```
