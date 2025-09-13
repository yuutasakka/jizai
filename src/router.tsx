import React from 'react';
import App from './App';
import { MemorialHumanPage, MemorialPetPage, MemorialSeizenPage, MemorialPhotoPage } from './routes/memorial-pages';
import AuthCallback from './routes/auth-callback';

function usePathname() {
  const [path, setPath] = React.useState<string>(window.location.pathname);
  React.useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return path;
}

export function navigate(to: string) {
  if (window.location.pathname !== to) {
    window.history.pushState({}, '', to);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}

export default function RootRouter() {
  const path = usePathname();
  if (path.startsWith('/auth/callback')) return <AuthCallback />;
  if (path.startsWith('/memorial/human')) return <MemorialHumanPage />;
  if (path.startsWith('/memorial/pet')) return <MemorialPetPage />;
  if (path.startsWith('/memorial/seizen')) return <MemorialSeizenPage />;
  if (path.startsWith('/memorial/photo')) return <MemorialPhotoPage />;
  return <App />;
}
