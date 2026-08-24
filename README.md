
# SIGEP

**Sistema Integral de Gestión de Equipamiento y Personal**

SIGEP es una aplicación web orientada a la gestión logística de personal, equipamiento, stock y asignaciones. Permite administrar el personal registrado, controlar equipamiento individual y por cantidad, gestionar provisiones y devoluciones, consultar movimientos y operar el sistema mediante autenticación segura con usuario administrador.

Repositorio:

`<span>https://github.com/Rolando-Du/sigep</span>`

---

## Características principales

### Gestión de personal

* Alta y actualización de personal.
* Consulta y búsqueda de registros.
* Visualización del equipamiento asignado.
* Estados de personal configurados en el sistema:
  * Activo
  * LEF
  * LAO
  * ETB
  * ETP
  * LAP
  * LES
  * LPM
  * LPL

### Gestión de equipamiento

SIGEP permite administrar equipamiento mediante dos formas de control:

* **INDIVIDUAL** : cada unidad posee identificación propia, por ejemplo número de serie.
* **QUANTITY** : el equipamiento se administra por cantidad y stock disponible.

Categorías disponibles:

* ARMAMENTO
* PROTECCION
* COMUNICACIONES
* MUNICION
* ACCESORIO
* OTRO

Estados de equipamiento:

* DISPONIBLE
* ASIGNADO
* EN_CUSTODIA
* EN_REPARACION
* FUERA_DE_SERVICIO
* BAJA

### Modelo logístico de asignaciones

Actualmente solo se asignan directamente al personal:

| Tipo               | Modalidad  |
| ------------------ | ---------- |
| Pistola            | Permanente |
| Chaleco Balístico | Temporaria |

El resto del equipamiento se administra como  **stock general** .

#### Provisión de pistola

La provisión de una pistola se registra de forma conjunta:

* 1 pistola.
* 3 cargadores.
* 50 municiones calibre 9 mm.

Al registrar la asignación:

* La pistola queda asociada al personal.
* Se descuentan automáticamente 3 cargadores del stock.
* Se descuentan automáticamente 50 municiones 9 mm del stock.

La devolución de la provisión también se realiza de manera conjunta:

* pistola;
* 3 cargadores;
* 50 municiones 9 mm.

### Equipamiento de stock general

Actualmente se administra como stock general:

* Escopeta.
* HT.
* Cargador.
* Munición 9 mm.
* Munición calibre 12.
* Munición calibre 12 - Posta de goma.

El chaleco balístico conserva modalidad **TEMPORARY** porque se necesita identificar qué chaleco individual corresponde a cada integrante del personal.

---

## Autenticación y seguridad

SIGEP posee autenticación mediante:

* usuario y contraseña;
* contraseñas almacenadas con `<span>bcryptjs</span>`;
* tokens JWT;
* rutas privadas protegidas;
* expiración configurable del token;
* cierre de sesión;
* pantalla  **Mi cuenta** .

El usuario administrador puede desde la interfaz:

* cambiar su nombre de usuario;
* cambiar su contraseña;
* confirmar los cambios ingresando la contraseña actual.

Cuando se modifica la contraseña, la sesión se cierra y se requiere iniciar sesión nuevamente.

El seed inicial crea un usuario ADMIN únicamente si no existe previamente un administrador. Si ya existe uno, no modifica su usuario ni su contraseña.

---

## Movimientos

La sección **Movimientos** muestra el historial reconstruido a partir de las asignaciones y devoluciones registradas.

Permite:

* visualizar asignaciones permanentes;
* visualizar asignaciones temporarias;
* visualizar devoluciones;
* buscar por personal o equipamiento;
* filtrar asignaciones y devoluciones;
* imprimir el historial;
* descargar el historial en PDF.

La generación de PDF utiliza:

* `<span>jspdf</span>`;
* `<span>jspdf-autotable</span>`.

> Actualmente esta sección representa el historial logístico de asignaciones y devoluciones. No debe considerarse todavía un módulo de auditoría completa de todas las acciones realizadas dentro del sistema.

---

## Tecnologías

### Frontend

* React
* Vite
* Tailwind CSS
* React Router
* Lucide React
* SweetAlert2
* jsPDF
* jsPDF AutoTable

### Backend

* Node.js
* Express
* ES Modules
* PostgreSQL
* Prisma ORM
* `<span>@prisma/adapter-pg</span>`
* Zod
* bcryptjs
* jsonwebtoken
* Helmet
* CORS
* Morgan
* dotenv

### Herramientas

* pnpm Workspaces
* Prisma migrations
* Prisma seed
* Oxlint
* Git
* GitHub

---

## Estructura del proyecto

