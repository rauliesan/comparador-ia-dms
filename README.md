# Comparador de DMs con IA

Este proyecto es una aplicación web Full-Stack que sirve como plataforma para comparar la capacidad narrativa y de dirección de juego (Dungeon Master) de dos Modelos de Lenguaje Grandes (LLMs) diferentes. La aplicación permite a un jugador humano iniciar una aventura de Dungeons & Dragons (D&D) que se juega en dos universos paralelos, uno dirigido por cada IA, permitiendo una comparación directa de su coherencia, creatividad y gestión de la partida.

Esta es una aplicación completa con autenticación de usuarios, persistencia de datos en una base de datos MySQL y gestión de partidas.

## ✨ Características Principales

-   **Autenticación de Usuarios:** Sistema completo de registro e inicio de sesión con email y contraseña.
-   **Dashboard Personal:** Cada usuario tiene un dashboard privado donde puede ver, retomar y eliminar sus partidas guardadas.
-   **Hoja de Personaje:** Interfaz para definir el nombre, raza, clase y atributos del personaje, así como el escenario inicial de la aventura.
-   **Persistencia Total:** Todas las partidas y conversaciones se guardan en una base de datos MySQL.
-   **Comparación en Paralelo:** Envía una única acción del jugador a dos IAs de Groq simultáneamente (`llama-3.1-8b-instant` vs `mixtral-8x7b-32768`) y muestra sus respuestas lado a lado.
-   **Gestión de Contexto:** La aplicación envía el historial completo de la conversación y los datos del personaje a las IAs en cada turno.
-   **Interfaz de Chat Moderna:** La página de juego cuenta con una interfaz pulida, con burbujas de mensajes, scroll automático y un input de texto que crece dinámicamente.

## 🛠️ Stack Tecnológico

-   **Framework:** Next.js (React)
-   **Backend:** Node.js (API Routes de Next.js)
-   **Base de Datos:** MySQL
-   **ORM:** Prisma
-   **Autenticación:** Next-Auth
-   **APIs de IA:** Groq (Llama, Mixtral)
-   **UI Component:** `react-textarea-autosize`

## 🚀 Guía de Instalación y Ejecución

Sigue estas instrucciones para levantar una copia del proyecto y correrla en tu máquina local.

### 1. Prerrequisitos

