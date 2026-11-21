import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ProjectCover,
  ProjectBanner,
  CertificateCard,
  MentorAvatar,
  TcrCoinSvg,
} from '../components/Artwork';
import { supabase } from '../lib/supabase';

gsap.registerPlugin(ScrollTrigger);

const SHOWCASE_PROJECTS = [
  {
    id: 'demo-1',
    title: 'Neural Interface Research',
    category: 'Neuroscience',
    tech_stack: ['Python', 'PyTorch', 'EEG'],
    creator_name: 'Amina Rahman',
    price_tcr: 120,
    status: 'approved',
    abstract: 'A low-cost EEG pipeline that decodes motor intent for assistive devices.',
  },
  {
    id: 'demo-2',
    title: 'Climate Intelligence',
    category: 'Climate',
    tech_stack: ['Python', 'TensorFlow', 'Satellite'],
    creator_name: 'Usman Tariq',
    price_tcr: 90,
    status: 'approved',
    abstract: 'District-level heatwave forecasts trained on open satellite imagery.',
  },
  {
    id: 'demo-3',
    title: 'Decentralized Identity',
    category: 'Identity',
    tech_stack: ['Solidity', 'React', 'ethers.js'],
    creator_name: 'Sara Qureshi',
    price_tcr: 150,
    status: 'approved',
    abstract: 'Student credentials that travel between universities without a central registry.',
  },
];

