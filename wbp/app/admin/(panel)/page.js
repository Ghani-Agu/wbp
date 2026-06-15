import Link from 'next/link';
import { hasSupabase } from '@/lib/supabase/server';
import { getDashboard } from '@/lib/analytics';
import { Icon } from '@/components/primitives';
import { AreaChart, Donut, Bars, Sparkline } from '@/components/admin/charts';

export const dynamic = 'force-dynamic';

function ago(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return `il y a ${Math.floor(s / 86400)} j`;
}
const HEX = { orange:'#FF5A1F', amber:'#F59E0B', gold:'#C98A14', teal:'#0E9488', green:'#1F9D55', rose:'#E0533D', blue:'#3B82F6', slate:'#7C7167' };
function Kpi({ c, icon, n, label, trend, spark }) {
  return (
    <div className="kpi" data-c={c}>
      <div className="kpi-top">
        <span className="kpi-ic"><Icon name={icon} size={20} /></span>
        {trend && <span className={`kpi-trend ${trend.dir}`}>{trend.dir === 'up' ? '↑' : trend.dir === 'down' ? '↓' : '·'} {trend.pct}%</span>}
      </div>
      <div className="kpi-n">{n}</div>
      <div className="kpi-l">{label}</div>
      {spark && <Sparkline data={spark} color={HEX[c] || '#6d28d9'} />}
    </div>
  );
}

export default function Dashboard() {
  if (!hasSupabase()) return null;
  return <DashboardData />;
}

async function DashboardData() {
  const d = await getDashboard();
  if (!d) return <div className="adm-empty">Impossible de charger les données. Vérifiez la configuration Supabase.</div>;
  const k = d.kpis;
  const dayLabels = d.days14.map((x) => x.slice(5).replace('-', '/'));
  const devices = ['desktop', 'mobile', 'tablet'].map((kk) => ({ label: kk, value: d.devices[kk] || 0 })).filter((x) => x.value);
  const statusColors = { new: '#FF5A1F', contacted: '#0E9488', quoted: '#1F9D55', closed: '#7C7167' };
  const qStatus = Object.entries(d.qStatus).map(([label, value]) => ({ label, value, color: statusColors[label] || '#F59E0B' }));

  return (
    <>
      <div className="adm-head">
        <div><h1 className="adm-h1">Tableau de bord</h1><p className="adm-sub">Vue d’ensemble du trafic et de l’activité — 14 derniers jours.</p></div>
        <div className="quick">
          <Link className="adm-btn" href="/admin/analytics"><Icon name="chart" size={16} /> Analytics</Link>
          <Link className="adm-btn primary" href="/admin/products/new"><Icon name="plus" size={16} /> Nouveau produit</Link>
        </div>
      </div>

      <div className="adm-kpis">
        <Kpi c="orange" icon="globe" n={k.visits.n} label="Visites (14j)" trend={k.visits.trend} spark={k.visits.spark} />
        <Kpi c="teal" icon="user" n={k.uniques.n} label="Visiteurs uniques (14j)" trend={k.uniques.trend} />
        <Kpi c="amber" icon="box" n={k.productViews.n} label="Vues produits (14j)" trend={k.productViews.trend} />
        <Kpi c="rose" icon="cart" n={k.quotesNew.n} label="Devis à traiter" />
      </div>

      <div className="adm-row c2">
        <div className="adm-panel">
          <div className="adm-panel-hd"><h2>Trafic — 14 jours</h2><span className="muted">visites par jour</span></div>
          <div className="adm-panel-bd"><AreaChart data={d.visitsByDay} labels={dayLabels} color="#FF5A1F" /></div>
        </div>
        <div className="adm-panel">
          <div className="adm-panel-hd"><h2>Appareils</h2></div>
          <div className="adm-panel-bd">{devices.length ? <Donut items={devices} /> : <div className="adm-empty">Pas encore de visites.</div>}</div>
        </div>
      </div>

      <div className="adm-row c2">
        <div className="adm-panel">
          <div className="adm-panel-hd"><h2>Produits les plus vus</h2><span className="muted">30 j</span></div>
          <div className="adm-panel-bd"><Bars items={d.topProd} /></div>
        </div>
        <div className="adm-panel">
          <div className="adm-panel-hd"><h2>Catalogue par catégorie</h2></div>
          <div className="adm-panel-bd"><Bars items={d.byCat} /></div>
        </div>
      </div>

      <div className="adm-row c2">
        <div className="adm-panel">
          <div className="adm-panel-hd"><h2>Activité récente</h2></div>
          {d.activity.length === 0 ? <div className="adm-empty">Aucune activité pour l’instant.</div> : (
            <div className="feed">
              {d.activity.map((a, i) => (
                <div className="feed-item" key={i}>
                  <span className="feed-ic" style={{ background: a.color }}><Icon name={a.icon} size={17} /></span>
                  <div className="feed-tx">{a.text}<div className="feed-time">{ago(a.time)}</div></div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="adm-kpis" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 16 }}>
            <Kpi c="green" icon="box" n={k.products.n} label="Produits" />
            <Kpi c="gold" icon="star" n={k.reviewsPending.n} label="Avis à modérer" />
            <Kpi c="blue" icon="mail" n={k.messagesNew.n} label="Messages non lus" />
            <Kpi c="slate" icon="user" n={k.subscribers.n} label="Abonnés" />
          </div>
          <div className="adm-panel">
            <div className="adm-panel-hd"><h2>Devis par statut</h2></div>
            <div className="adm-panel-bd">{qStatus.length ? <Donut items={qStatus} size={150} /> : <div className="adm-empty">Aucun devis.</div>}</div>
          </div>
        </div>
      </div>
    </>
  );
}
