# OverseasERP - Complete SaaS Platform

একটি modern multi-tenant SaaS platform যা overseas recruitment agencies এর জন্য সম্পূর্ণ ERP সমাধান প্রদান করে।

## ✨ Features

### Core Modules
- **Candidate Management** - সম্পূর্ণ candidate lifecycle management
- **Medical Tracking** - মেডিকেল রেকর্ড এবং স্ট্যাটাস ম্যানেজমেন্ট
- **Visa Processing** - ভিসা আবেদন এবং ট্র্যাকিং
- **MOFA Management** - মোফা আবেদন ম্যানেজমেন্ট
- **Fingerprint & Police Clearance** - আইডেন্টিফিকেশন ডকুমেন্ট ট্র্যাকিং
- **Accounts & Invoicing** - সম্পূর্ণ আর্থিক ম্যানেজমেন্ট

### Organizational Features
- **Multi-Tenant Architecture** - সম্পূর্ণ ডেটা আইসোলেশন
- **RBAC (Role-Based Access Control)** - 9টি পূর্বনির্ধারিত ভূমিকা
- **Team Management** - টিম মেম্বার যুক্ত করুন এবং অনুমতি পরিচালনা করুন
- **Subscription Management** - প্ল্যান এবং বিলিং ম্যানেজমেন্ট
- **Organization Settings** - ব্র্যান্ডিং এবং কনফিগারেশন

### Technical
- **Next.js 14** - সর্বশেষ React framework
- **Supabase** - PostgreSQL + Real-time + Auth
- **TypeScript** - সম্পূর্ণ type safety
- **Tailwind CSS** - সুন্দর UI
- **Row-Level Security** - ডাটাবেস-স্তরে নিরাপত্তা

## 🚀 Quick Start

### ০. প্রয়োজনীয়তা
- Node.js 16+ 
- npm বা yarn
- Supabase অ্যাকাউন্ট (free tier কাজ করে)

### ১. Supabase Setup

