
SIGEP

Sistema Integral de Gestión de Equipamiento y Personal

Versión: 1.0
Estado: Definición funcional inicial
Organización: Policía de Seguridad Aeroportuaria
Tipo de solución: Aplicación web interna
Documento: Especificación funcional y de experiencia de usuario

1. Propósito del documento

Este documento define la visión funcional inicial de SIGEP — Sistema Integral de Gestión de Equipamiento y Personal.

Su objetivo es establecer qué problema resolverá el sistema, cuáles serán sus módulos principales, cómo deberá comportarse la interfaz y qué criterios deberán respetarse durante el desarrollo.

Este documento debe mantenerse separado del README.md.

El README.md estará orientado a:

instalación;

ejecución;

comandos;

configuración del proyecto;

variables de entorno;

dependencias;

despliegue.

Este documento estará orientado a:

alcance funcional;

comportamiento esperado;

experiencia de usuario;

reglas de negocio;

módulos;

roles;

criterios de diseño.

Ubicación sugerida:

sigep/
├── docs/
│   └── SIGEP-Documento-Funcional.md
├── frontend/
├── server/
├── pnpm-workspace.yaml
├── package.json
└── README.md

2. Visión general

SIGEP será una aplicación web interna destinada a centralizar y simplificar la gestión de información relacionada con personal y equipamiento.

Permitirá consultar rápidamente:

datos principales del personal;

equipamiento asignado;

disponibilidad de elementos;

responsable actual de un elemento;

historial de asignaciones y devoluciones;

movimientos recientes;

modificaciones realizadas.

SIGEP deberá priorizar simplicidad, velocidad, claridad, trazabilidad y seguridad.

3. Principios del producto

3.1 Simplicidad

Cada pantalla mostrará solamente la información necesaria para la tarea actual.

Se evitarán:

menús excesivos;

tarjetas innecesarias;

gráficos decorativos;

formularios demasiado extensos;

información duplicada;

funciones sin utilización concreta.

3.2 Rapidez

Las operaciones habituales deberán resolverse en pocos pasos.

Buscar persona
→ Abrir ficha
→ Ver equipamiento

3.3 Claridad

Se utilizarán nombres simples:

Personal
Equipamiento
Asignaciones
Movimientos

3.4 Trazabilidad

Toda operación relevante deberá indicar:

quién la realizó;

cuándo;

qué registro fue afectado;

valor anterior;

valor nuevo.

3.5 Escalabilidad

El sistema comenzará con aproximadamente 30 personas, pero deberá poder crecer sin rehacer su estructura.

4. Alcance funcional inicial

La primera versión estará basada en:

Inicio
Personal
Equipamiento
Asignaciones
Movimientos
Administración

No se agregarán módulos adicionales sin una necesidad real.

5. Inicio

La pantalla inicial será un resumen operativo y simple.

Ejemplo:

Personal registrado
30

Equipamiento asignado
84

Elementos disponibles
12

Movimientos recientes
8

También mostrará movimientos recientes y un buscador global:

Buscar persona, DNI, legajo o elemento...

6. Módulo Personal

6.1 Listado

PERSONAL

[ Buscar personal... ]                    [ + Nuevo ]

Grado       Nombre y apellido      Legajo       Estado
------------------------------------------------------

Sargento    Juan Pérez             1523         Activo
Cabo        Pedro Gómez            1845         Activo

6.2 Búsqueda

Se podrá buscar por:

nombre;

apellido;

DNI;

número de legajo.

6.3 Filtros

Inicialmente:

estado;

grado.

Los filtros avanzados permanecerán ocultos mientras no se utilicen.

7. Ficha de personal

Cada integrante tendrá una ficha individual.

SARGENTO

JUAN PÉREZ

Legajo 1523
Activo

[ Editar ]

Datos personales

Nombre

Apellido

DNI

Grupo sanguíneo

Datos institucionales

Grado

Número de legajo

Destino / dependencia

Estado

Equipamiento asignado

Armamento
ARM-023

Chaleco
CH-018

Radio
RAD-011

Información adicional

Campos configurables según futuras necesidades.

