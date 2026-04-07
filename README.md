# TOSM Boss Timer

Boss spawn tracker for Tree of Savior M.

## Deploy

Push to main branch → auto-deploy to VPS

```bash
# Deploy manually
npm run build
systemctl restart boss-timer
```

## Tech Stack

- React (Vite)
- Supabase (pending)
- VPS + Nginx + SSL
