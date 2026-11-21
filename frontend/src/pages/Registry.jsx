import { useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { supabase } from '../lib/supabase';
import { CATEGORIES, CATEGORY_NFT_IMAGE, ProjectCover } from '../components/Artwork';

export default function Registry({ setActiveTab }) {
  const { account, platformContract, connectWallet } = useWeb3();

  const [form, setForm] = useState({
    title: '',
    abstract: '',
    category: CATEGORIES[0],
    techStack: '',
    githubUrl: '',
    docsUrl: '',
    priceTcr: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');

  const completedFields = [
    form.title.trim(),
    form.abstract.trim(),
    form.category,
    form.techStack.trim(),
    form.githubUrl.trim(),
    form.docsUrl.trim(),
    form.priceTcr.trim(),
  ].filter(Boolean).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account || !platformContract) return;

    try {
      setSubmitting(true);
      setStatus('1/3 Creating project record in Supabase...');

      const wallet = account.toLowerCase();

      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          wallet_address: wallet,
          full_name: `Student ${account.slice(0, 6)}`,
          university: 'FAST NUCES',
        },
        { onConflict: 'wallet_address', ignoreDuplicates: true }
      );
      if (profileError) throw profileError;

      const techArray = form.techStack
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const { data: inserted, error } = await supabase
        .from('projects')
        .insert({
          title: form.title,
          abstract: form.abstract,
          category: form.category,
          tech_stack: techArray,
          github_url: form.githubUrl,
          docs_url: form.docsUrl,
          price_tcr: Number(form.priceTcr),
          creator_wallet: wallet,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      setStatus('2/3 Sign on-chain project submission in MetaMask...');

      const relativeAsset = CATEGORY_NFT_IMAGE[form.category] || '/nft-tech-software.png';
      const fullImageUrl = `${window.location.origin}${relativeAsset}`;

      const cleanTitle =
        form.title.length > 48 ? `${form.title.slice(0, 45)}...` : form.title;

      const tokenMetadata = {
        name: cleanTitle,
        description: `Official Soulbound ERC-721 Certificate of Academic IP Ownership (${form.category}) issued on FypChain.`,
        image: fullImageUrl,
        external_url: form.docsUrl || form.githubUrl,
        attributes: [
          { trait_type: 'Category', value: form.category },
          { trait_type: 'Transferability', value: 'Soulbound (Non-Transferable)' },
        ],
      };

      const metadataURI = `data:application/json;base64,${btoa(
        unescape(encodeURIComponent(JSON.stringify(tokenMetadata)))
      )}`;

      const tx = await platformContract.registerProject(
        inserted.id,
        metadataURI,
        ethers.parseEther(form.priceTcr.toString())
      );

      setStatus('3/3 Confirming registration on Ethereum...');
      const receipt = await tx.wait();

      await supabase
        .from('projects')
        .update({ tx_hash: receipt.hash })
        .eq('id', inserted.id);

      setStatus('Submitted on-chain! Soulbound NFT will mint to your wallet upon Admin approval.');
      setTimeout(() => setActiveTab('dashboard'), 1500);
    } catch (err) {
      console.error(err);
      setStatus(err.reason || err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!account) {
    return (
      <div className="pg">
        <div className="w">
          <h1>Register your research</h1>
          <p className="mut" style={{ margin: '16px 0 24px' }}>
            Connect MetaMask to register your Final Year Project on-chain.
          </p>
          <button className="btn b1" onClick={connectWallet}>
            Connect wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pg">
      <div className="w">
        <h1>Register your research</h1>
        <p className="mut">
          Submit your project on-chain. Once verified by an Admin, your Soulbound NFT certificate
          mints directly to your wallet.
        </p>

        <div className="prog">
          <i style={{ width: `${(completedFields / 7) * 100}%` }} />
        </div>
        <small className="mut">{completedFields} of 7 fields complete</small>

        <div className="fm">
          <form onSubmit={handleSubmit}>
            <label htmlFor="ft1">Project title</label>
            <input
              id="ft1"
              required
              className="in"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <label htmlFor="fd">Description / Abstract</label>
            <textarea
              id="fd"
              required
              rows={4}
              className="in"
              value={form.abstract}
              onChange={(e) => setForm({ ...form, abstract: e.target.value })}
            />

            <label htmlFor="fc1">Category</label>
            <select
              id="fc1"
              className="in"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>

            <label htmlFor="fs">Technology stack (comma separated)</label>
            <input
              id="fs"
              required
              placeholder="Solidity, React, Supabase"
              className="in"
              value={form.techStack}
              onChange={(e) => setForm({ ...form, techStack: e.target.value })}
            />

            <label htmlFor="fg">GitHub repository</label>
            <input
              id="fg"
              required
              type="url"
              placeholder="https://github.com/..."
              className="in"
              value={form.githubUrl}
              onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
            />

            <label htmlFor="fk">Documentation link</label>
            <input
              id="fk"
              type="url"
              placeholder="https://..."
              className="in"
              value={form.docsUrl}
              onChange={(e) => setForm({ ...form, docsUrl: e.target.value })}
            />

            <label htmlFor="fp">Licensing price (TCR)</label>
            <input
              id="fp"
              required
              type="number"
              min="1"
              className="in"
              value={form.priceTcr}
              onChange={(e) => setForm({ ...form, priceTcr: e.target.value })}
            />

            {status && <div className="nt">{status}</div>}

            <div style={{ marginTop: '20px' }}>
              <button type="submit" className="btn b1" disabled={submitting}>
                {submitting ? 'Submitting On-Chain...' : 'Submit Project for Verification'}
              </button>
            </div>
          </form>

          <div style={{ position: 'sticky', top: '90px', alignSelf: 'start', marginTop: '16px' }}>
            <b>Live cover preview</b>
            <div style={{ maxWidth: '300px', marginTop: '12px' }}>
              <ProjectCover
                title={form.title || 'Your project title'}
                category={form.category}
                verified={false}
              />
              <p className="cap">
                {form.priceTcr ? `${form.priceTcr} TCR licence` : 'Set a price'}, pending admin
                mint
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}