Observaciones

Campo libre para observaciones administrativas pertinentes.

8. Alta y edición de personal

Campos obligatorios

Nombre

Apellido

DNI

Grado

Número de legajo

Campos complementarios

Grupo sanguíneo

Destino / dependencia

Observaciones

Campos personalizados

Una persona podrá existir en SIGEP sin equipamiento asignado.

9. Estados del personal

Inicialmente:

ACTIVO
INACTIVO

No se eliminarán registros durante el uso normal. Se utilizará el estado INACTIVO para conservar historial.

10. Módulo Equipamiento

EQUIPAMIENTO

[ Buscar elemento... ]                [ + Nuevo elemento ]

Tipo          Identificación       Estado
------------------------------------------

Armamento     ARM-023              Asignado
Chaleco       CH-018               Asignado
Radio         RAD-011              Disponible
Casco         CAS-005              Disponible

11. Tipos de equipamiento

Inicialmente:

armamento;

chaleco;

radio;

casco;

cargadores;

otros elementos logísticos.

Desde Administración se podrán crear nuevos tipos sin modificar código.

12. Ficha de equipamiento

CHALECO

CH-018

Estado
ASIGNADO

Asignado actualmente a
Juan Pérez

Fecha de asignación
19/08/2026

También mostrará historial.

13. Estados del equipamiento

DISPONIBLE
ASIGNADO
EN REPARACIÓN
FUERA DE SERVICIO
BAJA

14. Asignaciones

Una asignación vincula una persona con un elemento.

NUEVA ASIGNACIÓN

Persona
Juan Pérez

Elemento
Chaleco CH-018

Fecha
19/08/2026

Observaciones
Opcional

[ Confirmar asignación ]

Regla principal:

Un mismo elemento físico no podrá estar asignado simultáneamente a dos personas.

15. Devoluciones

Desde la ficha de una persona o elemento deberá existir:

[ Registrar devolución ]

Se registrará:

persona;

elemento;

fecha;

usuario;

observaciones opcionales.

Por defecto, luego de la devolución el elemento volverá a DISPONIBLE.

16. Movimientos

SIGEP conservará el historial.

MOVIMIENTOS

Fecha       Persona        Elemento     Movimiento
--------------------------------------------------

19/08/26    Juan Pérez     CH-018       Asignación
18/08/26    Pedro Gómez    RAD-011      Devolución
17/08/26    Juan Pérez     ARM-023      Asignación

Los movimientos no deberán poder editarse libremente.

17. Campos personalizados

Desde:

Administración
→ Campos personalizados

un administrador podrá crear campos adicionales.

Tipos iniciales:

Texto
Número
Fecha
Sí / No
Lista de opciones

Ejemplos:

talle de uniforme;

talle de calzado;

fecha de vencimiento;

dependencia;

número interno.

18. Importación inicial desde Excel

Para evitar cargar manualmente el personal inicial, SIGEP permitirá importar un archivo Excel.

Formato sugerido:

Nombre
Apellido
DNI
Grado
Legajo
Grupo sanguíneo

Antes de importar deberá validar los datos.

Ejemplo:

Archivo analizado

28 registros correctos
2 registros con observaciones

Posibles errores:

Fila 7
DNI duplicado

Fila 14
Legajo ya existente

La importación deberá requerir confirmación.

19. Exportación

Inicialmente se permitirá exportar a:

Excel

PDF se evaluará cuando exista una necesidad concreta.

20. Usuarios y roles

SIGEP será una aplicación privada.

No existirá registro público.

ADMINISTRADOR

Puede:

gestionar usuarios;

crear y modificar personal;

gestionar equipamiento;

realizar asignaciones;

registrar devoluciones;

configurar campos;

consultar auditoría.

OPERADOR

Puede:

consultar personal;

crear y modificar personal;

gestionar equipamiento;

realizar asignaciones;

registrar devoluciones.

CONSULTA

Puede:

buscar;

visualizar;

consultar historial.

No puede modificar información.

21. Auditoría

SIGEP registrará automáticamente operaciones relevantes.

19/08/2026 14:32