```
sigep/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── equipment/
│   │   │   ├── layout/
│   │   │   └── personnel/
│   │   ├── pages/
│   │   │   ├── Account.jsx
│   │   │   ├── Assignments.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Equipment.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Movements.jsx
│   │   │   └── Personnel.jsx
│   │   ├── services/
│   │   │   ├── assignment.service.js
│   │   │   ├── auth.service.js
│   │   │   ├── equipment.service.js
│   │   │   ├── equipmentType.service.js
│   │   │   └── personnel.service.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── assignment.controller.js
│   │   │   ├── auth.controller.js
│   │   │   └── equipmentType.controller.js
│   │   ├── generated/
│   │   │   └── prisma/
│   │   ├── lib/
│   │   │   └── prisma.js
│   │   ├── middlewares/
│   │   │   └── auth.middleware.js
│   │   ├── routes/
│   │   │   ├── assignment.routes.js
│   │   │   ├── auth.routes.js
│   │   │   ├── equipment.routes.js
│   │   │   ├── equipmentType.routes.js
│   │   │   ├── health.routes.js
│   │   │   └── personnel.routes.js
│   │   ├── schemas/
│   │   └── server.js
│   ├── prisma.config.ts
│   └── package.json
│
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── README.md
```

---

## Requisitos

Antes de ejecutar SIGEP es necesario tener instalado:

* Node.js 22 o superior recomendado.
* pnpm.
* PostgreSQL.
* Git.

Comprobar versiones:

```
node -v
pnpm -v
git --version
psql --version
```

---

## Instalación

Clonar el repositorio:

```
git clone https://github.com/Rolando-Du/sigep.git
cd sigep
```

Instalar las dependencias del workspace:

```
pnpm install
```

Si pnpm solicita aprobar scripts de compilación:

```
pnpm approve-builds
```

En la configuración actual pueden estar autorizados:

```
allowBuilds:
  '@prisma/engines': true
  core-js: true
  esbuild: true
  prisma: true
```

---

## Variables de entorno

### Backend

Crear:

```
server/.env
```

Ejemplo:

```
PORT=4000

DATABASE_URL="postgresql://USUARIO:CONTRASEÑA@localhost:5432/sigep?schema=public"

ADMIN_USERNAME=admin
ADMIN_PASSWORD=CAMBIAR_POR_UNA_CONTRASEÑA_SEGURA

JWT_SECRET=CAMBIAR_POR_UNA_CLAVE_SECRETA_SEGURA
JWT_EXPIRES_IN=8h
```

Para generar un `<span>JWT_SECRET</span>` aleatorio:

```
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Frontend

Crear:

```
frontend/.env
```

Ejemplo para desarrollo:

```
VITE_API_URL=http://localhost:4000
```

---

## Base de datos

Crear una base PostgreSQL llamada:

```
sigep
```

Luego ejecutar las migraciones:

```
pnpm --filter server exec prisma migrate dev
```

Generar Prisma Client:

```
pnpm --filter server exec prisma generate
```

Ejecutar el seed:

```
pnpm --filter server exec prisma db seed
```

El seed:

1. sincroniza el catálogo base de tipos de equipamiento;
2. busca si ya existe un usuario con rol ADMIN;
3. si existe, no modifica sus credenciales;
4. si no existe, crea el administrador inicial usando `<span>ADMIN_USERNAME</span>` y `<span>ADMIN_PASSWORD</span>`.

Para producción se recomienda aplicar migraciones con:

```
pnpm --filter server exec prisma migrate deploy
```

---

## Ejecución

### Frontend y backend juntos

Desde la raíz:

```
pnpm dev
```

### Frontend por separado

```
pnpm --filter frontend dev
```

Disponible normalmente en:

```
http://localhost:5173
```

### Backend por separado

```
pnpm --filter server dev
```

Disponible en:

```
http://localhost:4000
```

Health check:

```
http://localhost:4000/api/v1/health
```

---

## Scripts principales

### Raíz

```
pnpm dev
pnpm dev:frontend
pnpm dev:server
```

### Frontend

```
pnpm --filter frontend dev
pnpm --filter frontend build
```

### Backend

```
pnpm --filter server dev
pnpm --filter server start
```

### Prisma

```
pnpm --filter server exec prisma format
pnpm --filter server exec prisma validate
pnpm --filter server exec prisma generate
pnpm --filter server exec prisma migrate dev
pnpm --filter server exec prisma migrate deploy
pnpm --filter server exec prisma db seed
```

---

## API

Base URL local:

```
http://localhost:4000/api/v1
```

### Rutas públicas

#### Health

```
GET /api/v1/health
```

#### Login

```
POST /api/v1/auth/login
```

Body:

```
{
  "username": "admin",
  "password": "contraseña"
}
```

Respuesta exitosa:

```
{
  "success": true,
  "data": {
    "token": "JWT",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "ADMIN"
    }
  }
}
```

---

## Rutas protegidas

Todas las rutas privadas requieren:

```
Authorization: Bearer TOKEN
```

### Cuenta

```
GET /api/v1/auth/me
PUT /api/v1/auth/me
```

### Personal

```
GET /api/v1/personnel
POST /api/v1/personnel
PUT /api/v1/personnel/:id
```

### Tipos de equipamiento

```
GET /api/v1/equipment-types
POST /api/v1/equipment-types
```

### Equipamiento

```
GET /api/v1/equipment
POST /api/v1/equipment
PUT /api/v1/equipment/:id
```

### Asignaciones

```
GET  /api/v1/assignments
POST /api/v1/assignments
GET  /api/v1/assignments/personnel/:personnelId
POST /api/v1/assignments/:assignmentId/details/:detailId/return
POST /api/v1/assignments/:assignmentId/pistol-provision/return
```

---

## Ejemplo de autenticación por terminal

Login:

```
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "TU_CONTRASEÑA"
  }'
