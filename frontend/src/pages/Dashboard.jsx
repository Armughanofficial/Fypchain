import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { supabase } from '../lib/supabase';
import { CertificateCard } from '../components/Artwork';
import deployedContracts from '../deployedContracts.json';

export default function Dashboard({ setActiveTab }) {
  const {
    account,
    profile,
    tcrBalance,
    hasClaimedFaucet,
    tcrContract,
    refreshBalance,
    connectWallet,
  } = useWeb3();

  const [claiming, setClaiming] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [myProjects, setMyProjects] = useState([]);
  const [myLicenses, setMyLicenses] = useState([]);
  const [myBookings, setMyBookings] = useState([]);

  // Project / Certificate Inspector & Off-Chain Editor Modal
  const [selectedProj, setSelectedProj] = useState(null);
  const [editForm, setEditForm] = useState({ abstract: '', techStack: '', docsUrl: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  const loadUserData = async () => {
    if (!account) return;
    const wallet = account.toLowerCase();

    const [projRes, licRes, bookRes] = await Promise.all([
      supabase
        .from('projects')
        .select('*')
        .eq('creator_wallet', wallet)
        .order('created_at', { ascending: false }),
      supabase.from('project_licenses').select('*, projects(*)').eq('buyer_wallet', wallet),
      supabase
        .from('bookings')
        .select('*, mentors(full_name, expertise)')
        .eq('student_wallet', wallet),
    ]);

    setMyProjects(projRes.data || []);
    setMyLicenses(licRes.data || []);
    setMyBookings(bookRes.data || []);
  };

  useEffect(() => {
    loadUserData();
  }, [account]);

  const openProjectEditor = (proj) => {
    setSelectedProj(proj);
    setEditForm({
      abstract: proj.abstract || '',
      techStack: (proj.tech_stack || []).join(', '),
      docsUrl: proj.docs_url || '',
    });
  };

  const handleSaveProjectEdit = async (e) => {
    e.preventDefault();
    if (!selectedProj) return;
    try {
      setSavingEdit(true);
      const updatedStack = editForm.techStack
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const { error } = await supabase
        .from('projects')
        .update({
          abstract: editForm.abstract,
          tech_stack: updatedStack,
          docs_url: editForm.docsUrl,
        })
        .eq('id', selectedProj.id);

      if (error) throw error;
      await loadUserData();
      setSelectedProj(null);
    } catch (err) {
      console.error('Failed to update project details:', err);
      alert(err.message || 'Could not save changes.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleFaucet = async () => {
    if (!tcrContract) return;
    try {
      setClaiming(true);
      setStatusMsg('Confirm faucet claim in MetaMask...');
      const tx = await tcrContract.claimFaucet();
      setStatusMsg('Waiting for block confirmation...');
      await tx.wait();
      await refreshBalance();
      setStatusMsg('500 TCR credited to your wallet!');
    } catch (err) {
      console.error(err);
      setStatusMsg(err.reason || 'Faucet claim failed.');
    } finally {
      setClaiming(false);
    }
  };

  const handleWatchToken = async () => {
    if (!window.ethereum) return;
    try {
      const tokenAddress = deployedContracts.contracts.ThesisCredits.address;
      const imageUrl = `${window.location.origin}/tcr-token.png`;
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: 'TCR',
            decimals: 18,
            image: imageUrl,
          },
        },
      });
    } catch (err) {
      console.error('Failed to add TCR to MetaMask:', err);
    }
  };

  if (!account) {
    return (
      <div className="pg">
        <div className="w">
          <h1>Dashboard</h1>
          <p style={{ maxWidth: '48ch', margin: '16px 0 24px' }} className="mut">
            Connect your MetaMask wallet to view your TCR balance, Soulbound NFT certificates, and
            licensing activity.
          </p>
          <button className="btn b1" onClick={connectWallet}>
            Connect wallet
          </button>
        </div>
      </div>
    );
  }

  const approvedCerts = myProjects.filter((p) => p.status === 'approved' && p.token_id);

  return (
    <>
      <div className="ink band">
        <div className="w row" style={{ justifyContent: 'space-between', alignItems: 'end' }}>
          <div>
            <div style={{ opacity: 0.7, fontSize: '14px' }}>
              {profile?.full_name} ({profile?.university}) • {account}
            </div>
            <div className="bal" style={{ marginTop: '8px' }}>
              {Number(tcrBalance).toLocaleString()} TCR
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div className="row" style={{ justifyContent: 'flex-end', alignItems: 'center' }}>
              <button
                className="btn sm"
                onClick={handleWatchToken}
                style={{ borderColor: '#F5F3EC', color: '#F5F3EC' }}
              >
                + Add TCR to MetaMask
              </button>
              <button
                className="btn b2"
                onClick={handleFaucet}
                disabled={hasClaimedFaucet || claiming}
              >
                {hasClaimedFaucet
                  ? 'Faucet claimed'
                  : claiming
                  ? 'Claiming...'
                  : 'Claim 500 TCR from faucet'}
              </button>
            </div>
            {statusMsg && (
              <div style={{ fontSize: '13px', color: 'var(--lm)', marginTop: '8px' }}>
                {statusMsg}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pg">
        <div className="w">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Your Academic Workspace</h2>
            <button className="btn b1 sm" onClick={() => setActiveTab('registry')}>
              + Register New FYP
            </button>
          </div>

          <div className="dg">
            <div>
              <h3>Registered projects ({myProjects.length})</h3>
              <p className="mut" style={{ fontSize: '13px', margin: '4px 0 0' }}>
                Click any project or certificate below to view full details or edit description.
              </p>
              <div className="ls">
                {myProjects.length === 0 ? (
                  <div className="li mut">No projects registered yet.</div>
                ) : (
                  myProjects.map((p) => (
                    <div
                      key={p.id}
                      className="li li-clickable"
                      onClick={() => openProjectEditor(p)}
                    >
                      <div>
                        <b>{p.title}</b>
                        <br />
                        <small className="mut">
                          {p.category} • {p.price_tcr} TCR{' '}
                          {p.token_id ? `• NFT #${p.token_id}` : '• Awaiting Admin Mint'}
                        </small>
                      </div>
                      <span
                        className={`tag ${
                          p.status === 'approved' ? 'ok' : p.status === 'rejected' ? 'no' : ''
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <h3 style={{ marginTop: '40px' }}>
                Soulbound NFT certificates ({approvedCerts.length})
              </h3>
              <div style={{ marginTop: '16px', display: 'grid', gap: '22px' }}>
                {approvedCerts.length === 0 ? (
                  <p className="mut" style={{ fontSize: '14px' }}>
                    {myProjects.length > 0
                      ? 'Your certificate will appear here once an Admin approves and mints your submission.'
                      : 'Register an FYP to earn your non-transferable certificate.'}
                  </p>
                ) : (
                  approvedCerts.map((p) => (
                    <div
                      key={p.id}
                      className="cert-clickable"
                      onClick={() => openProjectEditor(p)}
                      title="Click to inspect & edit project details"
                    >
                      <CertificateCard
                        title={p.title}
                        category={p.category}
                        tokenId={p.token_id}
                        txHash={p.tx_hash}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h3>Licensed projects ({myLicenses.length})</h3>
              <div className="ls">
                {myLicenses.length === 0 ? (
                  <div className="li mut">
                    No licences yet.{' '}
                    <button className="lk" onClick={() => setActiveTab('explore')}>
                      Explore projects
                    </button>
                  </div>
                ) : (
                  myLicenses.map((lic) => (
                    <div key={lic.id} className="li">
                      <div>
                        <b>{lic.projects?.title}</b>
                        <br />
                        <a
                          href={lic.projects?.github_url}
                          target="_blank"
                          rel="noreferrer"
                          className="lk"
                          style={{ fontSize: '13px' }}
                        >
                          Open GitHub Repository →
                        </a>
                      </div>
                      <span className="tag ok">Licensed</span>
                    </div>
                  ))
                )}
              </div>

              <h3 style={{ marginTop: '40px' }}>Mentorship bookings ({myBookings.length})</h3>
              <div className="ls">
                {myBookings.length === 0 ? (
                  <div className="li mut">
                    No bookings yet.{' '}
                    <button className="lk" onClick={() => setActiveTab('mentorship')}>
                      Find a mentor
                    </button>
                  </div>
                ) : (
                  myBookings.map((b) => (
                    <div key={b.id} className="li">
                      <div>
                        <b>{b.mentors?.full_name}</b> — {b.topic}
                        <br />
                        <small className="mut">
                          Date: {b.scheduled_date} • Paid {b.amount_tcr} TCR
                        </small>
                      </div>
                      <span className="tag ok">Confirmed</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seller Project & Certificate Inspector + Off-Chain Editor Modal */}
      {selectedProj && (
        <div className="ov" onClick={() => !savingEdit && setSelectedProj(null)}>
          <form
            className="md"
            onSubmit={handleSaveProjectEdit}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="tag ok">{selectedProj.category}</span>
              <span className="pr">{selectedProj.price_tcr} TCR</span>
            </div>

            <h3 style={{ fontSize: '24px', margin: '12px 0 6px' }}>{selectedProj.title}</h3>
            <p className="mut" style={{ fontSize: '12.5px', marginBottom: '12px' }}>
              CA: <code>{deployedContracts.contracts.ThesisPlatform.address}</code>
              <br />
              Token ID: <b>{selectedProj.token_id ? `#${selectedProj.token_id}` : 'Pending Mint'}</b>{' '}
              • GitHub:{' '}
              <a href={selectedProj.github_url} target="_blank" rel="noreferrer" className="lk">
                Open Repo
              </a>
            </p>

            <label style={{ display: 'block', fontWeight: 700, fontSize: '13.5px', marginTop: '12px' }}>
              Description / Abstract (Editable)
            </label>
            <textarea
              required
              rows={4}
              className="in"
              value={editForm.abstract}
              onChange={(e) => setEditForm({ ...editForm, abstract: e.target.value })}
            />

            <label style={{ display: 'block', fontWeight: 700, fontSize: '13.5px', marginTop: '12px' }}>
              Technology Stack (comma separated)
            </label>
            <input
              required
              className="in"
              value={editForm.techStack}
              onChange={(e) => setEditForm({ ...editForm, techStack: e.target.value })}
            />

            <label style={{ display: 'block', fontWeight: 700, fontSize: '13.5px', marginTop: '12px' }}>
              Documentation Link
            </label>
            <input
              type="url"
              className="in"
              value={editForm.docsUrl}
              onChange={(e) => setEditForm({ ...editForm, docsUrl: e.target.value })}
            />

            <div className="row" style={{ marginTop: '20px', justifyContent: 'space-between' }}>
              <button type="submit" className="btn b1" disabled={savingEdit}>
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setSelectedProj(null)}
                disabled={savingEdit}
              >
                Close
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}