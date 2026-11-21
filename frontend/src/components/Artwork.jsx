import deployedContracts from '../deployedContracts.json';

export const CATEGORIES = [
  'Tech & Software',
  'Neuroscience',
  'Climate',
  'Identity',
  'Agriculture',
  'Privacy',
  'FinTech',
];

export const CATEGORY_NFT_IMAGE = {
  'Tech & Software': '/nft-tech-software.png',
  Neuroscience: '/nft-neuroscience.png',
  Climate: '/nft-climate.png',
  Identity: '/nft-identity.png',
  Agriculture: '/nft-agriculture.png',
  Privacy: '/nft-privacy.png',
  FinTech: '/nft-identity.png',
};

const ART_INDEX = {
  'Tech & Software': 0,
  Neuroscience: 0,
  Climate: 1,
  Identity: 2,
  Agriculture: 3,
  Privacy: 4,
  FinTech: 2,
};

const BG = ['#3457F1', '#C9F36A', '#171717', '#E9E7E0', '#FFFFFF'];
const TC = ['#fff', '#171717', '#F5F3EC', '#171717', '#171717'];

function wrapTitle(title, maxLen = 14) {
  const lines = [];
  let line = '';
  (title || 'Untitled project')
    .split(/\s+/)
    .filter(Boolean)
    .forEach((word) => {
      if ((line + ' ' + word).trim().length > maxLen && line) {
        lines.push(line);
        line = word;
      } else {
        line = (line + ' ' + word).trim();
      }
    });
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

/**
 * Compact vertical cover for the Hero Deck & Registry Live Preview
 */
export function ProjectCover({ title, category, verified }) {
  const a = ART_INDEX[category] ?? 4;
  const lines = wrapTitle(title, 13);
  const textColor = TC[a];
  const badgeColors = a === 1 ? ['#171717', '#C9F36A'] : ['#C9F36A', '#171717'];

  return (
    <svg className="cv" viewBox="0 0 300 340" role="img" aria-label={`Cover: ${title}`}>
      <rect
        width="300"
        height="340"
        rx="10"
        fill={BG[a]}
        stroke={a === 4 ? '#171717' : undefined}
        strokeWidth={a === 4 ? '2' : undefined}
      />

      {a === 0 && (
        <>
          {[
            [90, '#C9F36A'],
            [68, '#fff'],
            [46, '#C9F36A'],
          ].map(([r, k], idx) => (
            <path
              key={idx}
              d={`M${150 - r} 145a${r} ${r} 0 0 1 ${2 * r} 0`}
              fill="none"
              stroke={k}
              strokeWidth="12"
            />
          ))}
          <path d="M126 145a24 24 0 0 1 48 0z" fill="#fff" />
        </>
      )}

      {a === 1 &&
        [0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d={`M-10 ${72 + i * 30} Q70 ${28 + i * 30} 150 ${72 + i * 30}T310 ${72 + i * 30}`}
            fill="none"
            stroke={i === 3 ? '#3457F1' : '#171717'}
            strokeWidth={7 + i * 2.5}
          />
        ))}

      {a === 2 && (
        <>
          <rect x="44" y="52" width="130" height="160" rx="22" fill="#3457F1" />
          <rect x="86" y="76" width="150" height="130" rx="22" fill="#F5F3EC" />
          <circle cx="160" cy="126" r="26" fill="#171717" />
          <rect x="118" y="168" width="84" height="12" rx="6" fill="#171717" />
          <circle cx="68" cy="74" r="9" fill="#C9F36A" />
        </>
      )}

      {a === 3 &&
        [0, 1, 2].map((r) =>
          [0, 1, 2, 3, 4, 5].map((k) => (
            <ellipse
              key={`${r}-${k}`}
              cx={34 + k * 46}
              cy={76 + r * 42}
              rx="9"
              ry="19"
              transform={`rotate(${(r + k) % 2 ? 35 : -35} ${34 + k * 46} ${76 + r * 42})`}
              fill={(r * 3 + k) % 7 === 0 ? '#3457F1' : (r + k) % 2 ? '#171717' : '#777'}
            />
          ))
        )}

      {a === 4 &&
        [0, 1, 2, 3].map((r) =>
          [0, 1, 2, 3, 4, 5].map((k) => {
            const v = (r * 7 + k * 3) % 5;
            const fill =
              v === 0 ? '#C9F36A' : v === 1 ? '#3457F1' : v === 2 ? '#171717' : '#E9E7E0';
            return (
              <rect
                key={`${r}-${k}`}
                x={24 + k * 43}
                y={58 + r * 36}
                width="34"
                height="28"
                rx="5"
                fill={fill}
              />
            );
          })
        )}

      <text x="20" y="28" fontFamily="DM Sans, sans-serif" fontSize="12" fill={textColor} opacity=".85">
        {category}
      </text>

      {verified && (
        <>
          <circle cx="272" cy="24" r="10" fill={badgeColors[0]} />
          <path d="M267 24l4 4 7-8" stroke={badgeColors[1]} strokeWidth="2.5" fill="none" />
        </>
      )}

      {lines.map((line, i) => (
        <text
          key={i}
          x="20"
          y={314 - (lines.length - 1 - i) * 28}
          fontFamily="Space Grotesk, sans-serif"
          fontWeight="700"
          fontSize="25"
          letterSpacing="-1"
          fill={textColor}
        >
          {line}
        </text>
      ))}
    </svg>
  );
}

