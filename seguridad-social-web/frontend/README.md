# Social Security Web - Frontend

This project serves as the frontend of the web application for managing procedures in Social Security. It is developed using React with support for TailwindCSS, Redux, and multiple languages through i18next.

## Prerequisites

Before starting, ensure you have installed:

- Node.js (version 16 or higher)
- npm (version 8 or higher)
- Docker (optional, for deployment)

## Installation

1. Clone this repository:

   ```bash
   git clone <repository-url>
   cd social-security-web
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Configure the environment variables in the `.env` file (a default is provided):

   ```env
   REACT_APP_BACKEND_URL=https://localhost/backend
   ```

4. (Optional) Configure SSL certificates for secure local deployment in the `certs` folder.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the application in development mode. Open [http://localhost:3000](http://localhost:3000) in your browser to view the app.

The page will automatically reload if you make edits to the code.

### `npm run build`

Builds the app for production to the `build` folder. The build is optimized and ready for deployment.

### `npm test`

Runs tests in interactive mode.

## Docker

### Build the Image

To create a Docker image of the frontend:

```bash
docker build -t social-security-web:latest .
```

### Run the Image

Execute the container:

```bash
docker run -d -p 3000:3000 social-security-web:latest
```

Access the application at [http://localhost:3000](http://localhost:3000).

## Project Structure

- `src/`
  - `components/`: Reusable components like Header and Footer.
  - `pages/`: Main pages of the application (e.g., Home, Register, Dashboard).
  - `store/`: Redux configuration and slices.
  - `services/`: Functions for interacting with the backend API.
  - `utils/`: Common utilities and validations.
  - `i18n.js`: Configuration for internationalization.
- `public/`: Static files like `index.html` and `manifest.json`.

## Key Features

- **Registration and Verification**: Users can verify their identity by scanning a QR code with their WaltId wallet.
- **Personal Dashboard**: Access to personalized information and services, such as credentials and active benefits.
- **Social Security Registration**: Guided process for registering using verifiable credentials.
- **Internationalization**: Available in multiple languages.
- **Responsive Design**: Adapted for mobile and desktop devices.

## Technologies Used

- React
- Redux Toolkit
- TailwindCSS
- i18next (internationalization)
- Axios (for HTTP requests)
- QRCode.react
- Framer Motion (animations)
- React Router
- Docker (for deployment)

## Contributing

If you wish to contribute to the development, please:

1. Fork the repository.
2. Create a branch for your feature or bug fix:
   ```bash
   git checkout -b feature/new-feature
   ```
3. Make your changes and commit:
   ```bash
   git commit -m "Description of changes made"
   ```
4. Push your changes to your fork:
   ```bash
   git push origin feature/new-feature
   ```
5. Create a Pull Request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