Usuario
rduarte

Acción
MODIFICACIÓN DE PERSONAL

Registro
Juan Pérez

Campo
Número de legajo

Anterior
1522

Nuevo
1523

Se auditarán como mínimo:

altas;

modificaciones;

cambios de estado;

asignaciones;

devoluciones;

cambios de equipamiento;

administración de usuarios.

El historial de auditoría no será editable.

22. Eliminación de información

Como regla general, SIGEP evitará eliminar físicamente datos importantes.

Ejemplos:

Persona
ACTIVO → INACTIVO

Equipamiento
DISPONIBLE → BAJA

23. Diseño visual

La interfaz deberá transmitir:

orden;

seriedad;

confianza;

modernidad;

simplicidad.

No deberá tener apariencia excesivamente militar ni comercial.

Se utilizarán:

fondos neutros;

tarjetas simples;

bordes suaves;

tipografía limpia;

espacios generosos;

iconografía limitada;

colores funcionales.

Paleta conceptual:

Azul institucional oscuro
Grises neutros
Blanco
Verde para estados correctos
Ámbar para advertencias
Rojo para errores

24. Formularios

Regla general:

Mostrar primero lo necesario y dejar lo opcional en segundo plano.

NUEVA PERSONA

Datos principales

Nombre *
Apellido *
DNI *
Grado *
Legajo *

Información adicional

Grupo sanguíneo
Destino
Observaciones

[ Cancelar ]             [ Guardar ]

25. Confirmaciones

Las operaciones comunes no deberán mostrar confirmaciones innecesarias.

Las acciones sensibles sí deberán confirmarse:

dar de baja;

desactivar usuario;

registrar devolución;

transferir un elemento;

cambiar estados críticos.

26. Buscador global

La búsqueda deberá aceptar, como mínimo:

nombre;

apellido;

DNI;

legajo;

identificación de elemento.

Ejemplo:

1523

Resultado:

Juan Pérez
Legajo 1523

También:

CH-018

Resultado:

Chaleco CH-018
Asignado a Juan Pérez

27. Responsive

SIGEP deberá funcionar correctamente en:

escritorio;

notebook;

tablet.

El teléfono podrá utilizarse para consultas rápidas, pero la experiencia principal estará orientada a escritorio.

28. Seguridad funcional

SIGEP deberá contemplar:

autenticación obligatoria;

roles y permisos;

sesiones seguras;

auditoría;

protección de datos sensibles;

conexiones cifradas;

cierre de sesión;

política de contraseñas;

backups.

La implementación técnica se definirá en la documentación de arquitectura.

29. Datos tratados

SIGEP podrá almacenar:

DNI;

número de legajo;

grupo sanguíneo;

identificación de equipamiento;

asignaciones;

movimientos;

observaciones internas.

Por este motivo:

SIGEP no será una aplicación pública.

30. Funcionalidades excluidas del MVP

La primera versión no incluirá:

chat;

mensajería interna;

calendario;

múltiples dashboards;

gráficos complejos;

inteligencia artificial;

mapas;

geolocalización;

notificaciones push;

automatizaciones innecesarias.

31. MVP

Acceso

Login

Logout

Usuarios

Roles

Personal

Listado

Búsqueda

Alta

Edición

Ficha

Activar / desactivar

Equipamiento

Listado

Alta

Edición

Estados

Ficha

Asignaciones

Asignar

Devolver

Consultar asignación actual

Historial

Movimientos

Auditoría básica

Datos

Importación desde Excel

Exportación a Excel

32. Segunda etapa

Luego de estabilizar el MVP podrán evaluarse:

campos personalizados avanzados;

reportes;

filtros adicionales;

códigos QR;

impresión de fichas;

inventario avanzado;

alertas por fecha;

estadísticas;

auditoría avanzada.

33. QR como evolución futura

Un elemento podría tener un código QR.

[ QR ]

CH-018

Al escanearlo:

CHALECO CH-018

Estado
Asignado

Asignado a
Juan Pérez

Fecha
19/08/2026

No será obligatorio en el MVP.

34. Entidades conceptuales

