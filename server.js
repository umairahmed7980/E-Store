const express=require("express"),cors=require("cors"),fs=require("fs"),path=require("path");
const app=express();
const PORT=process.env.PORT||3000;
const ADMIN_KEY=process.env.ADMIN_KEY||"CHANGE-ME-ADMIN-KEY";
const DB=path.join(__dirname,"data","store.json");
app.use(cors()); app.use(express.json({limit:"2mb"})); app.use(express.static(path.join(__dirname,"public")));

const read=()=>JSON.parse(fs.readFileSync(DB,"utf8"));
const write=db=>fs.writeFileSync(DB,JSON.stringify(db,null,2));
const auth=(req,res,next)=>{if(req.headers["x-admin-key"]!==ADMIN_KEY)return res.status(401).json({error:"Admin authorization required"});next()};
const money=n=>Math.round(Number(n)||0);

app.get("/api/store",(req,res)=>res.json(read().settings));
app.get("/api/categories",(req,res)=>{const d=read();res.json([...new Set(d.products.filter(p=>p.active!==false).map(p=>p.category))])});
app.get("/api/products",(req,res)=>{
 let ps=read().products.filter(p=>p.active!==false);
 const q=(req.query.q||"").trim().toLowerCase(), c=req.query.category;
 if(q)ps=ps.filter(p=>(p.name+" "+p.category).toLowerCase().includes(q));
 if(c&&c!=="all")ps=ps.filter(p=>p.category===c);
 res.json(ps);
});
app.get("/api/products/:id",(req,res)=>{
 const p=read().products.find(x=>x.id===Number(req.params.id));
 p?res.json(p):res.status(404).json({error:"Product not found"});
});

app.post("/api/orders",(req,res)=>{
 const {customer,items,paymentMethod="cod",notes=""}=req.body;
 if(!customer?.name||!customer?.phone||!customer?.address||!Array.isArray(items)||!items.length)
   return res.status(400).json({error:"نام، موبائل، پتہ اور کم از کم ایک پروڈکٹ ضروری ہے۔"});
 const d=read(), final=[]; let subtotal=0;
 for(const it of items){
   const p=d.products.find(x=>x.id===Number(it.id)&&x.active!==false), qty=Math.max(1,Math.floor(Number(it.qty)||1));
   if(!p)return res.status(400).json({error:"پروڈکٹ دستیاب نہیں۔"});
   if(p.stock<qty)return res.status(400).json({error:`${p.name} کا اسٹاک کافی نہیں۔`});
   final.push({id:p.id,name:p.name,price:p.price,qty,unit:p.unit,image:p.image}); subtotal+=p.price*qty;
 }
 const fee=subtotal>=d.settings.freeDeliveryFrom?0:d.settings.deliveryFee;
 const order={id:"ES"+Date.now().toString().slice(-9),createdAt:new Date().toISOString(),customer,items:final,subtotal,deliveryFee:fee,total:subtotal+fee,paymentMethod,notes,status:"نیا آرڈر"};
 final.forEach(i=>{d.products.find(p=>p.id===i.id).stock-=i.qty});
 d.orders.unshift(order); write(d); res.status(201).json({success:true,order});
});
app.get("/api/orders/track/:id",(req,res)=>{
 const o=read().orders.find(x=>x.id.toLowerCase()===req.params.id.toLowerCase());
 o?res.json({id:o.id,createdAt:o.createdAt,total:o.total,status:o.status,items:o.items}):res.status(404).json({error:"آرڈر نہیں ملا۔"});
});

app.get("/api/admin/stats",auth,(req,res)=>{
 const d=read(); const completed=d.orders.filter(o=>o.status==="مکمل");
 res.json({products:d.products.length,activeProducts:d.products.filter(p=>p.active!==false).length,orders:d.orders.length,pending:d.orders.filter(o=>!["مکمل","منسوخ"].includes(o.status)).length,revenue:completed.reduce((s,o)=>s+o.total,0)});
});
app.get("/api/admin/orders",auth,(req,res)=>res.json(read().orders));
app.patch("/api/admin/orders/:id",auth,(req,res)=>{
 const d=read(),o=d.orders.find(x=>x.id===req.params.id);
 if(!o)return res.status(404).json({error:"Order not found"});
 const allowed=["نیا آرڈر","تصدیق شدہ","پیک ہو رہا ہے","بھیج دیا گیا","مکمل","منسوخ"];
 if(!allowed.includes(req.body.status))return res.status(400).json({error:"Invalid status"});
 o.status=req.body.status; write(d); res.json(o);
});
app.post("/api/admin/products",auth,(req,res)=>{
 const d=read(),b=req.body;
 if(!b.name||!b.category||money(b.price)<=0)return res.status(400).json({error:"نام، کیٹیگری اور قیمت ضروری ہیں۔"});
 const p={id:Date.now(),name:b.name,category:b.category,price:money(b.price),oldPrice:money(b.oldPrice),stock:money(b.stock),unit:b.unit||"",image:b.image||"",rating:5,active:true};
 d.products.push(p);write(d);res.status(201).json(p);
});
app.patch("/api/admin/products/:id",auth,(req,res)=>{
 const d=read(),p=d.products.find(x=>x.id===Number(req.params.id));
 if(!p)return res.status(404).json({error:"Product not found"});
 Object.assign(p,req.body); if(req.body.price!==undefined)p.price=money(req.body.price); if(req.body.stock!==undefined)p.stock=money(req.body.stock); write(d);res.json(p);
});
app.delete("/api/admin/products/:id",auth,(req,res)=>{
 const d=read(),p=d.products.find(x=>x.id===Number(req.params.id)); if(!p)return res.status(404).json({error:"Product not found"});
 p.active=false;write(d);res.json({success:true});
});
app.patch("/api/admin/settings",auth,(req,res)=>{
 const d=read(); ["storeName","currency","deliveryFee","freeDeliveryFrom"].forEach(k=>{if(req.body[k]!==undefined)d.settings[k]=req.body[k]});
 write(d);res.json(d.settings);
});
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log(`E Store running on http://localhost:${PORT}`));