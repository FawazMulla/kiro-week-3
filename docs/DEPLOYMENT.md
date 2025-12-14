# Deployment Guide

This guide covers deploying the Meme vs Market Dashboard to various hosting platforms.

## Prerequisites

- Node.js 18+ installed locally
- Project built successfully (`npm run build`)
- Environment variables configured (if using API keys)

## Static Hosting Platforms

### Vercel (Recommended)

Vercel provides excellent support for Vite applications with automatic deployments.

#### Quick Deploy
```bash
npm install -g vercel
vercel --prod
```

#### GitHub Integration
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Enable automatic deployments on push

#### Environment Variables
In Vercel dashboard, add:
```
VITE_ALPHA_VANTAGE_KEY=your_key_here
VITE_REDDIT_CLIENT_ID=your_client_id
VITE_REDDIT_CLIENT_SECRET=your_client_secret
```

### Netlify

#### Manual Deploy
1. Run `npm run build`
2. Upload `dist/` folder to Netlify
3. Configure environment variables in site settings

#### Git Integration
1. Connect repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in site settings

### GitHub Pages

#### Using GitHub Actions
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          VITE_ALPHA_VANTAGE_KEY: ${{ secrets.VITE_ALPHA_VANTAGE_KEY }}
          VITE_REDDIT_CLIENT_ID: ${{ secrets.VITE_REDDIT_CLIENT_ID }}
          VITE_REDDIT_CLIENT_SECRET: ${{ secrets.VITE_REDDIT_CLIENT_SECRET }}
          
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

## MCP Server Deployment

MCP servers can be deployed separately for production use:

### Serverless Functions

#### Vercel Functions
Create `api/stock.js`:
```javascript
import { StockServer } from '../mcp-servers/stock-server/index.js';

export default async function handler(req, res) {
  // Handle MCP requests
}
```

#### Netlify Functions
Create `netlify/functions/stock.js`:
```javascript
const { StockServer } = require('../../mcp-servers/stock-server/index.js');

exports.handler = async (event, context) => {
  // Handle MCP requests
};
```

### Container Deployment

#### Docker
Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY mcp-servers/ ./mcp-servers/
COPY package*.json ./

RUN npm ci --only=production

EXPOSE 3000
CMD ["node", "mcp-servers/stock-server/index.js"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  stock-server:
    build: .
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=production
      
  social-server:
    build: .
    command: node mcp-servers/social-server/index.js
    ports:
      - "3002:3000"
    environment:
      - NODE_ENV=production
```

## Performance Optimization

### CDN Configuration

#### Cloudflare
1. Add your domain to Cloudflare
2. Enable caching for static assets
3. Configure compression (Brotli/Gzip)
4. Enable minification for JS/CSS/HTML

#### AWS CloudFront
1. Create CloudFront distribution
2. Set origin to your hosting platform
3. Configure caching behaviors
4. Enable compression

### Caching Headers

Configure your hosting platform to set appropriate cache headers:

```
# Static assets (1 year)
/assets/*
  Cache-Control: public, max-age=31536000, immutable

# HTML files (1 hour)
/*.html
  Cache-Control: public, max-age=3600

# API responses (5 minutes)
/api/*
  Cache-Control: public, max-age=300
```

## Monitoring and Analytics

### Error Tracking

#### Sentry
```javascript
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production"
});
```

#### LogRocket
```javascript
import LogRocket from 'logrocket';

LogRocket.init('your-app-id');
```

### Performance Monitoring

#### Google Analytics
Add to `index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

#### Web Vitals
```javascript
import {getCLS, getFID, getFCP, getLCP, getTTFB} from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

## Security Considerations

### Environment Variables
- Never commit API keys to version control
- Use different keys for development/production
- Rotate keys regularly
- Monitor API usage for anomalies

### Content Security Policy
Add to `index.html`:
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  connect-src 'self' https://query1.finance.yahoo.com https://www.reddit.com;
  img-src 'self' data: https:;
">
```

### HTTPS
- Always deploy with HTTPS enabled
- Use HSTS headers
- Configure secure cookies if using authentication

## Troubleshooting

### Build Failures
- Check Node.js version (18+ required)
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

### Runtime Errors
- Check browser console for JavaScript errors
- Verify API endpoints are accessible
- Check CORS configuration
- Validate environment variables

### Performance Issues
- Enable compression on hosting platform
- Optimize images and assets
- Use CDN for static assets
- Monitor Core Web Vitals

## Rollback Strategy

### Quick Rollback
Most hosting platforms support instant rollback:
- Vercel: Use deployment history in dashboard
- Netlify: Revert to previous deploy
- GitHub Pages: Revert commit and re-deploy

### Database Rollback
If using external databases:
1. Stop application
2. Restore database backup
3. Deploy previous application version
4. Verify functionality

## Maintenance

### Regular Tasks
- Monitor API rate limits and usage
- Update dependencies monthly
- Review error logs weekly
- Test backup/restore procedures
- Monitor performance metrics

### Security Updates
- Enable automated security updates
- Review dependency vulnerabilities
- Update API keys if compromised
- Monitor for unusual traffic patterns