/**
 * Wide 16:9 Landscape Banner for Marketplace & Featured Research Cards
 */
export function ProjectBanner({ category, verified }) {
  const a = ART_INDEX[category] ?? 4;
  const textColor = TC[a];
  const badgeColors = a === 1 ? ['#171717', '#C9F36A'] : ['#C9F36A', '#171717'];

  return (
    <svg viewBox="0 0 400 160" style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect width="400" height="160" fill={BG[a]} />

      {a === 0 && (
        <g transform="translate(50, -10)">
          {[
            [95, '#C9F36A'],
            [70, '#fff'],
            [45, '#C9F36A'],
          ].map(([r, k], idx) => (
            <path
              key={idx}
              d={`M${150 - r} 150a${r} ${r} 0 0 1 ${2 * r} 0`}
              fill="none"
              stroke={k}
              strokeWidth="12"
            />
          ))}
          <path d="M126 150a24 24 0 0 1 48 0z" fill="#fff" />
        </g>
      )}

      {a === 1 &&
        [0, 1, 2].map((i) => (
          <path
            key={i}
            d={`M-10 ${54 + i * 32} Q100 ${14 + i * 32} 200 ${54 + i * 32}T410 ${54 + i * 32}`}
            fill="none"
            stroke={i === 2 ? '#3457F1' : '#171717'}
            strokeWidth={8 + i * 2}
          />
        ))}

      {a === 2 && (
        <g transform="translate(85, -18)">
          <rect x="44" y="42" width="110" height="110" rx="18" fill="#3457F1" />
          <rect x="86" y="56" width="120" height="90" rx="18" fill="#F5F3EC" />
          <circle cx="146" cy="95" r="20" fill="#171717" />
          <circle cx="64" cy="60" r="7" fill="#C9F36A" />
        </g>
      )}

      {a === 3 &&
        [0, 1].map((r) =>
          [0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
            <ellipse
              key={`${r}-${k}`}
              cx={34 + k * 48}
              cy={62 + r * 52}
              rx="9"
              ry="20"
              transform={`rotate(${(r + k) % 2 ? 35 : -35} ${34 + k * 48} ${62 + r * 52})`}
              fill={(r * 3 + k) % 7 === 0 ? '#3457F1' : (r + k) % 2 ? '#171717' : '#777'}
            />
          ))
        )}

      {a === 4 &&
        [0, 1, 2].map((r) =>
          [0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
            const v = (r * 7 + k * 3) % 5;
            const fill =
              v === 0 ? '#C9F36A' : v === 1 ? '#3457F1' : v === 2 ? '#171717' : '#E9E7E0';
            return (
              <rect
                key={`${r}-${k}`}
                x={20 + k * 46}
                y={44 + r * 36}
                width="36"
                height="26"
                rx="5"
                fill={fill}
              />
            );
          })
        )}

      <text
        x="16"
        y="26"
        fontFamily="DM Sans, sans-serif"
        fontWeight="700"
        fontSize="12"
        fill={textColor}
        opacity=".9"
      >
        {(category || 'RESEARCH').toUpperCase()}
      </text>

      {verified && (
        <>
          <circle cx="376" cy="22" r="10" fill={badgeColors[0]} />
          <path d="M371 22l4 4 7-8" stroke={badgeColors[1]} strokeWidth="2.5" fill="none" />
        </>
      )}
    </svg>
  );
}

