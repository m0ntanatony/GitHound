import React, { useState, useEffect } from 'react';
import { GHProvider, useGH } from './context.jsx';
import { ConnectScreen } from './connect.jsx';
import { Shell } from './shell.jsx';

function AppInner() {
  const gh = useGH();
  const [route, setRoute] = useState('overview');
  const [routeArg, setRouteArg] = useState(null);
  const [tweaks, setTweakState] = useState({
    density: 'compact',
    accent: 'signal',
    showRiskLayer: true,
  });

  const setTweak = (key, val) => setTweakState((t) => ({ ...t, [key]: val }));

  // Check if already connected (session exists)
  useEffect(() => {
    fetch('/api/session')
      .then((r) => r.json())
      .then((s) => {
        if (s.connected) {
          // Re-hydrate session — load data
          gh.loadProjects().then((projects) => {
            gh.loadVariables(gh.projects);
          });
          gh.loadGroups();
          gh.loadActivity();
        }
      })
      .catch(() => {});
  }, []);

  // Apply tweaks via CSS data attributes
  useEffect(() => {
    document.body.dataset.density = tweaks.density;
    document.body.dataset.accent = tweaks.accent;
    document.body.dataset.risk = tweaks.showRiskLayer ? 'on' : 'off';

    // Accent color overrides
    const root = document.documentElement;
    if (tweaks.accent === 'blood') {
      root.style.setProperty('--red', '#8B0000');
      root.style.setProperty('--red-hover', '#A52A2A');
      root.style.setProperty('--red-dark', '#500000');
      root.style.setProperty('--red-08', 'rgba(139,0,0,0.08)');
      root.style.setProperty('--red-12', 'rgba(139,0,0,0.12)');
      root.style.setProperty('--red-18', 'rgba(139,0,0,0.18)');
      root.style.setProperty('--grad-brand', 'linear-gradient(135deg, #8B0000 0%, #500000 100%)');
    } else if (tweaks.accent === 'amber') {
      root.style.setProperty('--red', '#F59E0B');
      root.style.setProperty('--red-hover', '#FBBF24');
      root.style.setProperty('--red-dark', '#B45309');
      root.style.setProperty('--red-08', 'rgba(245,158,11,0.08)');
      root.style.setProperty('--red-12', 'rgba(245,158,11,0.12)');
      root.style.setProperty('--red-18', 'rgba(245,158,11,0.18)');
      root.style.setProperty('--grad-brand', 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)');
    } else {
      root.style.setProperty('--red', '#FF2D2D');
      root.style.setProperty('--red-hover', '#FF4D4D');
      root.style.setProperty('--red-dark', '#8B0000');
      root.style.setProperty('--red-08', 'rgba(255,45,45,0.08)');
      root.style.setProperty('--red-12', 'rgba(255,45,45,0.12)');
      root.style.setProperty('--red-18', 'rgba(255,45,45,0.18)');
      root.style.setProperty('--grad-brand', 'linear-gradient(135deg, #FF2D2D 0%, #8B0000 100%)');
    }
  }, [tweaks]);

  const onNav = (r, arg = null) => {
    setRoute(r);
    setRouteArg(arg);
    window.scrollTo(0, 0);
  };

  const handleConnected = () => {
    gh.loadProjects().then(() => {
      gh.loadVariables(gh.projects);
    });
    gh.loadGroups();
    gh.loadActivity();
  };

  if (!gh.connected) {
    return <ConnectScreen onConnect={handleConnected} />;
  }

  return (
    <Shell
      route={route}
      routeArg={routeArg}
      onNav={onNav}
      tweaks={tweaks}
      setTweak={setTweak}
    />
  );
}

export default function App() {
  return (
    <GHProvider>
      <AppInner />
    </GHProvider>
  );
}
