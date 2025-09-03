# Command to login to postgres database on Digital Ocean droplet

```bash
ssh -L 5433:localhost:5432 root@167.71.138.241
psql -U fastapi_user -d fastapi_db -h localhost
```