import AppProvider from '@/components/AppProvider';
import Analytics from '@/components/Analytics';
import { getCatalog, getSettings } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function PublicLayout({ children }) {
  const [catalog, settings] = await Promise.all([getCatalog(), getSettings()]);
  return (
    <AppProvider catalog={catalog} settings={settings}>
      <Analytics />
      {children}
    </AppProvider>
  );
}
