# Concrete Ops

## Setup Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/<owner>/concrete-ops.git
   cd concrete-ops
   ```
2. Install the required dependencies:
   ```bash
   npm install
   ```
3. Run the application:
   ```bash
   npm start
   ```

## Environment Configuration
- Create a `.env` file in the root directory and configure the following variables:
  - `DATABASE_URL`: The connection URL for your database.
  - `PORT`: The port on which the application will run. (default: `3000`)
  - `SECRET_KEY`: A secret key for JWT authentication.

## Database Migration Workflow
1. Ensure you have a database server running and your `DATABASE_URL` is set.
2. Run migrations using the following command:
   ```bash
   npm run migrate
   ```
3. To roll back the last migration, use:
   ```bash
   npm run migrate:rollback
   ```

## API Documentation
### Endpoints
- **GET** `/api/items`:
  - Description: Retrieves a list of items.
  - Response: `200 OK`
- **POST** `/api/items`:
  - Description: Creates a new item.
  - Body: `{ "name": "string", "description": "string" }`
  - Response: `201 Created`

For detailed API documentation, please refer to the [API Docs](docs/api.md).
