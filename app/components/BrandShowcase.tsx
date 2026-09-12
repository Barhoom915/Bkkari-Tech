import Link from "next/link";

const BRAND_LOGOS: Record<string,string> = {
  Apple:"https://cdn.simpleicons.org/apple/0F2A4A", ASUS:"https://cdn.simpleicons.org/asus/0F2A4A", Lenovo:"https://cdn.simpleicons.org/lenovo/0F2A4A", Dell:"https://cdn.simpleicons.org/dell/0F2A4A", HP:"https://cdn.simpleicons.org/hp/0F2A4A", Acer:"https://cdn.simpleicons.org/acer/0F2A4A", MSI:"https://cdn.simpleicons.org/msi/0F2A4A", Microsoft:"https://cdn.simpleicons.org/microsoft/0F2A4A", Samsung:"https://cdn.simpleicons.org/samsung/0F2A4A", LG:"https://cdn.simpleicons.org/lg/0F2A4A", Razer:"https://cdn.simpleicons.org/razer/0F2A4A", Huawei:"https://cdn.simpleicons.org/huawei/0F2A4A", Gigabyte:"https://cdn.simpleicons.org/gigabyte/0F2A4A", VAIO:"https://cdn.simpleicons.org/vaio/0F2A4A", Dynabook:"https://cdn.simpleicons.org/dynabook/0F2A4A", Xiaomi:"https://cdn.simpleicons.org/xiaomi/0F2A4A", Framework:"https://cdn.simpleicons.org/framework/0F2A4A", Chuwi:"https://cdn.simpleicons.org/chuwi/0F2A4A", Medion:"https://cdn.simpleicons.org/medion/0F2A4A", Alienware:"https://cdn.simpleicons.org/alienware/0F2A4A", Toshiba:"https://cdn.simpleicons.org/toshiba/0F2A4A", Fujitsu:"https://cdn.simpleicons.org/fujitsu/0F2A4A"
};
const DEFAULT_BRANDS=["Apple","ASUS","Lenovo","Dell","HP","Acer","MSI","Microsoft","Samsung","LG","Razer","Huawei","Gigabyte","Alienware","Toshiba","Fujitsu","VAIO","Dynabook","Xiaomi","Framework","Chuwi","Medion"];

export default function BrandShowcase({ brands, counts = {}, selectedBrand }: { brands?:string[]; counts?:Record<string,number>; selectedBrand?:string }) {
 const available=new Set((brands??[]).filter(Boolean));
 const items=[...DEFAULT_BRANDS,...DEFAULT_BRANDS];
 return <section className="brand-strip-section">
  <div className="brand-strip-head"><div><span>BRANDS</span><h2>اختار شركة اللابتوب</h2><p>اسحب يمين ويسار واختار الشركة، وبعدها منخليك تختار نوع الجهاز.</p></div>{selectedBrand&&<Link href="/laptops" className="brand-clear">كل الشركات</Link>}</div>
  <div className="brand-strip" aria-label="شركات اللابتوبات">{items.map(brand=>{const count=counts[brand]??0;const active=selectedBrand===brand;return <Link key={brand} href={`/laptops?brand=${encodeURIComponent(brand)}`} className={`brand-logo-card ${active?"active":""}`}><span className="brand-logo-circle"><img src={BRAND_LOGOS[brand]} alt={brand}/></span><b>{brand}</b><small>{count?`${count} جهاز`:"متوفر لاحقاً"}</small></Link>})}</div>
 </section>
}
