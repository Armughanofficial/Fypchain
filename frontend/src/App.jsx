import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Registry from './pages/Registry';
import Explore from './pages/Explore';
import Mentorship from './pages/Mentorship';
import Admin from './pages/Admin';

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');
  const mainRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (mainRef.current) {
      gsap.fromTo(
        mainRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      );
    }
  }, [activeTab]);

  return (
    <>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main ref={mainRef}>
        {activeTab === 'landing' && <Landing setActiveTab={setActiveTab} />}
        {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
        {activeTab === 'registry' && <Registry setActiveTab={setActiveTab} />}
        {activeTab === 'explore' && <Explore />}
        {activeTab === 'mentorship' && <Mentorship />}
        {activeTab === 'admin' && <Admin />}
      </main>
    </>
  );
}