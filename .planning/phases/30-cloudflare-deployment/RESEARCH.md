---
phase: 30
research: cloudflare-pages-deployment
status: complete
---

# Research: Cloudflare Pages Frontend Deployment

## Objective
Research best practices for deploying Next.js applications to Cloudflare Pages with static export, focusing on configuration, edge caching, and CI/CD workflows.

## Next.js Static Export Configuration

### Standard Configuration Requirements
- `output: 'export'` - Required for static HTML export for CDN hosting
- `trailingSlash: true` - Ensures clean URL routing for static hosting
- `images: { unoptimized: true }` - Required because image optimization needs Node.js server (not available in static export)

### Additional Optimizations
- Preload critical resources with `<link rel="preload">` tags in `_document.js` (though not available in App Router)
- Proper caching headers via CF Pages configuration
- Asset compression (handled automatically by Cloudflare)

## Cloudflare Pages Benefits for Static Sites

### Performance Advantages
- Global CDN with 300+ locations worldwide
- Sub-second average response times
- Automatic image optimization at the edge
- Smart caching headers
- Fastest DNS (1.1.1.1 integration)

### Developer Experience
- PR previews auto-generated
- One-click deployments
- Built-in CI/CD integration
- Branch-based deployments
- Custom domain support

## Build Configuration for Monorepo

### Cloudflare Pages Monorepo Support
For monorepos, the build configuration needs to target the correct subdirectory:
- `build command`: `cd apps/web && bun install && bun run build`
- `build directory`: `apps/web/out` (output directory of next export)
- Root directory: repository root for GitHub Actions scanning

### Environment Variables
- Only `NEXT_PUBLIC_*` variables will be embedded in static build
- Secret variables should be accessed during build time, not runtime 

## GitHub Actions Deployment Workflow

### Recommended Workflow Pattern
```yaml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
    
jobs:
  deploy:
    name: Deploy to Cloudflare Pages
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        
      - name: Install dependencies
        run: cd apps/web && bun install
        
      - name: Build project
        run: cd apps/web && bun run build
        
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: eggo-world-web
          directory: apps/web/out
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

### Secrets Required
- `CLOUDFLARE_API_TOKEN` - API token with Pages permissions
- `CLOUDFLARE_ACCOUNT_ID` - Account identifier in Cloudflare dashboard
- `GITHUB_TOKEN` - Provided automatically by GitHub

## Next.js App Router Specific Considerations

### Static Site Generation (SSG) Limitations
- All data fetching must be at build time using `generateStaticParams` or `dynamicParams`
- Dynamic routes without `generateStaticParams` cannot be prerendered
- Requires compatible API endpoints (external APIs in this case)

### Authentication Handling
Since the site uses PocketBase authentication, client-side authentication will work similarly, but the initial HTML will always be static. The auth state will be hydrated on the client via PocketBase SDK.

### Caching Headers for Authenticated Content
Since there's no dynamic server for user-specific content, all content gets cached globally, which limits personalized experiences in static export mode.

## Custom Domain Configuration

### Recommended Setup
1. Purchase/own domain (eggoworld.io)
2. Point nameservers to Cloudflare in your domain registrar
3. Add custom domain in Cloudflare Pages dashboard
4. Wait for SSL certificate to provision
5. Verify proper DNS propagation 

### DNS Configuration
Cloudflare Pages typically requires CNAME pointing to `*.pages.dev`

## Edge Caching for Performance

### Static Assets
Cloudflare automatically optimizes static asset delivery with:
- Image optimization and format conversion
- Compression (gzip/brotli)
- Global caching
- Smart prefetching

### Routing Considerations
For SPA apps, ensure `200.html` or `_routes.json` configuration handles client-side routing correctly

## Rollback and Recovery

### Versioning Strategy
Cloudflare Pages keeps build history and allows reverting to previous deployments through the dashboard or API.

### Health Checks
Consider implementing a simple health endpoint or verifying that the deployment actually works after deployment.

## Environment Variables

### Build-Time vs Runtime
- Build-time variables: Available during `next build` (only PUBLIC_ variables get embedded)
- Runtime variables: Not available for static exports directly (would need API call to external service to access secrets)

## Recommended Next.js Configuration for CF Pages

Based on research, the optimal configuration for this project:

```js
// next.config.mjs
const nextConfig = {
  // Static export required for CF Pages
  output: 'export',
  
  // For clean routing
  trailingSlash: true,
  
  // Static export requires unoptimized images
  images: {
    unoptimized: true,
  },
  
  // Dist dir for deployment
  distDir: 'out',
  
  // Disable features that require server
  experimental: {
    serverComponents: false, // If needed based on implementation
  },
};

export default nextConfig;
```

## Performance Optimization Strategies

### Before Deployment
- Minimize external dependencies where possible
- Optimize image assets in public directory (or plan for client-side compression)
- Leverage Next.js static generation where feasible
- Ensure proper code splitting via dynamic imports

### After Deployment
- Monitor analytics for performance insights
- Check cache hit ratios in Cloudflare dashboard
- Verify that dynamic content loading via API works as intended
- Monitor error rates from client-side runtime issues

## References

1. Cloudflare Pages Documentation: https://developers.cloudflare.com/pages/
2. Next.js Static Export: https://nextjs.org/docs/app/building-your-application/deploying/static-exports
3. CF Pages with Monorepos: https://developers.cloudflare.com/pages/configuration/build-configuration/
4. Deployment GitHub Action: https://github.com/cloudflare/pages-action
5. Next.js Production Deployment: https://nextjs.org/docs/pages/building-your-application/deploying