USUARIO
PERSONAL
EQUIPAMIENTO
TIPO DE EQUIPAMIENTO
ASIGNACIÓN
MOVIMIENTO
CAMPO PERSONALIZADO
AUDITORÍA

Relación principal:

PERSONAL
   │
   └──── ASIGNACIONES ──── EQUIPAMIENTO
                             │
                             └── TIPO DE EQUIPAMIENTO

35. Validaciones principales

SIGEP deberá prevenir:

DNI duplicado
Legajo duplicado
Identificación de elemento duplicada
Elemento ya asignado
Campo obligatorio incompleto

Los errores deberán mostrarse en lenguaje claro.

36. Experiencia esperada

El usuario deberá identificar rápidamente:

dónde buscar una persona;

dónde consultar equipamiento;

cómo asignar;

cómo devolver;

dónde consultar movimientos.

El sistema deberá requerir poca capacitación.

37. Identidad

SIGEP
Sistema Integral de Gestión de Equipamiento y Personal

La interfaz utilizará principalmente la denominación corta SIGEP.

38. Criterio para nuevas funciones

Antes de incorporar una funcionalidad deberá responderse:

¿Esta función resuelve una necesidad real del área?

Si la respuesta es no, no se incorporará.

39. Resultado esperado del MVP

Un usuario autorizado deberá poder:

ingresar;

buscar una persona;

consultar sus datos;

conocer su equipamiento;

buscar un elemento;

saber quién lo tiene;

registrar una asignación;

registrar una devolución;

consultar movimientos anteriores.

40. Base tecnológica acordada

La arquitectura definitiva se documentará posteriormente, pero ya quedan establecidas estas decisiones.

Frontend

React
Vite

Backend

Node.js
Express

Base de datos

PostgreSQL
Prisma ORM

Gestor de paquetes

pnpm

SIGEP utilizará pnpm en lugar de npm.

Motivos:

menor duplicación de dependencias;

mejor uso de espacio en disco;

instalaciones rápidas;

manejo consistente de dependencias;

buen soporte para workspaces;

adecuado para frontend y backend dentro del mismo proyecto.

41. ES Modules

El proyecto utilizará ES Modules.

import express from "express";

No se utilizará CommonJS salvo que una dependencia lo exija.

42. Estructura general prevista

sigep/
│
├── frontend/
│
├── server/
│
├── docs/
│   └── SIGEP-Documento-Funcional.md
│
├── pnpm-workspace.yaml
├── package.json
├── .gitignore
└── README.md

La estructura se mantendrá simple.

No se utilizarán inicialmente:

apps/
packages/
services/
microservices/

mientras no exista una necesidad concreta.

43. Workspace de pnpm

Se prevé utilizar:

pnpm-workspace.yaml

Conceptualmente:

packages:

- "frontend"
- "server"

La definición final de scripts se documentará en la etapa técnica.

44. Separación de documentación

La documentación podrá organizarse así:

docs/
├── SIGEP-Documento-Funcional.md
├── SIGEP-Arquitectura.md
├── SIGEP-Base-de-Datos.md
└── SIGEP-API.md

Inicialmente será obligatorio solamente:

SIGEP-Documento-Funcional.md

45. Próxima etapa

El siguiente documento será:

SIGEP-Arquitectura.md

Allí se definirá:

arquitectura frontend/backend;

estructura exacta del repositorio;

pnpm workspace;

scripts;

modelo de datos;

Prisma;

PostgreSQL;

autenticación;

autorización;

seguridad;

API REST;

manejo de errores;

logs;

auditoría técnica;

ambientes;

variables de entorno;

backups;

despliegue;

estrategia de desarrollo.

Una vez aprobada la arquitectura comenzará la creación del proyecto.

46. Visión resumida

PERSONAL
    ↓
EQUIPAMIENTO
    ↓
HISTORIAL

SIGEP deberá ser:

moderno;

intuitivo;

rápido;

seguro;

mantenible;

claro;

escalable;

sin funcionalidades innecesarias.

SIGEP no pretende hacer muchas cosas. Pretende hacer correctamente las cosas que el área realmente necesita.
