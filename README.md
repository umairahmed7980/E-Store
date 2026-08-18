# E Store — مکمل e-commerce app starter

یہ پروجیکٹ ایک چلنے والا web/PWA e-commerce app ہے، نہ کہ صرف static design۔

## موجود فیچرز
- Urdu RTL storefront
- Grocery + Dry Fruits categories
- Search
- Product cards
- Cart + quantity controls
- Checkout
- Cash on Delivery
- Delivery fee / free-delivery threshold
- Server-side stock validation and stock deduction
- Unique order number
- Customer order tracking
- Responsive mobile UI
- Installable PWA shell
- Admin dashboard
- Admin order status management
- Product add/edit/hide
- Sales/pending/order statistics

## چلانا
Node.js 18+ درکار ہے:
1. `npm install`
2. `.env.example` کو `.env` بنائیں اور ADMIN_KEY تبدیل کریں۔
3. `npm start`
4. Store: `http://localhost:3000`
5. Admin: `http://localhost:3000/admin.html`

## Production میں لازمی کام
یہ project production-ready deployment credentials کے بغیر مکمل طور پر live نہیں ہو سکتا۔ Live کرنے کے لیے:
- Domain + HTTPS
- PostgreSQL/MySQL
- Secure authentication + OTP
- Real payment gateway (مثلاً JazzCash/Easypaisa/بینک/Stripe جہاں دستیاب ہو)
- Courier/shipping API
- SMS/WhatsApp provider
- Cloud image storage
- Backups, logging, rate limits, CSRF/security hardening
- Admin roles/permissions

Payment اور courier integration provider/account credentials کے بغیر placeholder رہیں گے۔
