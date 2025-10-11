# Deployment Configuration for SuperAdmin Panel

## Environment Setup

### Development

```bash
# Use default .env file
npm run dev
```

### Production Build

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

### Environment Variables

#### Development (.env)

- `VITE_API_BASE_URL=http://localhost:8000`
- `VITE_APP_ENV=development`

#### Production (.env.production)

- `VITE_API_BASE_URL=https://your-backend-domain.com`
- `VITE_APP_ENV=production`

## Deployment Steps

### 1. Configure Backend URL

Update `.env.production` with your actual backend URL:

```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

### 2. Build for Production

```bash
npm run build
```

### 3. Deploy

The `dist` folder contains the production build. Deploy it to:

- **Netlify**: Drag and drop `dist` folder
- **Vercel**: Connect GitHub repo or upload `dist`
- **Traditional Server**: Upload `dist` contents to web root

### 4. Configure Server

Ensure your web server serves `index.html` for all routes (SPA routing).

#### Nginx Configuration

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

#### Apache Configuration (.htaccess)

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

## Features Ready for Deployment

✅ **Axios Integration**: All fetch calls replaced with axios instance
✅ **Environment Configuration**: Base URL configured from environment variables
✅ **Error Handling**: Proper error handling for API calls
✅ **Authentication**: Token-based auth with interceptors
✅ **Profile Management**: Complete profile system with photo upload
✅ **PIN Management**: MPIN setup with OTP verification
✅ **Password Management**: Password updates with security PIN
✅ **Bank Details**: Bank account management
✅ **Responsive Design**: Mobile-friendly interface

## Production Checklist

- [ ] Update `VITE_API_BASE_URL` in `.env.production`
- [ ] Test all API endpoints with production backend
- [ ] Verify authentication flow
- [ ] Test file uploads (profile photos)
- [ ] Test OTP email delivery
- [ ] Configure CORS on backend for frontend domain
- [ ] Set up SSL certificates
- [ ] Configure CDN (optional)
- [ ] Set up monitoring and analytics
