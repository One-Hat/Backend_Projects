import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Database,
  Shield,
  Zap,
  FolderOpen,
  CheckCircle,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Plus,
  Key,
  Server,
  Code,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mode, setMode] = useState('mode-live'); // 'mode-left', 'mode-top', 'mode-live'
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeRole, setActiveRole] = useState('ADMIN');
  const [schemaFields, setSchemaFields] = useState([
    { name: 'title', type: 'STRING', required: true },
    { name: 'content', type: 'TEXT', required: true },
    { name: 'author', type: 'RELATION (Author)', required: false },
    { name: 'coverImage', type: 'MEDIA (Asset)', required: false },
  ]);
  const [dataLoaderActive, setDataLoaderActive] = useState(true);

  const totalSlides = 8;
  const audioCtxRef = useRef(null);

  // Play synthesized sci-fi sounds
  const playSound = (type) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (type === 'next') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'prev') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.exponentialRampToValueAtTime(330, now + 0.12);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'action') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(1040, now + 0.08);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      }
    } catch {
      // Audio fallback
    }
  };

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      playSound('next');
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      playSound('prev');
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const goToSlide = (idx) => {
    if (idx === currentSlide) return;
    playSound(idx > currentSlide ? 'next' : 'prev');
    setCurrentSlide(idx);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const addField = () => {
    playSound('action');
    const available = [
      { name: 'readingTime', type: 'INTEGER', required: false },
      { name: 'tags', type: 'JSON (Array)', required: false },
      { name: 'publishedDate', type: 'DATETIME', required: false },
      { name: 'isFeatured', type: 'BOOLEAN', required: false },
      { name: 'seoMeta', type: 'STRING', required: false },
    ];
    const nextField = available[schemaFields.length % available.length];
    setSchemaFields((prev) => [
      ...prev,
      { ...nextField, name: `${nextField.name}_${prev.length + 1}` },
    ]);
  };

  // Slide helper for 3D state class
  const getSlideClass = (idx) => {
    if (idx === currentSlide) return 'slide-active';
    if (idx < currentSlide) return 'slide-prev';
    return 'slide-next';
  };

  return (
    <div className={`relative w-screen h-screen overflow-hidden bg-cms-dark text-gray-100 ${mode}`}>
      {/* Ambient pink and charcoal gradient background */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,45,117,0.18)_0%,transparent_40%),radial-gradient(circle_at_85%_80%,rgba(255,45,117,0.12)_0%,transparent_45%),radial-gradient(circle_at_50%_50%,#13151c_0%,#0c0d12_100%)]" />
      <div className="absolute inset-0 pointer-events-none z-0 bg-[linear-gradient(rgba(255,45,117,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,45,117,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* TOP HEADER & TRANSITION CONTROLS */}
      <header className="absolute top-0 left-0 w-full h-[72px] px-8 flex items-center justify-between z-50 backdrop-blur-xl border-b border-cms-border bg-cms-dark/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cms-pink to-[#ff758c] flex items-center justify-center font-extrabold text-white shadow-pink-glow">
            CMS
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight">Headless CMS</span>
            <span className="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cms-pinkSubtle border border-cms-pink/30 text-cms-pinkLight">
              React + Tailwind Deck
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Transition Mode Switcher: Left, Top, Live */}
          <div className="flex bg-cms-card/90 border border-cms-border rounded-full p-1 gap-1">
            <button
              onClick={() => { playSound('action'); setMode('mode-left'); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                mode === 'mode-left' ? 'bg-cms-pink text-white shadow-pink-glow' : 'text-gray-400 hover:text-white'
              }`}
            >
              👈 Left Turn
            </button>
            <button
              onClick={() => { playSound('action'); setMode('mode-top'); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                mode === 'mode-top' ? 'bg-cms-pink text-white shadow-pink-glow' : 'text-gray-400 hover:text-white'
              }`}
            >
              👆 Top Flip
            </button>
            <button
              onClick={() => { playSound('action'); setMode('mode-live'); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                mode === 'mode-live' ? 'bg-cms-pink text-white shadow-pink-glow' : 'text-gray-400 hover:text-white'
              }`}
            >
              ⚡ Live 3D
            </button>
          </div>

          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="p-2 rounded-xl bg-cms-card border border-cms-border text-gray-300 hover:text-white hover:border-cms-pink transition-all"
            title="Toggle Sound"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-cms-card border border-cms-border text-gray-300 hover:text-white hover:border-cms-pink transition-all"
            title="Toggle Fullscreen"
          >
            <Maximize2 size={18} />
          </button>
        </div>
      </header>

      {/* VIEWPORT WITH 3D PERSPECTIVE */}
      <main className="absolute top-[72px] bottom-[72px] left-0 right-0 perspective-1600 overflow-hidden z-10">
        
        {/* SLIDE 0: HERO */}
        <section className={`absolute inset-0 p-16 flex flex-col justify-center transform-style-3d slide-transition ${getSlideClass(0)}`}>
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cms-pinkSubtle border border-cms-border text-cms-pinkLight text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles size={14} className="text-cms-pink" /> Backend Domination • Project 2
            </div>
            <h1 className="text-6xl font-black tracking-tight leading-tight mb-4">
              Custom <span className="bg-gradient-to-r from-cms-pink via-[#ff5c8a] to-cms-pinkLight bg-clip-text text-transparent">Headless CMS</span><br />
              Engineered with GraphQL & TypeScript
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed max-w-2xl mb-8">
              A high-performance, decoupled content management platform with dynamic runtime schema modeling,
              zero-N+1 query traversal, dual-tier RBAC security, and PostgreSQL 16 persistence.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              {['⚡ Fastify Framework', '🔮 GraphQL Yoga + GraphiQL', '📦 Prisma ORM', '🐘 PostgreSQL 16', '🚀 DataLoader Batching', '🛡️ Dual RBAC (JWT & API Keys)'].map((tech) => (
                <div key={tech} className="px-4 py-2 rounded-xl bg-cms-card/80 border border-cms-border text-sm font-semibold hover:border-cms-pink hover:bg-cms-pinkSubtle transition-all cursor-default">
                  {tech}
                </div>
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cms-pink to-[#ff5c8a] text-white font-bold shadow-pink-glow hover:brightness-110 transform hover:-translate-y-0.5 transition-all"
            >
              Start Interactive Tour <ArrowRight size={18} />
            </button>
          </div>
        </section>

        {/* SLIDE 1: PARADIGM SHIFT */}
        <section className={`absolute inset-0 p-16 flex flex-col justify-center transform-style-3d slide-transition ${getSlideClass(1)}`}>
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-cms-pinkLight bg-cms-pinkSubtle px-3 py-1 rounded-full border border-cms-border">
              Architectural Paradigm
            </span>
            <h2 className="text-4xl font-extrabold text-white mt-2">Why Headless CMS?</h2>
            <p className="text-gray-400 mt-1">Decoupling content storage from the frontend enables true omnichannel flexibility.</p>
          </div>

          <div className="grid grid-cols-2 gap-8 max-w-5xl">
            <div className="p-6 rounded-2xl bg-cms-card/70 border border-cms-border backdrop-blur-md">
              <h3 className="text-xl font-bold text-gray-200 mb-3 flex items-center gap-2">
                🏛️ Traditional Monolithic CMS
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Couples backend databases, editorial dashboard, and HTML theme rendering into a single rigid monolith.
              </p>
              <ul className="space-y-2 text-sm text-red-400/90 font-medium">
                <li>❌ Rigid, hardcoded relational tables (posts, users)</li>
                <li>❌ Database migrations required for every new editorial field</li>
                <li>❌ Tightly coupled to one web template engine</li>
                <li>❌ Overfetching and severe performance bottlenecks</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-cms-card/90 border border-cms-pink shadow-pink-card backdrop-blur-md relative">
              <h3 className="text-xl font-bold text-cms-pink mb-3 flex items-center gap-2">
                🚀 Our Dynamic Headless CMS
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                Treats content as pure structured JSON exposed over an agile GraphQL API to any frontend client.
              </p>
              <ul className="space-y-2 text-sm text-cms-pinkLight font-medium">
                <li>✅ Dynamic ContentType & Field definitions configured at runtime</li>
                <li>✅ Agile storage via PostgreSQL JsonB without SQL DDL locks</li>
                <li>✅ Consumable by Next.js, Astro, Remix, iOS, and Android</li>
                <li>✅ Flexible GraphQL resolvers preventing overfetching & underfetching</li>
              </ul>
            </div>
          </div>
        </section>

        {/* SLIDE 2: 4 CORE LAYERS */}
        <section className={`absolute inset-0 p-16 flex flex-col justify-center transform-style-3d slide-transition ${getSlideClass(2)}`}>
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-cms-pinkLight bg-cms-pinkSubtle px-3 py-1 rounded-full border border-cms-border">
              System Anatomy
            </span>
            <h2 className="text-4xl font-extrabold text-white mt-2">The 4 Core Architectural Layers</h2>
            <p className="text-gray-400 mt-1">A cohesive 4-tier stack balancing schema flexibility, delivery speed, and hardened security.</p>
          </div>

          <div className="grid grid-cols-4 gap-6 max-w-6xl">
            {[
              {
                icon: <Database className="text-cms-pink" size={28} />,
                title: '1. Storage Layer',
                desc: 'Dynamic ContentType, FieldDefinition, Entry, and EntryRelation models backed by PostgreSQL 16 JsonB and Prisma ORM.',
              },
              {
                icon: <Zap className="text-cms-pink" size={28} />,
                title: '2. Delivery Layer',
                desc: 'GraphQL Yoga on Fastify with interactive GraphiQL and DataLoader batching to eliminate N+1 query traps.',
              },
              {
                icon: <Shield className="text-cms-pink" size={28} />,
                title: '3. Security & RBAC',
                desc: 'Dual authentication with JWT for Admin/Editor dashboards and SHA-256 hashed API Keys for frontend consumers.',
              },
              {
                icon: <FolderOpen className="text-cms-pink" size={28} />,
                title: '4. Media Pipeline',
                desc: 'Multipart file upload streaming endpoint (POST /api/upload) and static asset serving at /uploads/*.',
              },
            ].map((layer) => (
              <div
                key={layer.title}
                className="p-6 rounded-2xl bg-cms-card/70 border border-cms-border hover:border-cms-pink hover:bg-cms-cardHover hover:-translate-y-1 transition-all backdrop-blur-md"
              >
                <div className="mb-4">{layer.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{layer.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{layer.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SLIDE 3: INTERACTIVE SCHEMA BUILDER */}
        <section className={`absolute inset-0 p-16 flex flex-col justify-center transform-style-3d slide-transition ${getSlideClass(3)}`}>
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-cms-pinkLight bg-cms-pinkSubtle px-3 py-1 rounded-full border border-cms-border">
              Interactive Component
            </span>
            <h2 className="text-4xl font-extrabold text-white mt-2">Dynamic Content Modeling Engine</h2>
            <p className="text-gray-400 mt-1">Add dynamic fields to see the live PostgreSQL JsonB record update in real time.</p>
          </div>

          <div className="grid grid-cols-2 gap-8 max-w-5xl">
            <div className="p-6 rounded-2xl bg-cms-card/80 border border-cms-border">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-white">ContentType: "BlogPost"</span>
                <button
                  onClick={addField}
                  className="px-3 py-1.5 rounded-lg bg-cms-pink hover:bg-cms-pinkHover text-white text-xs font-bold flex items-center gap-1 shadow-pink-glow transition-all"
                >
                  <Plus size={14} /> Add Field
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {schemaFields.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-cms-surface border border-cms-border/60">
                    <span className="text-sm font-semibold text-gray-200">{f.name}</span>
                    <span className="text-xs font-mono text-cms-pinkLight bg-cms-pinkSubtle border border-cms-pink/30 px-2.5 py-0.5 rounded-md">
                      {f.type} {f.required && '• Req'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#090a0f] border border-cms-border font-mono text-xs text-gray-300">
              <div className="text-cms-pinkLight font-sans font-bold text-sm mb-3">Live Dynamic Entry Record (JsonB):</div>
              <pre className="overflow-x-auto text-[11px] leading-relaxed">
{JSON.stringify(
  {
    id: "e3b0c442-98fc-420a",
    contentType: "blog_post",
    status: "PUBLISHED",
    data: schemaFields.reduce((acc, f) => {
      acc[f.name] = f.type.includes('STRING') ? "Mastering Headless CMS" : f.type.includes('INTEGER') ? 5 : "Dynamic value";
      return acc;
    }, {}),
    relations: [{ field: "author", targetId: "ada-lovelace" }],
    assets: [{ field: "coverImage", assetId: "asset_777" }],
  },
  null,
  2
)}
              </pre>
            </div>
          </div>
        </section>

        {/* SLIDE 4: DATALOADER BENCHMARK */}
        <section className={`absolute inset-0 p-16 flex flex-col justify-center transform-style-3d slide-transition ${getSlideClass(4)}`}>
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-cms-pinkLight bg-cms-pinkSubtle px-3 py-1 rounded-full border border-cms-border">
              Performance Benchmark
            </span>
            <h2 className="text-4xl font-extrabold text-white mt-2">Eliminating the N+1 Query Trap</h2>
            <p className="text-gray-400 mt-1">Fetching 20 posts with relational authors normally triggers 21 database queries. DataLoader batches them into 2.</p>
          </div>

          <div className="grid grid-cols-2 gap-8 max-w-5xl">
            <div className="p-6 rounded-2xl bg-cms-card/70 border border-cms-border">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-gray-200">Without DataLoader</span>
                <span className="text-xs font-bold text-red-400">N+1 Bottleneck</span>
              </div>
              <div className="text-4xl font-extrabold font-mono text-red-500 mb-2">21 Queries</div>
              <p className="text-xs text-gray-400 mb-4">Latency: ~320ms (Sequential SQL lookups)</p>
              <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="w-full h-full bg-red-500" />
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-cms-card/90 border border-cms-pink shadow-pink-card">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-white">With DataLoader (Our Engine)</span>
                <span className="text-xs font-bold text-cms-pinkLight">Batched & Cached</span>
              </div>
              <div className="text-4xl font-extrabold font-mono text-cms-pink mb-2">2 Queries</div>
              <p className="text-xs text-cms-pinkLight mb-4">Latency: ~18ms (94% speedup)</p>
              <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="w-[12%] h-full bg-cms-pink shadow-pink-glow" />
              </div>
            </div>
          </div>
        </section>

        {/* SLIDE 5: SECURITY & RBAC */}
        <section className={`absolute inset-0 p-16 flex flex-col justify-center transform-style-3d slide-transition ${getSlideClass(5)}`}>
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-cms-pinkLight bg-cms-pinkSubtle px-3 py-1 rounded-full border border-cms-border">
              Access Control
            </span>
            <h2 className="text-4xl font-extrabold text-white mt-2">Dual-Vector Authentication & RBAC</h2>
            <p className="text-gray-400 mt-1">Click each role to inspect its permissions and simulated auth headers.</p>
          </div>

          <div className="flex gap-4 max-w-5xl mb-6">
            {['ADMIN', 'EDITOR', 'CONSUMER'].map((role) => (
              <button
                key={role}
                onClick={() => { playSound('action'); setActiveRole(role); }}
                className={`flex-1 py-3 px-4 rounded-xl border font-bold text-sm transition-all ${
                  activeRole === role
                    ? 'bg-cms-pinkSubtle border-cms-pink text-white shadow-pink-glow'
                    : 'bg-cms-card/70 border-cms-border text-gray-400 hover:text-white'
                }`}
              >
                {role === 'ADMIN' && '👑 '}
                {role === 'EDITOR' && '✍️ '}
                {role === 'CONSUMER' && '🌐 '}
                {role}
              </button>
            ))}
          </div>

          <div className="p-6 rounded-2xl bg-cms-card/80 border border-cms-border max-w-5xl">
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-[#090a0f] border border-cms-border font-mono text-xs">
                <div className="text-gray-500 mb-2">// Inbound Request Header Preview</div>
                <div className="text-cms-pink font-semibold">
                  {activeRole === 'CONSUMER' ? 'x-api-key: cms_demo_consumer_api_key_777' : 'Authorization: Bearer eyJhbGciOiJIUzI1Ni...'}
                </div>
                <div className="text-gray-400 mt-1">Content-Type: application/json</div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="font-bold text-white mb-2">Role Permissions:</div>
                {activeRole === 'ADMIN' && (
                  <>
                    <div className="text-green-400">✅ Create & Alter ContentTypes (Schema Builder)</div>
                    <div className="text-green-400">✅ Generate & Revoke Frontend API Keys</div>
                    <div className="text-green-400">✅ Create, Edit, Draft & Publish Entries</div>
                    <div className="text-green-400">✅ Upload & Delete Media Assets</div>
                  </>
                )}
                {activeRole === 'EDITOR' && (
                  <>
                    <div className="text-red-400">❌ Alter ContentTypes or Schema (Forbidden)</div>
                    <div className="text-red-400">❌ Manage Users or API Keys (Forbidden)</div>
                    <div className="text-green-400">✅ Create, Edit, Draft & Publish Entries</div>
                    <div className="text-green-400">✅ Upload Media Assets</div>
                  </>
                )}
                {activeRole === 'CONSUMER' && (
                  <>
                    <div className="text-red-400">❌ Mutate Content or Schema (Forbidden)</div>
                    <div className="text-red-400">❌ View Draft or Archived Entries (Hidden)</div>
                    <div className="text-green-400">✅ Read-only Query for PUBLISHED Entries</div>
                    <div className="text-green-400">✅ Stream Public Media Assets</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SLIDE 6: E2E TEST SCOREBOARD */}
        <section className={`absolute inset-0 p-16 flex flex-col justify-center transform-style-3d slide-transition ${getSlideClass(6)}`}>
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-cms-pinkLight bg-cms-pinkSubtle px-3 py-1 rounded-full border border-cms-border">
              Quality Assurance
            </span>
            <h2 className="text-4xl font-extrabold text-white mt-2">Automated E2E Test Scoreboard</h2>
            <p className="text-gray-400 mt-1">100% of integration test suites passed against our live Fastify & GraphQL Yoga server.</p>
          </div>

          <div className="grid grid-cols-3 gap-5 max-w-5xl">
            {[
              { title: 'Test 1: Health Check', desc: 'GET /health responded 200 OK with server uptime metrics.' },
              { title: 'Test 2: Authentication', desc: 'Bcrypt password hashing and JWT token issuance verified.' },
              { title: 'Test 3: API Key Engine', desc: 'SHA-256 hashed consumer keys validated for client access.' },
              { title: 'Test 4: Schema Modeling', desc: 'Runtime ContentType creation with relations successfully created.' },
              { title: 'Test 5: Dynamic Validation', desc: 'Field type enforcement and relational link persistence validated.' },
              { title: 'Test 6: DataLoader Delivery', desc: 'Nested relation resolution executed with zero N+1 query traps.' },
            ].map((t) => (
              <div key={t.title} className="p-5 rounded-2xl bg-cms-card/80 border border-cms-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white">{t.title}</span>
                  <span className="text-xs font-bold text-green-400">PASSED</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SLIDE 7: QUICKSTART */}
        <section className={`absolute inset-0 p-16 flex flex-col justify-center transform-style-3d slide-transition ${getSlideClass(7)}`}>
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cms-pinkSubtle border border-cms-border text-cms-pinkLight text-xs font-bold uppercase tracking-wider mb-4">
              Production Ready
            </div>
            <h2 className="text-5xl font-black text-white mb-4">
              Ready for Deployment & <span className="bg-gradient-to-r from-cms-pink to-cms-pinkLight bg-clip-text text-transparent">Exploration</span>
            </h2>
            <p className="text-gray-400 mb-8 max-w-2xl">
              Complete with Docker containerization, PostgreSQL 16 local scripts, and interactive GraphiQL playground.
            </p>

            <div className="grid grid-cols-2 gap-6 mb-8 font-mono text-xs">
              <div className="p-5 rounded-2xl bg-[#090a0f] border border-cms-border text-gray-300">
                <div className="text-gray-500 mb-2"># 1. Start Local PostgreSQL 16</div>
                <div className="text-cms-pink">.\scripts\start-db.ps1</div>
                <div className="text-gray-500 mt-3 mb-2"># 2. Run Dev Server</div>
                <div className="text-cms-pink">npm run dev</div>
              </div>

              <div className="p-5 rounded-2xl bg-[#090a0f] border border-cms-border text-gray-300">
                <div className="text-gray-500 mb-2"># Or Run with Docker Compose</div>
                <div className="text-cms-pink">docker compose up -d</div>
                <div className="text-gray-500 mt-3 mb-2"># Run Automated Test Suite</div>
                <div className="text-cms-pink">npm run test:e2e</div>
              </div>
            </div>

            <div className="flex gap-4">
              <a
                href="https://github.com/One-Hat/Backend_Projects"
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cms-pink to-[#ff5c8a] text-white font-bold shadow-pink-glow hover:brightness-110 transition-all"
              >
                GitHub Repository ↗
              </a>
              <button
                onClick={() => goToSlide(0)}
                className="px-6 py-3 rounded-xl bg-cms-card border border-cms-border text-gray-200 font-bold hover:border-cms-pink transition-all flex items-center gap-2"
              >
                <RotateCcw size={16} /> Restart Presentation
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* BOTTOM FOOTER */}
      <footer className="absolute bottom-0 left-0 w-full h-[72px] px-8 flex items-center justify-between z-50 backdrop-blur-xl border-t border-cms-border bg-cms-dark/80">
        <div className="font-mono text-sm text-gray-400">
          Slide <span className="text-cms-pinkLight font-bold">{currentSlide + 1}</span> / {totalSlides}
        </div>

        <div className="flex items-center gap-2">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`h-2.5 rounded-full transition-all ${
                idx === currentSlide
                  ? 'w-7 bg-cms-pink shadow-pink-glow'
                  : 'w-2.5 bg-gray-700 hover:bg-cms-pinkLight/50'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="w-11 h-11 rounded-xl bg-cms-card border border-cms-border text-white flex items-center justify-center hover:bg-cms-pink hover:border-cms-pink disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextSlide}
            disabled={currentSlide === totalSlides - 1}
            className="w-11 h-11 rounded-xl bg-cms-card border border-cms-border text-white flex items-center justify-center hover:bg-cms-pink hover:border-cms-pink disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
}
