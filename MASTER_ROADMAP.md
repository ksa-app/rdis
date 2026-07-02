# OVERSEASERP - MASTER ROADMAP

এই স্টার্টার প্রজেক্ট থেকে পরবর্তী মাইলস্টোনে যাওয়ার জন্য।

## ✅ Completed (v0.1.0)

- [x] Multi-tenant architecture with Supabase
- [x] Authentication (Signup/Login)
- [x] Auto-organization creation on signup
- [x] RBAC with 9 roles
- [x] Candidate CRUD
- [x] Team management (invite, roles, suspend)
- [x] Organization settings
- [x] Billing page (UI only)
- [x] Reports placeholder
- [x] Complete SQL schema with RLS

## 🚧 In Progress (v0.2.0)

- [ ] Medical records full CRUD
- [ ] Visa processing module
- [ ] MOFA tracking
- [ ] Fingerprint/Police clearance workflow

## 📅 Next (v0.3.0)

### Documents & Storage
```
app/documents/
  - Upload candidates passport/photo
  - Document categorization
  - Cloud storage integration (Supabase Storage)
  - QR code/Barcode generation
```

### Communications
```
app/communications/
  - Email templates & automation
  - SMS notifications
  - WhatsApp integration
  - In-app notifications (real-time)
```

### Financial Module (Complete)
```
app/accounts/
  - Invoice generation
  - Payment tracking
  - Expense management
  - Ledger & reports
  - Cashbook
  - Bank reconciliation
```

### Analytics & Reporting
```
app/analytics/
  - Dashboard with charts
  - Country-wise statistics
  - Visa-wise breakdown
  - Staff performance metrics
  - Revenue reports
  - Export to PDF/Excel/CSV
```

### Pipeline Management
```
app/pipeline/
  - Visual pipeline view
  - Drag-drop status update
  - Timeline view per candidate
  - Bulk operations
  - Workflow automation
```

### Activity & Audit
```
- Automatic logging of every action
- Who, What, When, Where (IP, Browser, Device)
- Old value <-> New value tracking
- Audit reports
```

## 🎯 Enterprise Features (v1.0.0)

### API & Integrations
```
- REST API with API keys
- Webhook system
- Rate limiting
- SDK for third parties
```

### Billing & Subscriptions
```
- Stripe integration
- Subscription plans
- Usage-based pricing
- Invoice generation
- Payment history
- Coupon & discounts
```

### Advanced RBAC
```
- Custom roles builder
- Permission groups
- Field-level access control
- API endpoint permissions
- Button-level permissions
```

### White-label SaaS
```
- Tenant branding (logo, colors, themes)
- Custom domain support
- Email template customization
- White-label mobile app
```

## 🤖 AI Features (v1.5.0)

- Passport OCR (extract info automatically)
- Document OCR (medical, police clearance)
- AI duplicate detection (same person multiple records)
- AI-powered search
- Chat assistant for support
- Predictive analytics (which candidates likely to be approved)
- Auto-summary of candidate status

## 📱 Mobile (v2.0.0)

- iOS app (React Native)
- Android app (React Native)
- Offline-first functionality
- Push notifications
- Biometric login

## 🔌 Integrations (v2.1.0)

- Google Workspace
- Slack
- Teams
- Zapier
- Make.com
- Custom webhooks

## 📊 Sample Data Setup

Create test organizations with:
```sql
INSERT INTO organizations (name, slug, plan) VALUES
  ('ABC Recruitment', 'abc-recruitment-xyz123', 'trial'),
  ('XYZ Overseas', 'xyz-overseas-abc456', 'pro'),
  ('Global Manpower', 'global-manpower-def789', 'starter');
```

## 🛠 Development Setup

### Database
```bash
# 1. Create new Supabase project
# 2. Run complete_saas_schema.sql in SQL Editor
# 3. Enable RLS for all tables
# 4. Create email auth provider (or disable verification)
```

### Frontend
```bash
# 1. npm install
# 2. cp .env.local.example .env.local
# 3. Add SUPABASE_URL and ANON_KEY
# 4. npm run dev
```

### Testing
```bash
# Test multi-tenant isolation:
1. Create Org A with User 1
2. Create Org B with User 2
3. Login as User 1 - should only see Org A data
4. Login as User 2 - should only see Org B data
5. Verify RLS is working (check SQL)
```

## 📚 Code Patterns to Follow

### Adding a new module (e.g., Fingerprints)
1. Add to SQL schema (fingerprints table)
2. Create `app/fingerprints/page.tsx`
3. Copy pattern from `candidates/page.tsx`
4. Add organization_id checks
5. Add to navigation in dashboard

### Adding a new role
1. Add to `role_enum` type in SQL
2. Update `ROLES` array in `team/page.tsx`
3. Update RLS policies
4. Test permissions

### Adding new UI
1. Use Tailwind classes (already configured)
2. Import from `lucide-react` for icons
3. Follow existing modal patterns
4. Use TypeScript for type safety

## 🚀 Deployment

### Vercel (Recommended)
```bash
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📈 Scaling Checklist

- [ ] Database indexing optimized
- [ ] Caching strategy implemented
- [ ] API rate limiting added
- [ ] Storage strategy (local vs cloud)
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Load testing completed
- [ ] Security audit done
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan

## 🎓 Learning Resources

- Supabase multi-tenancy: https://supabase.com/docs/guides/auth/row-level-security
- Next.js SaaS template: https://github.com/vercel/next.js/tree/canary/examples/with-supabase
- RBAC patterns: https://casl.js.org/
- PostgreSQL RLS: https://www.postgresql.org/docs/current/ddl-rowsecurity.html

## 🤝 Contributing Guidelines

When adding features:
1. Follow the existing code structure
2. Add proper TypeScript types
3. Update README.md
4. Test multi-tenant isolation
5. Document new API endpoints
6. Add to this roadmap

---

**Current Version:** 0.1.0  
**Last Updated:** 2024-06-30  
**Maintainer:** Your Team
