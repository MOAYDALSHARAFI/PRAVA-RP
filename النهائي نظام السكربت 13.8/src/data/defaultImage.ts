// Default realistic FiveM SWAT scenario screenshot represented as an SVG Data URI
export const DEFAULT_FIVEM_SCREENSHOT = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs>
    <linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#080c14"/>
      <stop offset="60%" stopColor="#0e1726"/>
      <stop offset="100%" stopColor="#182338"/>
    </linearGradient>
    <linearGradient id="wallGradient" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#1e293b"/>
      <stop offset="50%" stopColor="#293548"/>
      <stop offset="100%" stopColor="#1c2534"/>
    </linearGradient>
  </defs>

  <!-- Night Alley & Brick Wall -->
  <rect width="1280" height="720" fill="url(#nightSky)" />
  <rect x="0" y="160" width="1280" height="560" fill="url(#wallGradient)" />

  <!-- Wall seams / bricks -->
  <line x1="0" y1="280" x2="1280" y2="280" stroke="#151e2e" stroke-width="2"/>
  <line x1="0" y1="400" x2="1280" y2="400" stroke="#151e2e" stroke-width="2"/>
  <line x1="0" y1="520" x2="1280" y2="520" stroke="#151e2e" stroke-width="2"/>
  <line x1="400" y1="160" x2="400" y2="720" stroke="#151e2e" stroke-width="3"/>
  <line x1="840" y1="160" x2="840" y2="720" stroke="#151e2e" stroke-width="3"/>

  <!-- FiveM Top HUD / Server Notification -->
  <rect x="440" y="24" width="400" height="54" rx="10" fill="#090d16" fill-opacity="0.85" stroke="#1e293b" stroke-width="1.5"/>
  <text x="640" y="44" fill="#38bdf8" font-size="13" font-weight="900" font-family="sans-serif" text-anchor="middle" letter-spacing="2">WELCOME TO PRAVA RP</text>
  <rect x="470" y="52" width="60" height="18" rx="4" fill="#1e3a8a"/>
  <text x="500" y="65" fill="#93c5fd" font-size="9" font-weight="700" font-family="sans-serif" text-anchor="middle">SWAT 8/8</text>
  <text x="640" y="65" fill="#94a3b8" font-size="10" font-family="sans-serif" text-anchor="middle">ONLINE: 240/256</text>
  <rect x="750" y="52" width="60" height="18" rx="4" fill="#166534"/>
  <text x="780" y="65" fill="#86efac" font-size="9" font-weight="700" font-family="sans-serif" text-anchor="middle">SAFE ZONE</text>

  <!-- Left Chat Simulation -->
  <g opacity="0.8" font-family="sans-serif" font-size="11">
    <rect x="30" y="110" width="220" height="140" rx="8" fill="#050810" fill-opacity="0.75" />
    <text x="40" y="130" fill="#f87171">[بريك عسكري] ديسكورد السناريو مفتوح</text>
    <text x="40" y="152" fill="#38bdf8">[الأدمن] تسجيل خروج إداري</text>
    <text x="40" y="174" fill="#facc15">[الدعم] نداء تكتيكي للروم الصوتي</text>
    <text x="40" y="196" fill="#4ade80">[راديو] وصول كافة أفراد سوات</text>
    <text x="40" y="218" fill="#cbd5e1">I-85: التجمع جاهز للتصوير والتوثيق</text>
  </g>

  <!-- Tactical Officers Squad in Formation -->
  <!-- Officer 1: Left -->
  <g transform="translate(360, 360)">
    <!-- Body & Vest -->
    <path d="M-22,60 L22,60 L18,170 L-18,170 Z" fill="#090d16" stroke="#1e293b" stroke-width="2"/>
    <rect x="-16" y="70" width="32" height="50" rx="4" fill="#0f172a" stroke="#334155"/>
    <text x="0" y="98" fill="#cbd5e1" font-size="7" font-weight="900" font-family="sans-serif" text-anchor="middle">SWAT</text>
    <!-- Arms -->
    <rect x="-30" y="65" width="10" height="70" rx="5" fill="#090d16"/>
    <rect x="20" y="65" width="10" height="70" rx="5" fill="#090d16"/>
    <!-- Head / Helmet -->
    <circle cx="0" cy="38" r="18" fill="#070a12" stroke="#1e293b" stroke-width="2"/>
    <rect x="-12" y="32" width="24" height="8" rx="2" fill="#1e293b"/>
    <!-- Overhead ID box -->
    <rect x="-24" y="-2" width="48" height="20" rx="4" fill="#dc2626" fill-opacity="0.9" stroke="#f87171" stroke-width="1.2"/>
    <text x="0" y="12" fill="#ffffff" font-size="11" font-weight="900" font-family="sans-serif" text-anchor="middle">264636</text>
  </g>

  <!-- Officer 2: Center Left -->
  <g transform="translate(450, 350)">
    <path d="M-22,60 L22,60 L18,180 L-18,180 Z" fill="#090d16" stroke="#1e293b" stroke-width="2"/>
    <rect x="-16" y="70" width="32" height="52" rx="4" fill="#0f172a" stroke="#334155"/>
    <text x="0" y="98" fill="#cbd5e1" font-size="7" font-weight="900" font-family="sans-serif" text-anchor="middle">SWAT</text>
    <rect x="-30" y="65" width="10" height="70" rx="5" fill="#090d16"/>
    <rect x="20" y="65" width="10" height="70" rx="5" fill="#090d16"/>
    <circle cx="0" cy="38" r="18" fill="#070a12" stroke="#1e293b" stroke-width="2"/>
    <rect x="-12" y="32" width="24" height="8" rx="2" fill="#1e293b"/>
    <!-- Overhead ID box -->
    <rect x="-20" y="-2" width="40" height="20" rx="4" fill="#dc2626" fill-opacity="0.9" stroke="#f87171" stroke-width="1.2"/>
    <text x="0" y="12" fill="#ffffff" font-size="11" font-weight="900" font-family="sans-serif" text-anchor="middle">-2935</text>
  </g>

  <!-- Officer 3: Lead Center Officer -->
  <g transform="translate(540, 340)">
    <path d="M-24,60 L24,60 L20,190 L-20,190 Z" fill="#090d16" stroke="#2563eb" stroke-width="2"/>
    <rect x="-18" y="70" width="36" height="56" rx="4" fill="#0f172a" stroke="#3b82f6"/>
    <text x="0" y="100" fill="#60a5fa" font-size="8" font-weight="900" font-family="sans-serif" text-anchor="middle">LEAD</text>
    <rect x="-32" y="65" width="11" height="75" rx="5" fill="#090d16"/>
    <rect x="21" y="65" width="11" height="75" rx="5" fill="#090d16"/>
    <circle cx="0" cy="38" r="19" fill="#070a12" stroke="#2563eb" stroke-width="2"/>
    <rect x="-13" y="32" width="26" height="9" rx="2" fill="#2563eb"/>
    <!-- Overhead ID box: 422 -->
    <rect x="-18" y="-4" width="36" height="21" rx="4" fill="#2563eb" fill-opacity="0.95" stroke="#93c5fd" stroke-width="1.5"/>
    <text x="0" y="11" fill="#ffffff" font-size="12" font-weight="900" font-family="sans-serif" text-anchor="middle">422</text>
  </g>

  <!-- Officer 4: Center Right -->
  <g transform="translate(630, 360)">
    <path d="M-22,60 L22,60 L18,170 L-18,170 Z" fill="#090d16" stroke="#1e293b" stroke-width="2"/>
    <rect x="-16" y="70" width="32" height="50" rx="4" fill="#0f172a" stroke="#334155"/>
    <text x="0" y="98" fill="#cbd5e1" font-size="7" font-weight="900" font-family="sans-serif" text-anchor="middle">SWAT</text>
    <rect x="-30" y="65" width="10" height="70" rx="5" fill="#090d16"/>
    <rect x="20" y="65" width="10" height="70" rx="5" fill="#090d16"/>
    <circle cx="0" cy="38" r="18" fill="#070a12" stroke="#1e293b" stroke-width="2"/>
    <rect x="-12" y="32" width="24" height="8" rx="2" fill="#1e293b"/>
    <!-- Overhead ID box: 1551 -->
    <rect x="-18" y="-2" width="36" height="20" rx="4" fill="#dc2626" fill-opacity="0.9" stroke="#f87171" stroke-width="1.2"/>
    <text x="0" y="12" fill="#ffffff" font-size="11" font-weight="900" font-family="sans-serif" text-anchor="middle">1551</text>
  </g>

  <!-- Officer 5: Right -->
  <g transform="translate(720, 370)">
    <path d="M-22,60 L22,60 L18,160 L-18,160 Z" fill="#090d16" stroke="#1e293b" stroke-width="2"/>
    <rect x="-16" y="70" width="32" height="50" rx="4" fill="#0f172a" stroke="#334155"/>
    <text x="0" y="98" fill="#cbd5e1" font-size="7" font-weight="900" font-family="sans-serif" text-anchor="middle">SWAT</text>
    <rect x="-30" y="65" width="10" height="70" rx="5" fill="#090d16"/>
    <rect x="20" y="65" width="10" height="70" rx="5" fill="#090d16"/>
    <circle cx="0" cy="38" r="18" fill="#070a12" stroke="#1e293b" stroke-width="2"/>
    <rect x="-12" y="32" width="24" height="8" rx="2" fill="#1e293b"/>
    <!-- Overhead ID box: -410 -->
    <rect x="-18" y="-2" width="36" height="20" rx="4" fill="#dc2626" fill-opacity="0.9" stroke="#f87171" stroke-width="1.2"/>
    <text x="0" y="12" fill="#ffffff" font-size="11" font-weight="900" font-family="sans-serif" text-anchor="middle">-410</text>
  </g>

  <!-- FiveM Circular Minimap in Lower Left -->
  <g transform="translate(130, 590)">
    <!-- Outer Rim -->
    <circle cx="0" cy="0" r="75" fill="#060910" stroke="#1e293b" stroke-width="4"/>
    <!-- Map texture simulation -->
    <circle cx="0" cy="0" r="70" fill="#202a3a" opacity="0.9"/>
    <!-- Road lines -->
    <path d="M-40,-50 L20,30 L60,-20" stroke="#e2e8f0" stroke-width="4" fill="none" opacity="0.7"/>
    <path d="M-60,10 L50,10" stroke="#eab308" stroke-width="3" fill="none" opacity="0.8"/>
    <path d="M10,-60 L10,60" stroke="#e2e8f0" stroke-width="3" fill="none" opacity="0.7"/>
    <!-- Player Arrow Icon -->
    <polygon points="0,-10 7,8 0,4 -7,8" fill="#38bdf8"/>
    <!-- Health / Armor Status Bars underneath -->
    <rect x="-60" y="82" width="55" height="6" rx="3" fill="#ef4444"/>
    <rect x="5" y="82" width="55" height="6" rx="3" fill="#3b82f6"/>
  </g>

  <!-- Bottom Location Watermark -->
  <text x="640" y="690" fill="#94a3b8" font-size="12" font-family="sans-serif" font-weight="bold" text-anchor="middle">
    ★ Special Weapons and Tactics — قطاع سوات التكتيكي ★
  </text>
</svg>
`)}`;
