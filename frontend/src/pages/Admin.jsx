import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { supabase } from '../lib/supabase';

export default function Admin() {
  const { isAdmin, platformContract } = useWeb3();
  const [pendingProjects, setPendingProjects] = useState([]);
  const [pendingMentors, setPendingMentors] = useState([]);
  const [approvingId, setApprovingId] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  const loadQueue = async () => {
    const [pRes, mRes] = await Promise.all([
      supabase
        .from('projects')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase
        .from('mentors')
        .select('*')
        .eq('is_verified', false)
        .order('created_at', { ascending: false }),
    ]);
    setPendingProjects(pRes.data || []);
    setPendingMentors(mRes.data || []);
  };

  useEffect(() => {
    if (isAdmin) loadQueue();
  }, [isAdmin]);

  const handleApproveAndMint = async (project) => {
    if (!platformContract) return;
    try {
      setApprovingId(project.id);
      setStatusMsg(`Confirm on-chain approval & Soulbound NFT minting for "${project.title}" in MetaMask...`);

      const tx = await platformContract.approveProject(project.id);
      setStatusMsg('Waiting for block confirmation...');
      const receipt = await tx.wait();

      let mintedTokenId = null;
      for (const log of receipt.logs) {
        try {
          const parsed = platformContract.interface.parseLog(log);
          if (parsed?.name === 'ProjectApproved') {
            mintedTokenId = Number(parsed.args.tokenId);
          }
        } catch {
          // ignore non-platform logs
        }
      }

      await supabase
        .from('projects')
        .update({
          status: 'approved',
          token_id: mintedTokenId,
          tx_hash: receipt.hash,
        })
        .eq('id', project.id);

      setStatusMsg(`Approved! Soulbound NFT #${mintedTokenId} minted directly to creator wallet.`);
      loadQueue();
    } catch (err) {
      console.error(err);
      setStatusMsg(err.reason || err.message || 'On-chain approval failed.');
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectProject = async (id) => {
    await supabase.from('projects').update({ status: 'rejected' }).eq('id', id);
    loadQueue();
  };

  const verifyMentor = async (id) => {
    await supabase.from('mentors').update({ is_verified: true }).eq('id', id);
    loadQueue();
  };

  if (!isAdmin) {
    return (
      <div className="pg">
        <div className="w">
          <h1>Admin panel</h1>
          <div className="nt" style={{ maxWidth: '520px' }}>
            Restricted view. Switch MetaMask to the authorized administrator wallet to review
            submissions.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pg">
      <div className="w">
        <h1>Admin panel</h1>
        <div className="nt" style={{ maxWidth: '680px' }}>
          {statusMsg ||
            'Approving a project executes an on-chain transaction that mints the Soulbound ERC-721 certificate directly to the student’s wallet.'}
        </div>

        <div className="dg">
          <div>
            <h3>Project submissions ({pendingProjects.length})</h3>
            <div className="ls">
              {pendingProjects.length === 0 ? (
                <div className="li mut">No pending project submissions.</div>
              ) : (
                pendingProjects.map((p) => (
                  <div key={p.id} className="li">
                    <div>
                      <b>{p.title}</b>
                      <br />
                      <small className="mut">
                        {p.category} • {p.price_tcr} TCR • Creator: {p.creator_wallet.slice(0, 8)}…
                      </small>
                    </div>
                    <span className="row">
                      <button
                        className="btn b1 sm"
                        disabled={approvingId === p.id}
                        onClick={() => handleApproveAndMint(p)}
                      >
                        {approvingId === p.id ? 'Minting...' : 'Approve & Mint NFT'}
                      </button>
                      <button
                        className="btn sm"
                        disabled={approvingId === p.id}
                        onClick={() => handleRejectProject(p.id)}
                      >
                        Reject
                      </button>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h3>Mentor verification ({pendingMentors.length})</h3>
            <div className="ls">
              {pendingMentors.length === 0 ? (
                <div className="li mut">No pending mentor applications.</div>
              ) : (
                pendingMentors.map((m) => (
                  <div key={m.id} className="li">
                    <div>
                      <b>{m.full_name}</b>
                      <br />
                      <small className="mut">
                        {m.expertise} • {m.session_price_tcr} TCR
                      </small>
                    </div>
                    <button className="btn b1 sm" onClick={() => verifyMentor(m.id)}>
                      Verify
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}