1. [Supabase](https://supabase.com) এ একটি নতুন প্রজেক্ট তৈরি করুন
2. SQL Editor এ যান (`app/sql-editor` tab)
3. **`complete_saas_schema.sql`** ফাইলের সম্পূর্ণ কন্টেন্ট কপি করুন
4. SQL Editor এ পেস্ট করে "RUN" বাটনে ক্লিক করুন

**এটি স্বয়ংক্রিয়ভাবে তৈরি করবে:**
- সমস্ত টেবিল এবং সম্পর্ক
- Multi-tenant RLS policies
- Auto-organization creation on signup trigger
- সমস্ত indexes এবং constraints

5. Supabase settings থেকে **Project URL** এবং **Anon Key** কপি করুন

### ২. Next.js App Setup

```bash
# প্রজেক্ট ক্লোন করুন
cd overseaserp

# ডিপেন্ডেন্সি ইনস্টল করুন
npm install

# এনভায়রনমেন্ট ভেরিয়েবল সেটআপ করুন
cp .env.local.example .env.local

# .env.local এ Supabase ডেটা বসান
# NEXT_PUBLIC_SUPABASE_URL=your-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key

# ডেভ সার্ভার চালু করুন
npm run dev
```

4. ব্রাউজারে যান: http://localhost:3000

### ৩. Sign Up করুন

1. `/auth/signup` এ যান
2. সংস্থার নাম, আপনার নাম, ইমেল এবং পাসওয়ার্ড এন্টার করুন
3. স্বয়ংক্রিয়ভাবে:
   - নতুন organization তৈরি হবে
   - আপনি `owner` ভূমিকা পাবেন
   - Dashboard এ রিডিরেক্ট করা হবে

## 📊 Architecture

### Database Structure
```
organizations                 # Multi-tenant root
├── profiles                 # ব্যবহারকারী প্রোফাইল
├── memberships              # ব্যবহারকারী <-> সংস্থা সম্পর্ক
├── invitations              # টিম ইনভাইটেশন
├── candidates               # প্রার্থীরা
├── medicals                 # মেডিকেল রেকর্ড
├── visas                    # ভিসা ডেটা
├── mofas                    # মোফা আবেদন
├── invoices & payments      # আর্থিক ট্রেক
└── settings                 # সংস্থা সেটিংস
```

### RBAC Roles
- **owner** - সবকিছুর মালিক, বিলিং অ্যাক্সেস
- **admin** - সম্পূর্ণ ডেটা অ্যাক্সেস, কিন্তু বিলিং নয়
- **manager** - সমস্ত মডিউল দেখুন এবং সম্পাদনা করুন
- **recruiter** - ক্যান্ডিডেট এবং ভিসা পরিচালনা করুন
- **medical_officer** - শুধুমাত্র মেডিকেল রেকর্ড
- **accounts** - শুধুমাত্র ইনভয়েস এবং পেমেন্ট
- **data_entry** - ডেটা যোগ করুন এবং সম্পাদনা করুন
- **support** - শুধুমাত্র দেখুন এবং সহায়তা করুন
- **viewer** - শুধুমাত্র পড়ুন

## 📂 প্রজেক্ট স্ট্রাকচার

```
overseaserp/
├── app/
│   ├── auth/
│   │   ├── signup/page.tsx
│   │   └── login/page.tsx
│   ├── dashboard/page.tsx
│   ├── candidates/page.tsx
│   ├── team/page.tsx
│   ├── settings/page.tsx
│   ├── billing/page.tsx
│   ├── reports/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── lib/
│   └── supabase.ts
├── types/
│   └── index.ts
├── .env.local.example
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## 🔄 Multi-Tenant কীভাবে কাজ করে

1. **Sign Up করলে:**
   - নতুন `organization` row তৈরি হয় (trigger দ্বারা)
   - `memberships` এ user = organization with role 'owner'
   - সমস্ত ডেটা `organization_id` দিয়ে চিহ্নিত

2. **SQL এ (RLS Policy):**
   ```sql
   organization_id in (select public.user_org_ids())
   ```
   - এটি নিশ্চিত করে user শুধু তার নিজের org এর ডেটা দেখতে পায়
   - Database-level এ সিকিউরিটি (app code এ নয়)

3. **Team invitation:**
   - Owner/Admin অন্যদের invite করতে পারে
   - Invite টোকেন দিয়ে তারা same organization তে join করে

## 🔐 Security Features

- **RLS (Row-Level Security)** - PostgreSQL level এ ডেটা isolation
- **Multi-tenant isolation** - সংস্থাগুলি একে অপরের ডেটা অ্যাক্সেস করতে পারে না
- **RBAC** - Role-based permission control
- **Environment variables** - Sensitive keys Supabase এ নিরাপদ
- **Auth trigger** - নতুন user = নতুন organization + membership

## 🚀 ভবিষ্যত উন্নয়ন (আপনার জন্য যুক্ত করার জিনিস)

### Short-term
- [ ] Document upload & storage integration
- [ ] Email notifications
- [ ] SMS alerts
- [ ] Advanced filtering & search
- [ ] Bulk import (CSV)
- [ ] Export reports (PDF/Excel)

### Medium-term
- [ ] Stripe billing integration
- [ ] API & webhooks
- [ ] Activity logs & audit trail
- [ ] Custom workflows
- [ ] Dashboard charts & analytics
- [ ] Mobile app (React Native)

### Long-term
- [ ] AI-powered OCR (passport scan)
- [ ] Predictive pipeline analytics
- [ ] Integration with third-party systems
- [ ] Custom roles/permissions builder
- [ ] White-label SaaS platform
- [ ] Marketplace for plugins

## 📝 Database Operations

### একটি নতুন candidate যুক্ত করুন (RLS সহ সুরক্ষিত)
```typescript
const { data, error } = await supabase
  .from('candidates')
  .insert({
    organization_id: currentOrgId,  // আপনার org
    name: 'John Doe',
    passport_no: 'ABC123456',
    status: 'new'
  });
```

**RLS স্বয়ংক্রিয়ভাবে নিশ্চিত করে:**
- শুধুমাত্র আপনার organization_id ডেটা যুক্ত হয়
- অন্যদের org এর ডেটা আপনি দেখতে পারবেন না

## 🐛 Troubleshooting

### সমস্যা: "access denied" ত্রুটি
**সমাধান:** নিশ্চিত করুন RLS policies চালু আছে। Supabase Dashboard এ:
- Settings → Authentication → Enable RLS for all tables

### সমস্যা: signup করতে পারছি না
**সমাধান:** 
- Email verification off করুন (auth settings এ)
- অথবা email confirm করুন

### সমস্যা: টিম মেম্বার invite হয়নি
**সমাধান:**
- `invitations` table এ রো আছে কিনা চেক করুন
- Email service অথবা manual verification প্রয়োজন

## 💡 Tips

1. **Local development এ:**
   - Supabase free tier যথেষ্ট
   - Network calls কমাতে offline-first strategy ব্যবহার করুন

2. **Production এ:**
   - RLS policies আবশ্যক
   - Environment secrets Vercel/production platform এ রাখুন
   - Regular backups সেটআপ করুন

3. **Scaling এর জন্য:**
   - Supabase একাধিক organization handle করতে পারে
   - PostgreSQL features ব্যবহার করুন (partitioning, indexing)

## 🤝 Contributing

MASTER_PROMPT.md এ উল্লেখিত features যুক্ত করতে welcome!

## 📄 License

আপনার নিজের use এর জন্য। Commercial use এর আগে আইনজীবীর পরামর্শ নিন।

## 📞 Support

প্রশ্ন বা সমস্যা? 
- Supabase docs: https://supabase.com/docs
- Next.js docs: https://nextjs.org/docs
- এই প্রজেক্টের SQL schema: `complete_saas_schema.sql`

---

**Happy coding! 🚀**
#   r d i s  
 