# Social Security Web (Frontend)

This **React** application serves as the user-facing portal for managing **Social Security** procedures. It allows users to:

1. **Verify Identity** using Verifiable Credentials (VCs) via manual QR scanning or an automated wallet-based flow.
2. **Perform Credential-Based Flows** such as registering for Social Security (alta), revoking credentials (baja), and viewing user dashboards.
3. **Access Personalized Services** such as viewing personal data, credentials, and active benefits.

The frontend is built using **Create React App (CRA)**, enhanced with **TailwindCSS**, **Redux Toolkit**, **React Router**, **Axios**, **i18next** for internationalization, and other tools.

---

## Table of Contents

1. [Key Features](#key-features)  
2. [Technologies & Dependencies](#technologies--dependencies)  
3. [Project Structure](#project-structure)  
4. [Installation](#installation)  
5. [Configuration](#configuration)  
6. [Scripts & Usage](#scripts--usage)  
7. [Docker Support](#docker-support)  
8. [Internationalization (i18n)](#internationalization-i18n)  
9. [Environment Variables](#environment-variables)  
10. [Deployment Notes](#deployment-notes)  
11. [Contributing](#contributing)  
12. [License](#license)

---

## Key Features

- **Credential Verification**  
  - Manual (QR-based) verification with walt.id wallet.  
  - Automatic wallet-based verification (no need to scan QR codes).  
  - Session polling to check verification status (pending, verified, failed, expired).

- **Credential Issuance & Revocation**  
  - Guided process to issue “Alta” (Social Security Registration) credentials after successful verification.  
  - Button to revoke or “Baja” a credential, marking it as invalid in the backend.

- **User Dashboard**  
  - Displays personal data, credentials, social security data (e.g., historical records, benefits).  
  - Offers additional services such as downloading official documents and scheduling appointments.

- **State Management**  
  - **Redux Toolkit** for storing authentication state (token, user, etc.) and controlling “verified” status.

- **Internationalization**  
  - **i18next** for multi-language support (English, Spanish, etc.).

- **Responsive UI & Animations**  
  - **TailwindCSS** for responsive styling.  
  - **Framer Motion** for smooth animations/transitions.

- **Security Measures**  
  - Uses environment variable `REACT_APP_BACKEND_URL` to communicate with a secure backend.  
  - Minimal local storage usage for tokens (access token, refresh token) with Redux state management.

---

## Technologies & Dependencies

Key dependencies from `package.json`:

- **React** & **React DOM** (v18)  
- **Redux Toolkit** + **React Redux**  
- **TailwindCSS** + **PostCSS** + **Autoprefixer**  
- **Axios** for API requests  
- **React Router DOM** for routing  
- **i18next** & **react-i18next** for translations  
- **Framer Motion** for animations  
- **Zod** for validation schemas  
- **QRcode.react** for rendering QR codes  
- **React Icons** (e.g., FontAwesome icons)

Dev dependencies include Babel plugins and Tailwind-related packages.

---

## Project Structure

A simplified view of the folder layout:

```
frontend/
├── public/
│   ├── index.html
│   ├── robots.txt
│   ├── manifest.json
│   └── (favicon.ico, logo files, etc.)
├── src/
│   ├── components/
│   │   ├── Header/
│   │   └── Footer/
│   ├── pages/
│   │   ├── Home/
│   │   ├── Register/
│   │   ├── Alta/
│   │   ├── Dashboard/
│   │   ├── LoginWithWallet/
│   │   ├── VerificationMethodSelect/
│   │   └── ...
│   ├── store/
│   │   ├── authSlice.js
│   │   └── store.js
│   ├── services/
│   │   └── api.js
│   ├── utils/
│   │   └── validation.js
│   ├── i18n.js
│   ├── App.js
│   ├── index.js
│   ├── index.css
│   └── ...
├── .env
├── package.json
├── Dockerfile
├── tailwind.config.js
├── postcss.config.js
├── nginx.conf (example for SSL & proxy)
└── README.md
```

### Notable Folders

- **`pages/`**: Each directory under `pages` represents a major route or view in the application (e.g., `Home`, `Dashboard`, `Alta`).  
- **`components/`**: Reusable UI components like `Header`, `Footer`, and other shared elements.  
- **`store/`**: Redux Toolkit configuration (`store.js`) and slices (e.g., `authSlice`).  
- **`services/`**: Contains functions (`api.js`) for calling backend endpoints (`/verification`, `/issuance`, etc.).  
- **`utils/`**: General utility code, e.g., data validation using Zod.  
- **`i18n.js`**: Manages language resources and initialization of i18next.

---

## Installation

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
   cd social-security-web
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Set up Environment Variables**

   Create or edit the `.env` file to point to your backend:

   ```bash
   REACT_APP_BACKEND_URL=https://localhost/backend
   ```

   This `REACT_APP_BACKEND_URL` is used by the frontend to make API calls to the backend.  
   **Note**: CRA (Create React App) requires environment variables to be prefixed with `REACT_APP_`.

4. **Run the Development Server**

   ```bash
   npm start
   ```

   By default, the app is served at [http://localhost:3000](http://localhost:3000).

---

## Configuration

### TailwindCSS
- The project uses **TailwindCSS** for styling.  
- Key files:
  - `tailwind.config.js`: Configures paths to `.js/.jsx/.ts/.tsx` for purge and custom theme settings (colors, fonts, etc.).  
  - `postcss.config.js`: Contains Tailwind and Autoprefixer as PostCSS plugins.  
- The main entry is `index.css`, which imports Tailwind’s base, components, and utilities.

### Redux
- The **Redux Toolkit** store is set up in `src/store/store.js`.  
- `authSlice.js` manages user authentication status, tokens, verification flags, etc.

### i18next
- Internationalization config is in `src/i18n.js` with Spanish (`es`) and English (`en`) strings as examples.

---

## Scripts & Usage

Once in the project directory, you can use:

- **`npm start`**  
  Launches the development server at [http://localhost:3000](http://localhost:3000). It automatically rebuilds on file changes.

- **`npm run build`**  
  Builds the production-ready static files into `build/`. This includes code minification and bundling for best performance.

- **`npm test`**  
  Runs tests in interactive watch mode using **React Testing Library** and **Jest**.

- **`npm run eject`**  
  Ejects from Create React App configuration. **Warning**: This is irreversible.

---

## Docker Support

A **multi-stage Dockerfile** is included:

1. **Build Stage**  
   - Uses `node:16` to install dependencies and run `npm run build`.  
   - Produces optimized static files in `/app/build`.

2. **Runtime Stage**  
   - Uses `node:16-alpine`, installs `serve` globally.  
   - Copies the `build` folder from the first stage.  
   - Exposes port `3000` and serves the static files with `serve`.

### Build & Run with Docker

```bash
# 1) Build image
docker build -t social-security-web:latest .

# 2) Run container
docker run -d -p 3000:3000 social-security-web:latest
```

Open [http://localhost:3000](http://localhost:3000) to access the app.

---

## Internationalization (i18n)

- **Languages**: Spanish (`es`) and English (`en`) are provided as examples in `i18n.js`.  
- To add more languages, extend the `resources` object and specify translations.  
- The default language is set to Spanish (`lng: "es"`). Switch languages by changing `i18n` config or hooking up a language selector component.

---

## Environment Variables

In the **`.env`** file (at the project root):

- **`REACT_APP_BACKEND_URL`**  
  Backend endpoint for all API calls. By default: `https://localhost/backend`.

**Important**: Any new environment variables must be prefixed with `REACT_APP_` for Create React App to include them in the build process.

---

## Deployment Notes

1. **Production Build**:  
   Run `npm run build`, which outputs static files in the `build` folder.

2. **Serve Static Files**:  
   - The included **Dockerfile** uses `serve -s build -l 3000`.  
   - Alternatively, you could deploy on **Nginx** or **Apache**. An example `nginx.conf` is provided, which can handle SSL on port 443, proxying to the frontend container at port 3000, and rewriting paths for the backend at port 3001.

3. **HTTPS & Certificates**  
   - If using Docker + Nginx in production, you can mount your certificates in `nginx.conf` paths.  
   - For local development with HTTPS, you can set up self-signed certificates or use a certificate authority.

4. **Integration with Backend**:  
   - The **backend** expects to receive calls at `/verification/*`, `/issuance/*`, `/auth/*`, etc.  
   - In production, ensure your reverse proxy (e.g., Nginx) points `location /backend` to the correct container/port.

---

## Contributing

We welcome contributions and improvements to this frontend. To get started:

1. **Fork** the repository.  
2. **Create** a new branch: `git checkout -b feature/my-feature`.  
3. **Commit** your changes: `git commit -m "Add new feature"`.  
4. **Push** the branch: `git push origin feature/my-feature`.  
5. Open a **Pull Request** and we’ll review your changes!

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](../LICENSE) file for details.

---