Asegúrate de tener instalado lo siguiente en tu sistema:
-   [Node.js](https://nodejs.org/) (versión 18.x o superior)
-   [Git](https://git-scm.com/)
-   Un servidor de base de datos [MySQL](https://dev.mysql.com/downloads/installer/) que esté corriendo.

### 2. Configuración del Proyecto

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/rauliesan/comparador-ia-dms.git
    cd comparador-ia-dms
    ```

2.  **Instala las dependencias del proyecto:**
    Este comando instalará todas las librerías necesarias (React, Next.js, Prisma, etc.).
    ```bash
    npm install
    ```

3.  **Configura las variables de entorno:**
    Crea un archivo llamado `.env` en la raíz del proyecto. Copia y pega la siguiente plantilla, asegurándote de rellenar tus propias claves y secretos.

    ```env
    # .env

    # 1. Conexión a la Base de Datos
    # Asegúrate de que el usuario, contraseña y nombre de la base de datos son correctos.
    DATABASE_URL="mysql://usuario:usuario@localhost:3306/proyecto_ia"

    # 2. Secretos de Autenticación (Next-Auth)
    # Ejecuta este comando en tu terminal para generar tu clave:
    # node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
    NEXTAUTH_SECRET="PEGA_AQUI_TU_SECRET_GENERADO"
    NEXTAUTH_URL="http://localhost:3000"

    # 3. Clave de la API de Groq
    GROQ_API_KEY="gsk_..."
    ```

### 3. Configuración de la Base de Datos

Este es el paso más importante. Sigue este método manual para asegurar una configuración correcta y sin errores.

1.  **Crea la base de datos vacía:**
    Accede a tu cliente de MySQL y ejecuta el siguiente comando para crear la base de datos que usará la aplicación:
    ```sql
    CREATE DATABASE proyecto_ia;
    ```

2.  **Crea el archivo de esquema SQL:**
    En la raíz de tu proyecto, crea un nuevo archivo llamado `database-schema.sql`.

3.  **Pega el siguiente código SQL** en el archivo `database-schema.sql`. Este script contiene la estructura de todas las tablas que la aplicación necesita.

    ````sql
    -- Archivo: database-schema.sql

    -- Crear la tabla para los Usuarios
    CREATE TABLE `User` (
        `id` VARCHAR(191) NOT NULL,
        `name` VARCHAR(191) NULL,
        `email` VARCHAR(191) NULL,
        `emailVerified` DATETIME(3) NULL,
        `password` VARCHAR(191) NULL,
        `image` VARCHAR(191) NULL,
        UNIQUE INDEX `User_email_key`(`email`),
        PRIMARY KEY (`id`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

    -- Crear la tabla para las Cuentas (usado por Next-Auth)
    CREATE TABLE `Account` (
        `id` VARCHAR(191) NOT NULL,
        `userId` VARCHAR(191) NOT NULL,
        `type` VARCHAR(191) NOT NULL,
        `provider` VARCHAR(191) NOT NULL,
        `providerAccountId` VARCHAR(191) NOT NULL,
        `refresh_token` TEXT NULL,
        `access_token` TEXT NULL,
        `expires_at` INTEGER NULL,
        `token_type` VARCHAR(191) NULL,
        `scope` VARCHAR(191) NULL,
        `id_token` TEXT NULL,
        `session_state` VARCHAR(191) NULL,
        UNIQUE INDEX `Account_provider_providerAccountId_key`(`provider`, `providerAccountId`),
        PRIMARY KEY (`id`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

    -- Crear la tabla para las Sesiones (usado por Next-Auth)
    CREATE TABLE `Session` (
        `id` VARCHAR(191) NOT NULL,
        `sessionToken` VARCHAR(191) NOT NULL,
        `userId` VARCHAR(191) NOT NULL,
        `expires` DATETIME(3) NOT NULL,
        UNIQUE INDEX `Session_sessionToken_key`(`sessionToken`),
        PRIMARY KEY (`id`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

    -- Crear la tabla para las Partidas
    CREATE TABLE `Partida` (
        `id` VARCHAR(191) NOT NULL,
        `title` VARCHAR(191) NOT NULL DEFAULT 'Nueva Partida',
        `systemPrompt` TEXT NOT NULL,
        `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        `updatedAt` DATETIME(3) NOT NULL,
        `userId` VARCHAR(191) NOT NULL,
        PRIMARY KEY (`id`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

    -- Crear la tabla para los Mensajes
    CREATE TABLE `Mensaje` (
        `id` VARCHAR(191) NOT NULL,
        `role` VARCHAR(191) NOT NULL,
        `content` TEXT NOT NULL,
        `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        `partidaId` VARCHAR(191) NOT NULL,
        PRIMARY KEY (`id`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

    -- Crear la tabla para los Tokens de Verificación (usado por Next-Auth)
    CREATE TABLE `VerificationToken` (
        `identifier` VARCHAR(191) NOT NULL,
        `token` VARCHAR(191) NOT NULL,
        `expires` DATETIME(3) NOT NULL,
        UNIQUE INDEX `VerificationToken_token_key`(`token`),
        UNIQUE INDEX `VerificationToken_identifier_token_key`(`identifier`, `token`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

    -- Crear la tabla de migraciones de Prisma para evitar errores futuros.
    CREATE TABLE `_prisma_migrations` (
        `id` VARCHAR(36) NOT NULL,
        `checksum` VARCHAR(64) NOT NULL,
        `finished_at` DATETIME(3) NULL,
        `migration_name` VARCHAR(255) NOT NULL,
        `logs` TEXT NULL,
        `rolled_back_at` DATETIME(3) NULL,
        `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        `applied_steps_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
        PRIMARY KEY (`id`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

    -- Añadir las "claves foráneas" (las relaciones entre las tablas)
    ALTER TABLE `Account` ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
    ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
    ALTER TABLE `Partida` ADD CONSTRAINT `Partida_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
    ALTER TABLE `Mensaje` ADD CONSTRAINT `Mensaje_partidaId_fkey` FOREIGN KEY (`partidaId`) REFERENCES `Partida`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
    ````

4.  **Importa el script SQL a tu base de datos.**
    -   **Opción A (GUI):** Usa un cliente de base de datos como MySQL Workbench o DBeaver. Conéctate a tu base de datos `proyecto_ia` y ejecuta el contenido del archivo `database-schema.sql`.
    -   **Opción B (Línea de Comandos):** Abre una terminal en la raíz de tu proyecto y ejecuta el siguiente comando. Te pedirá la contraseña de tu usuario de MySQL (`usuario` en este caso).
        ```bash
        mysql -u usuario -p proyecto_ia < database-schema.sql
        ```

### 4. Paso Final de Configuración

Antes de arrancar la aplicación, necesitamos que Prisma genere su cliente adaptado a nuestro esquema. Este paso es **crucial** para que el código pueda conectarse a las tablas que acabas de crear.

```bash
npx prisma generate
```

### 5. ¡Ejecutar la Aplicación!

Ahora que todo está instalado y configurado, inicia el servidor de desarrollo:

```bash
npm run dev
```

Abre tu navegador y ve a **[http://localhost:3000](http://localhost:3000)**.

¡Listo! La aplicación debería estar funcionando. Ya puedes registrarte, iniciar sesión y empezar a comparar IAs.