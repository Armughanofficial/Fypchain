import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { supabase } from '../lib/supabase';
import { MentorAvatar } from '../components/Artwork';

export default function Mentorship() {
  const { account, profile, tcrContract, platformContract, refreshBalance, connectWallet } =
    useWeb3();

  const [mentors, setMentors] = useState([]);
  const [showApply, setShowApply] = useState(false);
  const [bookingMentor, setBookingMentor] = useState(null);
  const [topic, setTopic] = useState('');
  const [date, setDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const [applyForm, setApplyForm] = useState({
    expertise: '',
    technologies: '',
    experienceDesc: '',
    sessionPriceTcr: '25',
  });

  const loadMentors = async () => {
    const { data } = await supabase
      .from('mentors')
      .select('*')
      .eq('is_verified', true)
      .order('created_at', { ascending: false });
    setMentors(data || []);
  };

  useEffect(() => {
    loadMentors();
  }, []);

  const submitMentorApp = async (e) => {
    e.preventDefault();
    if (!account) return;
    try {
      setBusy(true);
      const wallet = account.toLowerCase();

      await supabase.from('profiles').upsert(
        {
          wallet_address: wallet,
          full_name: profile?.full_name || `Senior ${account.slice(0, 6)}`,
          university: 'FAST NUCES',
        },
        { onConflict: 'wallet_address', ignoreDuplicates: true }
      );

      const { error } = await supabase.from('mentors').insert({
        wallet_address: wallet,
        full_name: profile?.full_name || `Senior ${account.slice(0, 6)}`,
        expertise: applyForm.expertise,
        technologies: applyForm.technologies
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        experience_desc: applyForm.experienceDesc,
        session_price_tcr: Number(applyForm.sessionPriceTcr),
        is_verified: false,
      });
      if (error) throw error;
      setMsg('Mentor application submitted! Approve it in the Admin panel.');
      setShowApply(false);
    } catch (err) {
      setMsg(err.message || 'Could not submit application.');
    } finally {
      setBusy(false);
    }
  };

  const confirmBooking = async (e) => {
    e.preventDefault();
    if (!bookingMentor || !account) return;

    try {
      setBusy(true);
      const feeWei = ethers.parseEther(bookingMentor.session_price_tcr.toString());
      const platformAddress = await platformContract.getAddress();
      const onChainBookingId = Date.now();

      setMsg(`1/3 Approving ${bookingMentor.session_price_tcr} TCR in MetaMask...`);
      const appTx = await tcrContract.approve(platformAddress, feeWei);
      await appTx.wait();

      setMsg('2/3 Sending mentorship payment on-chain...');
      const payTx = await platformContract.payMentorship(
        onChainBookingId,
        bookingMentor.wallet_address,
        feeWei
      );
      const receipt = await payTx.wait();

      setMsg('3/3 Saving confirmed booking...');
      const { error } = await supabase.from('bookings').insert({
        mentor_id: bookingMentor.id,
        student_wallet: account.toLowerCase(),
        mentor_wallet: bookingMentor.wallet_address,
        topic,
        scheduled_date: date,
        amount_tcr: bookingMentor.session_price_tcr,
        status: 'confirmed',
        tx_hash: receipt.hash,
      });
      if (error) throw error;

      await refreshBalance();
      setMsg('');
      setBookingMentor(null);
      setTopic('');
      setDate('');
      alert(`Session booked with ${bookingMentor.full_name}!`);
    } catch (err) {
      console.error(err);
      setMsg(err.reason || err.message || 'Booking failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pg">
      <div className="w">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'end' }}>
          <div>
            <h1>Mentorship</h1>
            <p className="mut" style={{ maxWidth: '52ch' }}>
              Book a session with a verified senior who has built something like your project.
            </p>
          </div>
          {account && (
            <button className="btn sm" onClick={() => setShowApply(!showApply)}>
              {showApply ? 'Close form' : '+ Become a Mentor'}
            </button>
          )}
        </div>

        {msg && <div className="nt">{msg}</div>}

        {showApply && (
          <form
            onSubmit={submitMentorApp}
            className="buy"
            style={{ display: 'block', marginTop: '24px' }}
          >
            <h3>Apply as a Senior Mentor</h3>
            <div className="fm" style={{ marginTop: '12px' }}>
              <div>
                <label>Area of expertise</label>
                <input
                  required
                  className="in"
                  placeholder="e.g., Smart Contracts & DeFi Architecture"
                  value={applyForm.expertise}
                  onChange={(e) => setApplyForm({ ...applyForm, expertise: e.target.value })}
                />
                <label>Technologies (comma separated)</label>
                <input
                  required
                  className="in"
                  placeholder="Solidity, Rust, React"
                  value={applyForm.technologies}
                  onChange={(e) => setApplyForm({ ...applyForm, technologies: e.target.value })}
                />
              </div>
              <div>
                <label>Session price (TCR)</label>
                <input
                  required
                  type="number"
                  min="1"
                  className="in"
                  value={applyForm.sessionPriceTcr}
                  onChange={(e) => setApplyForm({ ...applyForm, sessionPriceTcr: e.target.value })}
                />
                <label>Academic & project background</label>
                <textarea
                  required
                  rows={2}
                  className="in"
                  value={applyForm.experienceDesc}
                  onChange={(e) => setApplyForm({ ...applyForm, experienceDesc: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="btn b1" style={{ marginTop: '16px' }} disabled={busy}>
              {busy ? 'Submitting...' : 'Submit Mentor Profile'}
            </button>
          </form>
        )}

        {mentors.length === 0 ? (
          <p className="mut" style={{ marginTop: '40px' }}>
            No verified mentors yet. Click &ldquo;+ Become a Mentor&rdquo; above and verify via
            Admin.
          </p>
        ) : (
          <div className="mg">
            {mentors.map((m, idx) => {
              const isSelf = account && m.wallet_address === account.toLowerCase();
              return (
                <div key={m.id}>
                  <div className="pc">
                    <MentorAvatar name={m.full_name} index={idx} />
                  </div>
                  <div className="mn">{m.full_name}</div>
                  <div className="mx">{m.expertise}</div>
                  <p className="mut" style={{ fontSize: '14px', margin: '6px 0 10px' }}>
                    {m.experience_desc}
                  </p>
                  <div className="chips">
                    {(m.technologies || []).map((t, i) => (
                      <span key={i} className="chip">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="pm" style={{ marginTop: '14px' }}>
                    <span className="pr">{m.session_price_tcr} TCR</span>
                    {!account ? (
                      <button className="btn sm" onClick={connectWallet}>
                        Connect
                      </button>
                    ) : isSelf ? (
                      <span className="tag">You</span>
                    ) : (
                      <button
                        className="btn b1 sm"
                        onClick={() => {
                          setMsg('');
                          setBookingMentor(m);
                        }}
                      >
                        Book session
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {bookingMentor && (
        <div className="ov" onClick={() => !busy && setBookingMentor(null)}>
          <form
            className="md"
            onSubmit={confirmBooking}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '26px', marginBottom: '8px' }}>
              Book {bookingMentor.full_name}
            </h3>
            <p className="mut">Session rate: {bookingMentor.session_price_tcr} TCR</p>

            <label style={{ display: 'block', fontWeight: 700, fontSize: '14px', marginTop: '14px' }}>
              Discussion topic
            </label>
            <input
              required
              className="in"
              placeholder="e.g., Smart contract security & architecture"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />

            <label style={{ display: 'block', fontWeight: 700, fontSize: '14px', marginTop: '14px' }}>
              Preferred date
            </label>
            <input
              required
              type="date"
              className="in"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            {msg && <div className="nt">{msg}</div>}

            <div className="row" style={{ marginTop: '20px' }}>
              <button type="submit" className="btn b1" disabled={busy}>
                {busy ? 'Processing...' : `Pay ${bookingMentor.session_price_tcr} TCR & Book`}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setBookingMentor(null)}
                disabled={busy}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}