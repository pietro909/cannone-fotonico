
### Development Workflow

1. **Start development environment:**
   ```bash
   docker compose --profile dev up api-dev
   ```

2. **Make changes to your code** - changes will be automatically reflected due to volume mounting and hot reload

3. **View logs:**
   ```bash
   docker compose logs -f api-dev
   ```

4. **Stop development environment:**
   ```bash
   docker compose down
   ```

### [WIP] Production Deployment

For production deployment:

1. **Build the production image:**
   ```bash
   docker build -t your-nestjs-app:latest .
   ```

2. **Run with proper environment variables:**
   ```bash
   docker run -d \
     -p 3000:3000 \
     -v $(pwd)/data:/app/data \
     --env-file .env.production \
     --restart unless-stopped \
     your-nestjs-app:latest
   ```
