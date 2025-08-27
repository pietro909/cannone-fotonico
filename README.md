### Tech stack

- Typescript
- NestJS
- SQLite
 
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

###  Production Deployment

TODO