/**
 * Exact TCR Token SVG (Interactive coin with centered revolving dotted ring)
 */
export function TcrCoinSvg({ onClick }) {
  return (
    <svg
      viewBox="0 0 320 320"
      width="100%"
      onClick={onClick}
      style={{
        maxWidth: '310px',
        cursor: 'pointer',
        display: 'block',
        filter: 'drop-shadow(0 18px 34px rgba(23,23,23,0.22))',
      }}
      role="img"
      aria-label="Thesis Credits Token"
    >
      <circle cx="160" cy="160" r="150" fill="#171717" />
      <circle cx="160" cy="160" r="122" fill="#3457F1" />
      <circle
        className="tcr-dotted-ring"
        cx="160"
        cy="160"
        r="96"
        fill="none"
        stroke="#C9F36A"
        strokeWidth="3.5"
        strokeDasharray="2 9.5"
        strokeLinecap="round"
      />
      <text
        x="160"
        y="175"
        textAnchor="middle"
        fontFamily="Space Grotesk, sans-serif"
        fontWeight="700"
        fontSize="64"
        fill="#fff"
        letterSpacing="-3"
      >
        TCR
      </text>
      <text
        x="160"
        y="212"
        textAnchor="middle"
        fontFamily="Instrument Serif, serif"
        fontStyle="italic"
        fontSize="23"
        fill="#C9F36A"
      >
        Thesis Credits
      </text>
    </svg>
  );
}

/**
 * Soulbound NFT Certificate Card with Category-Specific PNG Artwork
 */
export function CertificateCard({
  title,
  tokenId,
  txHash,
  category = 'Tech & Software',
}) {
  const nftImage = CATEGORY_NFT_IMAGE[category] || '/nft-tech-software.png';
  const platformCA = deployedContracts.contracts.ThesisPlatform.address;

  return (
    <div
      className="cert"
      style={{
        display: 'grid',
        gridTemplateColumns: '96px 1fr',
        gap: '16px',
        alignItems: 'center',
        padding: '18px',
      }}
    >
      <img
        src={nftImage}
        alt={`${category} Soulbound Certificate`}
        style={{
          width: '96px',
          height: '120px',
          objectFit: 'cover',
          borderRadius: '6px',
          border: '1.5px solid #171717',
        }}
      />
      <div style={{ minWidth: 0 }}>
        <small style={{ fontWeight: 700, color: '#3457F1' }}>
          SOULBOUND ERC-721 • #{String(tokenId || 1).padStart(4, '0')}
        </small>
        <h4
          style={{
            margin: '4px 0 10px',
            fontSize: '22px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={title}
        >
          {title}
        </h4>
        <dl>
          <dt>CA</dt>
          <dd>{`${platformCA.slice(0, 10)}…${platformCA.slice(-8)}`}</dd>
          <dt>Token ID</dt>
          <dd>#{tokenId || 1} (Non-transferable)</dd>
          {txHash && (
            <>
              <dt>Tx Ref</dt>
              <dd>{`${txHash.slice(0, 12)}…${txHash.slice(-6)}`}</dd>
            </>
          )}
        </dl>
      </div>
    </div>
  );
}

const PALETTES = [
  ['#3457F1', '#C9F36A'],
  ['#C9F36A', '#171717'],
  ['#171717', '#F5F3EC'],
  ['#E9E7E0', '#3457F1'],
];

export function MentorAvatar({ name, index = 0 }) {
  const [c, f] = PALETTES[index % PALETTES.length];
  const initials = (name || 'ST')
    .split(' ')
    .map((x) => x[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <svg
      viewBox="0 0 200 240"
      width="100%"
      role="img"
      aria-label={`Portrait for ${name}`}
      style={{ borderRadius: '6px', display: 'block' }}
    >
      <rect width="200" height="240" fill={c} />
      <circle cx="150" cy="70" r="46" fill={f} opacity=".9" />
      <path d="M0 240V170Q100 90 200 170V240z" fill={f} />
      <text
        x="16"
        y="222"
        fontFamily="Space Grotesk, sans-serif"
        fontWeight="700"
        fontSize="56"
        fill={c}
        letterSpacing="-3"
      >
        {initials}
      </text>
    </svg>
  );
}