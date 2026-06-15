import { hasSupabase } from '@/lib/supabase/server';
import { getAnalytics } from '@/lib/analytics';
import { Icon } from '@/components/primitives';
import { AreaChart, Donut, Bars } from '@/components/admin/charts';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin — Analytics' };

export default function AnalyticsPage() {
  if (!hasSupabase()) return null;
  return <Data />;
}

async function Data() {
  const a = await getAnalytics();
  if (!a) return <div className="adm-empty">Données indisponibles.</div>;
  const labels = a.days30.map((x) => x.slice(5).replace('-', '/'));
  const devices = ['desktop', 'mobile', 'tablet'].map((k) => ({ label: k, value: a.devices[k] || 0 })).filter((x) => x.value);
  return (
    <>
      <div className="adm-head"><div><h1 className="adm-h1">Analytics</h1><p className="adm-sub">Trafic du site — 30 derniers jours. Sans cookies, respectueux de la vie privée.</p></div></div>
      <div className="adm-kpis">
        <div className="kpi" data-c="orange"><div className="kpi-top"><span className="kpi-ic"><Icon name="globe" size={20} /></span></div><div className="kpi-n">{a.totals.visits}</div><div className="kpi-l">Pages vues (30j)</div></div>
        <div className="kpi" data-c="teal"><div className="kpi-top"><span className="kpi-ic"><Icon name="user" size={20} /></span></div><div className="kpi-n">{a.totals.uniques}</div><div className="kpi-l">Visiteurs uniques (30j)</div></div>
        <div className="kpi" data-c="amber"><div className="kpi-top"><span className="kpi-ic"><Icon name="box" size={20} /></span></div><div className="kpi-n">{a.totals.productViews}</div><div className="kpi-l">Vues produits (30j)</div></div>
      </div>
      <div className="adm-panel">
        <div className="adm-panel-hd"><h2>Visites — 30 jours</h2></div>
        <div className="adm-panel-bd"><AreaChart data={a.visitsByDay} labels={labels} color="#FF5A1F" /></div>
      </div>
      <div className="adm-row c2">
        <div className="adm-panel"><div className="adm-panel-hd"><h2>Pages les plus vues</h2></div><div className="adm-panel-bd"><Bars items={a.topPages} /></div></div>
        <div className="adm-panel"><div className="adm-panel-hd"><h2>Produits les plus vus</h2></div><div className="adm-panel-bd"><Bars items={a.topProd} /></div></div>
      </div>
      <div className="adm-row c2">
        <div className="adm-panel"><div className="adm-panel-hd"><h2>Appareils</h2></div><div className="adm-panel-bd">{devices.length ? <Donut items={devices} /> : <div className="adm-empty">Pas de données.</div>}</div></div>
        <div className="adm-panel"><div className="adm-panel-hd"><h2>Sources de trafic</h2></div><div className="adm-panel-bd"><Bars items={a.referrers} /></div></div>
      </div>
    </>
  );
}