```

Consultar una ruta protegida:

```
curl http://localhost:4000/api/v1/personnel \
  -H "Authorization: Bearer TU_TOKEN"
```

Sin token, el backend responde:

```
{
  "success": false,
  "error": {
    "message": "Autenticación requerida"
  }
}
```

---

## Prisma

El cliente Prisma se genera en:

```
server/src/generated/prisma
```

La conexión se centraliza en:

```
server/src/lib/prisma.js
```

SIGEP utiliza PostgreSQL mediante `<span>@prisma/adapter-pg</span>`.

---

## Modelos principales

### User

Representa los usuarios autorizados del sistema.

Campos principales:

* username
* passwordHash
* role
* isActive

Rol actual:

```
ADMIN
```

### Personnel

Representa al personal administrado dentro de SIGEP.

### EquipmentType

Define el tipo de equipamiento, categoría, modo de control y modalidad logística predeterminada.

### Equipment

Representa una unidad individual o un registro de stock por cantidad.

### Assignment

Representa una asignación logística de equipamiento a una persona.

Modalidades:

```
PERMANENT
TEMPORARY
```

### AssignmentDetail

Relaciona una asignación con uno o más registros de equipamiento y controla las cantidades asignadas y devueltas.

---

## Reglas de negocio importantes

### Identificación individual

Para equipamiento individual, el número de serie se considera una identificación única y no debe repetirse.

### Pistola

La pistola:

* se controla individualmente;
* se asigna de forma permanente;
* genera una provisión automática con 3 cargadores y 50 municiones 9 mm.

### Chaleco Balístico

El chaleco:

* se controla individualmente;
* se asigna de forma temporaria;
* permanece identificado con el personal al que corresponde.

### Escopeta

Se administra como stock general y no se asigna directamente al personal.

### HT

Se administra por cantidad como stock general y no se asigna directamente al personal.

### Municiones

Se administran por cantidad.

La munición 9 mm utilizada en la provisión de pistola se descuenta automáticamente del stock.

### Cargadores

Se administran por cantidad.

La provisión de pistola utiliza exactamente 3 cargadores.

---

## Respuesta estándar de la API

Respuesta correcta:

```
{
  "success": true,
  "data": {}
}
```

Respuesta con error:

```
{
  "success": false,
  "error": {
    "message": "Descripción del error",
    "details": []
  }
}
```

---

## Seguridad

Buenas prácticas aplicadas:

* contraseñas hasheadas con bcrypt;
* JWT para autenticación;
* rutas privadas protegidas;
* validación de contraseña actual para modificar credenciales;
* Helmet;
* variables sensibles en `<span>.env</span>`;
* separación entre frontend y backend;
* Prisma para acceso a datos;
* restricciones de unicidad en base de datos.

Nunca se deben versionar:

* contraseñas;
* JWT_SECRET;
* DATABASE_URL con credenciales reales;
* archivos `<span>.env</span>`.

---

## Build de producción

Frontend:

```
pnpm --filter frontend build
```

Salida:

```
frontend/dist
```

Actualmente Vite puede mostrar una advertencia por chunks superiores a 500 kB debido principalmente a las dependencias utilizadas para generación de PDF. Es una advertencia de optimización y no impide generar el build.

---

## Estado actual

SIGEP cuenta actualmente con:

* dashboard;
* gestión de personal;
* gestión de equipamiento;
* catálogo de tipos de equipamiento;
* asignaciones permanentes y temporarias;
* provisión automática de pistola;
* devolución conjunta de provisión;
* control de stock;
* historial de movimientos;
* búsqueda y filtros;
* impresión;
* exportación PDF;
* login de administrador;
* JWT;
* rutas protegidas;
* cierre de sesión;
* gestión de nombre de usuario;
* cambio de contraseña;
* migraciones Prisma;
* seed inicial seguro;
* repositorio Git versionado.

---

## Mejoras futuras

Posibles próximas etapas:

* auditoría completa de acciones por usuario;
* más roles y permisos, por ejemplo OPERADOR y LECTOR;
* administración de usuarios desde la interfaz;
* recuperación o restablecimiento de contraseña;
* exportación adicional a CSV/Excel;
* reportes de stock;
* alertas de stock mínimo;
* reportes por personal;
* reportes por tipo de equipamiento;
* optimización del bundle del frontend mediante code splitting;
* despliegue productivo de frontend, backend y PostgreSQL.

---

## Git

Flujo habitual:

```
git status
git add .
git commit -m "Descripción del cambio"
git push
```

Repositorio remoto:

```
origin  https://github.com/Rolando-Du/sigep.git
```

Rama principal actual:

```
master
```

---

## Autor

Rolando Duarte - Proyecto SIGEP.

**Sistema Integral de Gestión de Equipamiento y Personal**

Desarrollado como aplicación web de gestión logística con React, Node.js, Express, PostgreSQL y Prisma.