export default function Landing({ setActiveTab }) {
  const [liveProjects, setLiveProjects] = useState([]);
  const [liveMentors, setLiveMentors] = useState([]);
  const containerRef = useRef(null);
  const coinWrapRef = useRef(null);

  useEffect(() => {
    async function loadFeatured() {
      const [{ data: projs }, { data: ments }] = await Promise.all([
        supabase.from('projects').select('*').eq('status', 'approved').limit(3),
        supabase.from('mentors').select('*').eq('is_verified', true).limit(4),
      ]);
      setLiveProjects(projs || []);
      setLiveMentors(ments || []);
    }
    loadFeatured();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.hero-anim',
        { y: 28, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.hero',
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play reverse play reverse',
          },
        }
      );

      gsap.fromTo(
        '.hero-card',
        {
          x: 50,
          y: 30,
          rotation: (i) => (i % 2 === 0 ? -5 : 5),
          opacity: 0,
          scale: 0.92,
        },
        {
          x: 0,
          y: 0,
          rotation: 0,
          opacity: 1,
          scale: 1,
          duration: 0.75,
          stagger: 0.12,
          ease: 'back.out(1.4)',
          scrollTrigger: {
            trigger: '.hero',
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play reverse play reverse',
          },
        }
      );

      gsap.fromTo(
        '.cert-reveal',
        { x: 60, rotation: 3, opacity: 0 },
        {
          x: 0,
          rotation: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.ink-band',
            start: 'top 80%',
            end: 'bottom 15%',
            toggleActions: 'play reverse play reverse',
          },
        }
      );

      gsap.fromTo(
        '.feat-card',
        {
          y: 55,
          x: (i) => (i - 1) * -35,
          rotation: (i) => (i - 1) * -4,
          opacity: 0,
          scale: 0.94,
        },
        {
          y: 0,
          x: 0,
          rotation: 0,
          opacity: 1,
          scale: 1,
          duration: 0.75,
          stagger: 0.12,
          ease: 'back.out(1.35)',
          scrollTrigger: {
            trigger: '.feat-section',
            start: 'top 82%',
            end: 'bottom 15%',
            toggleActions: 'play reverse play reverse',
          },
        }
      );

      const stepsTl = gsap.timeline({
        scrollTrigger: {
          trigger: '.steps-section',
          start: 'top 80%',
          end: 'center 35%',
          scrub: 0.6,
        },
      });

      stepsTl
        .fromTo('.steps-rail-fill', { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: 1 })
        .fromTo(
          '.step-item',
          { x: -60, opacity: 0 },
          { x: 0, opacity: 1, stagger: 0.16, ease: 'power2.out', duration: 0.6 },
          0
        );

      gsap.to('.tcr-dotted-ring', {
        rotation: 360,
        svgOrigin: '160 160',
        duration: 24,
        repeat: -1,
        ease: 'none',
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleCoinClick = () => {
    if (!coinWrapRef.current) return;
    gsap.to(coinWrapRef.current, {
      rotationY: '+=180',
      duration: 0.75,
      ease: 'back.out(1.6)',
    });
  };

  const featuredList = liveProjects.length > 0 ? liveProjects : SHOWCASE_PROJECTS;

  return (
    <div ref={containerRef}>
      <section className="hero">
        <div className="w hg">
          <div>
            <h1 className="hero-anim">
              Research isn’t meant to <span className="sr">stay on paper.</span>
            </h1>
            <p className="lead hero-anim">
              Discover student innovation, establish verifiable ownership of academic projects, and
              connect with the researchers building tomorrow.
            </p>
            <div className="row hero-anim">
              <button className="btn b1" onClick={() => setActiveTab('explore')}>
                Explore Projects
              </button>
              <button className="btn" onClick={() => setActiveTab('registry')}>
                Register Your Research
              </button>
            </div>
          </div>

          <div className="hc">
            <div
              className="big hero-card"
              onClick={() => setActiveTab('explore')}
              style={{ cursor: 'pointer' }}
            >
              <ProjectCover title={SHOWCASE_PROJECTS[0].title} category="Neuroscience" verified />
              <div className="cap">
                <b>{SHOWCASE_PROJECTS[0].title}</b>
                <br />
                by {SHOWCASE_PROJECTS[0].creator_name}
              </div>
            </div>

            <div
              className="s2 hero-card"
              onClick={() => setActiveTab('explore')}
              style={{ cursor: 'pointer' }}
            >
              <ProjectCover title={SHOWCASE_PROJECTS[1].title} category="Climate" verified />
              <div className="cap">
                <b>{SHOWCASE_PROJECTS[1].title}</b>
              </div>
            </div>

            <div
              className="hero-card"
              onClick={() => setActiveTab('explore')}
              style={{ cursor: 'pointer' }}
            >
              <ProjectCover title={SHOWCASE_PROJECTS[2].title} category="Identity" verified />
              <div className="cap">
                <b>{SHOWCASE_PROJECTS[2].title}</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ink ink-band">
        <div className="w two">
          <div>
            <h2>
              A research ecosystem where the record can’t be{' '}
              <span className="sr">quietly rewritten.</span>
            </h2>
            <p style={{ maxWidth: '52ch', margin: '22px 0 14px', opacity: 0.85, fontSize: '17px' }}>
              Register your final year project and receive a Soulbound ERC-721 certificate that
              stays tied to your wallet. Others can license your work with Thesis Credits, and
              juniors can book time with seniors who have built something similar.
            </p>
            <p style={{ maxWidth: '52ch', opacity: 0.65, fontSize: '15px' }}>
              Project details live in Supabase PostgreSQL for fast search. Ownership, payments, and
              certificates are verified directly on Ethereum.
            </p>
          </div>
          <div className="cert-reveal">
            <CertificateCard
              title="Decentralized Identity"
              category="Identity"
              tokenId={4}
              holder="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
              networkLabel="Ethereum Sepolia"
            />
          </div>
        </div>
      </section>

      <section className="feat-section">
        <div className="w">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'end' }}>
            <div>
              <h2>Featured research</h2>
              <p className="mut">
                Verified projects from this term, ready to inspect and license with TCR.
              </p>
            </div>
            <button className="btn sm" onClick={() => setActiveTab('explore')}>
              Browse all projects →
            </button>
          </div>

          <div className="cards-grid">
            {featuredList.map((p) => (
              <article key={p.id} className="market-card feat-card">
                <div
                  className="card-banner"
                  onClick={() => setActiveTab('explore')}
                  style={{ cursor: 'pointer' }}
                >
                  <ProjectBanner category={p.category} verified={p.status === 'approved'} />
                </div>

                <div className="card-body">
                  <div>
                    <h3>{p.title}</h3>
                    <p>{p.abstract}</p>
                    <div className="chips">
                      {(p.tech_stack || []).map((t, i) => (
                        <span key={i} className="chip">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="pm">
                      <span className="mut">
                        by{' '}
                        {p.creator_name ||
                          (p.creator_wallet
                            ? `${p.creator_wallet.slice(0, 6)}…${p.creator_wallet.slice(-4)}`
                            : 'Student Researcher')}
                      </span>
                      <span className="pr">{p.price_tcr} TCR</span>
                    </div>
                    <div
                      className="pm"
                      style={{ borderTop: '1px solid var(--ln)', paddingTop: '10px' }}
                    >
                      <span className="ver">
                        <i>✓</i>Verified
                      </span>
                      <button className="lk" onClick={() => setActiveTab('explore')}>
                        Open in Marketplace
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="steps-section" style={{ background: 'var(--sf)' }}>
        <div className="w">
          <h2>From thesis folder to verified record</h2>
          <p className="mut">Scroll down to trace the on-chain registration pipeline left to right.</p>

          <div className="steps-track-wrap">
            <div className="steps-rail">
              <div className="steps-rail-fill" />
            </div>

            <div className="steps">
              {[
                ['Submit your academic project', 'Add the title, abstract, stack, links and a licensing price.'],
                ['Register it on Ethereum', 'Your wallet signs one transaction that timestamps the registration.'],
                ['Receive an NFT certificate', 'A non-transferable Soulbound certificate is issued upon Admin verification.'],
                ['Get verified', 'An administrator reviews the submission and mints your on-chain credential.'],
                ['Discover and license projects', 'Pay in TCR. The creator receives tokens directly on-chain.'],
              ].map(([title, desc], i) => (
                <div key={i} className="st step-item">
                  <b>{i + 1}</b>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {liveMentors.length > 0 && (
        <section>
          <div className="w">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'end' }}>
              <div>
                <h2>Learn from people who just did it</h2>
                <p className="mut">Student mentors with real final year projects behind them.</p>
              </div>
              <button className="btn sm" onClick={() => setActiveTab('mentorship')}>
                Meet all mentors →
              </button>
            </div>
            <div className="mg">
              {liveMentors.map((m, idx) => (
                <div
                  key={m.id}
                  onClick={() => setActiveTab('mentorship')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="pc">
                    <MentorAvatar name={m.full_name} index={idx} />
                  </div>
                  <div className="mn">{m.full_name}</div>
                  <div className="mx">{m.expertise}</div>
                  <div className="pm">
                    <span className="ver">
                      <i>✓</i>Verified
                    </span>
                    <span className="pr">{m.session_price_tcr} TCR</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="lms">
        <div className="w two">
          <div>
            <h2>Thesis Credits keep the platform moving</h2>
            <p style={{ fontSize: '17px', maxWidth: '50ch' }}>
              TCR is an ERC-20 utility token with a fixed 1,000,000 supply inside FypChain.
            </p>
            <div style={{ marginTop: '24px' }}>
              <div className="use">
                <b>Faucet</b>
                <span>Every new wallet claims a starting 500 TCR balance once.</span>
              </div>
              <div className="use">
                <b>Licensing</b>
                <span>Pay creators directly to license their academic repositories.</span>
              </div>
              <div className="use" style={{ borderBottom: '2px solid #171717' }}>
                <b>Mentorship</b>
                <span>Pay a senior mentor for a 1-on-1 session on-chain.</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div ref={coinWrapRef} style={{ perspective: '1000px' }}>
              <TcrCoinSvg onClick={handleCoinClick} />
            </div>
            <small style={{ marginTop: '14px', fontWeight: 700, opacity: 0.75 }}>
              Click token to revolve 180°
            </small>
          </div>
        </div>
      </section>

      <section className="cbs">
        <div className="w">
          <h2 style={{ maxWidth: '18ch' }}>Bring your research onto FypChain.</h2>
          <p style={{ fontSize: '17px', maxWidth: '46ch', margin: '18px 0 26px' }}>
            Your project took months. Give it a verifiable record and an audience.
          </p>
          <button className="btn b2" onClick={() => setActiveTab('registry')}>
            Register Your Research
          </button>
        </div>
      </section>

      <footer className="ink">
        <div className="w">
          <div className="fg">
            <div>
              <div className="logo">FypChain</div>
              <p style={{ opacity: 0.7, maxWidth: '34ch', marginTop: '8px' }}>
                Decentralized Academic IP Registry & Peer-to-Peer Mentorship Platform.
              </p>
            </div>
            <div>
              <b>Platform</b>
              <button onClick={() => setActiveTab('explore')}>Explore</button>
              <button onClick={() => setActiveTab('mentorship')}>Mentorship</button>
              <button onClick={() => setActiveTab('registry')}>Register</button>
            </div>
            <div>
              <b>Account</b>
              <button onClick={() => setActiveTab('dashboard')}>Dashboard</button>
              <button onClick={() => setActiveTab('admin')}>Admin Panel</button>
            </div>
            <div>
              <b>Stack</b>
              <p style={{ opacity: 0.7, margin: '4px 0 0' }}>
                Ethereum, Solidity, ERC-20, Soulbound ERC-721, Supabase, React
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}