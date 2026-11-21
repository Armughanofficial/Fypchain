import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import gsap from 'gsap';
import { useWeb3 } from '../context/Web3Context';
import { supabase } from '../lib/supabase';
import { CATEGORIES, ProjectBanner } from '../components/Artwork';
import deployedContracts from '../deployedContracts.json';

export default function Explore() {
  const { account, tcrBalance, tcrContract, platformContract, refreshBalance, connectWallet } =
    useWeb3();

  const [projects, setProjects] = useState([]);
  const [licensedIds, setLicensedIds] = useState(new Set());
  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [inspectProject, setInspectProject] = useState(null);
  const [modalProject, setModalProject] = useState(null);
  const [buying, setBuying] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const gridRef = useRef(null);

  const loadMarketplace = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) console.error('Explore fetch error:', error);
    setProjects(data || []);

    if (account) {
      const { data: myLics } = await supabase
        .from('project_licenses')
        .select('project_id')
        .eq('buyer_wallet', account.toLowerCase());
      setLicensedIds(new Set((myLics || []).map((l) => l.project_id)));
    }
  };

  useEffect(() => {
    loadMarketplace();
  }, [account]);

  const filtered = projects.filter((p) => {
    const matchesCat = selectedCat === 'All' || p.category === selectedCat;
    const q = query.toLowerCase();
    const matchesQ =
      !q ||
      (p.title + ' ' + p.abstract + ' ' + (p.tech_stack || []).join(' '))
        .toLowerCase()
        .includes(q);
    return matchesCat && matchesQ;
  });

  useEffect(() => {
    if (!gridRef.current || filtered.length === 0) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.explore-card',
        {
          y: 45,
          x: (i) => ((i % 3) - 1) * -30,
          rotation: (i) => ((i % 3) - 1) * -3,
          opacity: 0,
          scale: 0.94,
        },
        {
          y: 0,
          x: 0,
          rotation: 0,
          opacity: 1,
          scale: 1,
          duration: 0.65,
          stagger: 0.1,
          ease: 'back.out(1.35)',
        }
      );
    }, gridRef);
    return () => ctx.revert();
  }, [selectedCat, query, projects.length]);

  const confirmLicense = async () => {
    if (!modalProject || !account) return;
    try {
      setBuying(true);
      const priceWei = ethers.parseEther(modalProject.price_tcr.toString());
      const platformAddress = await platformContract.getAddress();

      setStatusMsg(`1/3 Approving ${modalProject.price_tcr} TCR allowance...`);
      const approveTx = await tcrContract.approve(platformAddress, priceWei);
      await approveTx.wait();

      setStatusMsg('2/3 Executing on-chain license transfer...');
      const licTx = await platformContract.licenseProject(modalProject.id);
      const receipt = await licTx.wait();

      setStatusMsg('3/3 Saving license receipt...');
      await supabase.from('project_licenses').insert({
        project_id: modalProject.id,
        buyer_wallet: account.toLowerCase(),
        tx_hash: receipt.hash,
      });

      await refreshBalance();
      await loadMarketplace();
      setStatusMsg('');
      setModalProject(null);
      setInspectProject(null);
    } catch (err) {
      console.error(err);
      setStatusMsg(err.reason || err.message || 'Licensing failed.');
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="pg">
      <div className="w">
        <h1>Explore research</h1>
        <p className="mut">
          Click any project to inspect full details, or license repositories directly with TCR.
        </p>

        <div className="bar">
          <input
            className="in"
            style={{ maxWidth: '380px' }}
            placeholder="Search by title or technology"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="fl">
          {['All', ...CATEGORIES].map((c) => (
            <button
              key={c}
              className={`fb ${selectedCat === c ? 'on' : ''}`}
              onClick={() => setSelectedCat(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="mut" style={{ marginTop: '40px' }}>
            No approved projects found. Register an FYP and approve it in Admin to see it listed
            here.
          </p>
        ) : (
          <div ref={gridRef} className="cards-grid">
            {filtered.map((p) => {
              const isOwner = account && p.creator_wallet === account.toLowerCase();
              const isLicensed = licensedIds.has(p.id);

              return (
                <article key={p.id} className="market-card explore-card">
                  <div
                    className="card-banner"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setInspectProject(p)}
                  >
                    <ProjectBanner category={p.category} verified />
                  </div>

                  <div className="card-body">
                    <div>
                      <h3
                        style={{ cursor: 'pointer' }}
                        onClick={() => setInspectProject(p)}
                      >
                        {p.title}
                      </h3>
                      <p
                        style={{ cursor: 'pointer' }}
                        onClick={() => setInspectProject(p)}
                      >
                        {p.abstract}
                      </p>
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
                          by {p.creator_wallet.slice(0, 6)}…{p.creator_wallet.slice(-4)}
                        </span>
                        <span className="pr">{p.price_tcr} TCR</span>
                      </div>
                      <div
                        className="pm"
                        style={{ borderTop: '1px solid var(--ln)', paddingTop: '10px' }}
                      >
                        <button
                          className="lk"
                          style={{ fontSize: '13px' }}
                          onClick={() => setInspectProject(p)}
                        >
                          View Details
                        </button>
                        {isOwner ? (
                          <span className="tag">Your project</span>
                        ) : isLicensed ? (
                          <a
                            href={p.github_url}
                            target="_blank"
                            rel="noreferrer"
                            className="lk"
                          >
                            Open Repo →
                          </a>
                        ) : (
                          <button
                            className="btn b1 sm"
                            onClick={() => {
                              if (!account) return connectWallet();
                              setStatusMsg('');
                              setModalProject(p);
                            }}
                          >
                            Purchase License
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Full Project Details Modal (Before Buying) */}
      {inspectProject && (
        <div className="ov" onClick={() => setInspectProject(null)}>
          <div className="md" onClick={(e) => e.stopPropagation()}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="tag ok">{inspectProject.category}</span>
              <span className="pr">{inspectProject.price_tcr} TCR</span>
            </div>

            <h3 style={{ fontSize: '26px', margin: '12px 0 8px' }}>{inspectProject.title}</h3>
            <p className="mut" style={{ fontSize: '13px', marginBottom: '14px' }}>
              Creator: <code>{inspectProject.creator_wallet}</code> • Soulbound NFT #
              {inspectProject.token_id || inspectProject.id} • CA:{' '}
              <code>{deployedContracts.contracts.ThesisPlatform.address.slice(0, 10)}…</code>
            </p>

            <div style={{ margin: '14px 0' }}>
              <b style={{ fontSize: '13.5px' }}>Abstract & Scope</b>
              <p style={{ margin: '6px 0 0', fontSize: '14.5px', lineHeight: 1.6 }}>
                {inspectProject.abstract}
              </p>
            </div>

            <div style={{ margin: '14px 0' }}>
              <b style={{ fontSize: '13.5px' }}>Technology Stack</b>
              <div className="chips" style={{ marginTop: '6px' }}>
                {(inspectProject.tech_stack || []).map((t, i) => (
                  <span key={i} className="chip">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {inspectProject.docs_url && (
              <div style={{ margin: '14px 0' }}>
                <a
                  href={inspectProject.docs_url}
                  target="_blank"
                  rel="noreferrer"
                  className="lk"
                  style={{ fontSize: '14px' }}
                >
                  Inspect Public Documentation / Demo →
                </a>
              </div>
            )}

            <div
              className="row"
              style={{
                marginTop: '22px',
                paddingTop: '14px',
                borderTop: '1px solid var(--ln)',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              {account && inspectProject.creator_wallet === account.toLowerCase() ? (
                <span className="tag">You own this project</span>
              ) : licensedIds.has(inspectProject.id) ? (
                <a
                  href={inspectProject.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn b1 sm"
                >
                  Open Unlocked GitHub Repo →
                </a>
              ) : (
                <button
                  className="btn b1"
                  onClick={() => {
                    if (!account) return connectWallet();
                    setStatusMsg('');
                    setModalProject(inspectProject);
                  }}
                >
                  Purchase License ({inspectProject.price_tcr} TCR)
                </button>
              )}

              <button className="btn sm" onClick={() => setInspectProject(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Licensing Payment Confirmation Modal */}
      {modalProject && (
        <div className="ov" onClick={() => !buying && setModalProject(null)}>
          <div className="md" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>
              License “{modalProject.title}”
            </h3>
            <p>
              Price: <b>{modalProject.price_tcr} TCR</b>, paid directly to creator. Your balance:{' '}
              <b>{Number(tcrBalance).toLocaleString()} TCR</b>.
            </p>
            <div className="nt">
              {statusMsg ||
                'MetaMask will ask you to approve the TCR allowance first, then execute the on-chain licensing transaction.'}
            </div>
            <div className="row">
              <button className="btn b1" onClick={confirmLicense} disabled={buying}>
                {buying ? 'Processing...' : 'Confirm & Pay TCR'}
              </button>
              <button
                className="btn"
                onClick={() => setModalProject(null)}
                disabled={buying}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}