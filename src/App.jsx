import { useState, useEffect, useMemo } from "react";

const AREAS = ["すべて", "新宿", "渋谷", "池袋", "銀座", "浅草"];
const GENRES = ["すべて", "ラーメン", "寿司", "居酒屋", "焼肉"];

const AREA_COORDS = {
  新宿: { lat: 35.6938, lng: 139.7034 },
  渋谷: { lat: 35.6580, lng: 139.7016 },
  池袋: { lat: 35.7295, lng: 139.7109 },
  銀座: { lat: 35.6717, lng: 139.7650 },
  浅草: { lat: 35.7147, lng: 139.7967 },
};

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getNearestArea(lat, lng) {
  let nearest = null, minDist = Infinity;
  for (const [area, coords] of Object.entries(AREA_COORDS)) {
    const d = getDistance(lat, lng, coords.lat, coords.lng);
    if (d < minDist) { minDist = d; nearest = area; }
  }
  return nearest;
}

function getGachiLabel(score) {
  if (!score) return { label: "−", color: "#888" };
  if (score >= 75) return { label: "◎ GACHI", color: "#00C896" };
  if (score >= 60) return { label: "○ GOOD", color: "#4A9EFF" };
  if (score >= 45) return { label: "△ OK", color: "#F5A623" };
  return { label: "× MEH", color: "#FF5C5C" };
}

function getContamLabel(flag) {
  if (flag === "操作疑い") return { label: "🚨 Suspicious", color: "#FF5C5C" };
  if (flag === "注意") return { label: "⚠ Caution", color: "#F5A623" };
  if (flag === "正常") return { label: "✓ Clean", color: "#00C896" };
  return { label: "−", color: "#888" };
}

function formatDist(m) {
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

function ScoreBar({ label, value, max = 5, color }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: "#888", letterSpacing: 1, textTransform: "uppercase" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{value?.toFixed(2) ?? "−"}</span>
      </div>
      <div style={{ height: 4, background: "#2a2a2a", borderRadius: 2 }}>
        <div style={{ height: 4, width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

function StoreCard({ store, onClick, userLocation, rank }) {
  const gachi = getGachiLabel(store.ガチ指数);
  const contam = getContamLabel(store.汚染判定);
  const dist = userLocation && store.lat && store.lng ? getDistance(userLocation.lat, userLocation.lng, store.lat, store.lng) : null;
  return (
    <div onClick={() => onClick(store)} style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: "18px 20px", cursor: "pointer", transition: "all 0.2s", position: "relative" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#00C896"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#222"}>
      {rank && <div style={{ position: "absolute", top: 14, right: 14, fontSize: 10, color: "#333", fontWeight: 700 }}>#{rank}</div>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1, marginRight: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6, lineHeight: 1.3 }}>{store.店名}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, background: "#1a1a1a", color: "#888", padding: "2px 8px", borderRadius: 4 }}>{store.エリア}</span>
            <span style={{ fontSize: 11, background: "#1a1a1a", color: "#888", padding: "2px 8px", borderRadius: 4 }}>{store.ジャンル}</span>
            <span style={{ fontSize: 11, color: contam.color, padding: "2px 8px", borderRadius: 4, border: `1px solid ${contam.color}33` }}>{contam.label}</span>
            {dist !== null && <span style={{ fontSize: 11, color: "#555", padding: "2px 8px", borderRadius: 4, background: "#1a1a1a" }}>📍 {formatDist(dist)}</span>}
          </div>
        </div>
        <div style={{ textAlign: "center", minWidth: 64 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: gachi.color, lineHeight: 1 }}>{store.ガチ指数?.toFixed(1) ?? "−"}</div>
          <div style={{ fontSize: 10, color: gachi.color, marginTop: 2, letterSpacing: 0.5 }}>{gachi.label}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ fontSize: 12, color: "#666" }}>食べログ <span style={{ color: "#ccc", fontWeight: 600 }}>{store.食べログスコア?.toFixed(2) ?? "−"}</span></div>
        <div style={{ fontSize: 12, color: "#666" }}>Google <span style={{ color: "#ccc", fontWeight: 600 }}>{store.Google評価?.toFixed(1) ?? "−"}</span></div>
        <div style={{ fontSize: 12, color: "#444" }}>({store.Google件数?.toLocaleString() ?? "−"} reviews)</div>
      </div>
      {store.reviewSummary && (
        <div style={{ marginTop: 10, fontSize: 12, color: "#555", lineHeight: 1.5, borderTop: "1px solid #1a1a1a", paddingTop: 10 }}>
          {store.reviewSummary.slice(0, 100)}…
        </div>
      )}
    </div>
  );
}

function NearbySection({ stores, userLocation, onSelect, genre, setGenre }) {
  const nearby = useMemo(() => {
    if (!userLocation) return [];
    let d = stores.filter(r => r.ガチ指数 && r.lat && r.lng);
    if (genre !== "すべて") d = d.filter(r => r.ジャンル === genre);
    return d.map(r => ({ ...r, _dist: getDistance(userLocation.lat, userLocation.lng, r.lat, r.lng) }))
      .filter(r => r._dist < 2000).sort((a, b) => b.ガチ指数 - a.ガチ指数).slice(0, 3);
  }, [stores, userLocation, genre]);

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#00C896", letterSpacing: 1, textTransform: "uppercase" }}>📍 Near You</div>
        <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>Top gachi spots within 2km</div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {GENRES.map(g => (
          <button key={g} onClick={() => setGenre(g)} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", background: genre === g ? "#00C896" : "#111", color: genre === g ? "#000" : "#666", border: genre === g ? "1px solid #00C896" : "1px solid #222" }}>{g}</button>
        ))}
      </div>
      {nearby.length === 0 ? (
        <div style={{ fontSize: 13, color: "#444", padding: "20px 0", textAlign: "center" }}>No gachi spots found nearby.<br /><span style={{ fontSize: 11 }}>Try a different genre or browse all below.</span></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {nearby.map((store, i) => <StoreCard key={i} store={store} onClick={onSelect} userLocation={userLocation} rank={i + 1} />)}
        </div>
      )}
    </div>
  );
}

function DetailModal({ store, onClose, userLocation }) {
  const gachi = getGachiLabel(store.ガチ指数);
  const contam = getContamLabel(store.汚染判定);
  const dist = userLocation && store.lat && store.lng ? getDistance(userLocation.lat, userLocation.lng, store.lat, store.lng) : null;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const tabelogNote = store.食べログスコア
    ? store.食べログスコア >= 4.0 ? "★★★★★ by locals"
      : store.食べログスコア >= 3.5 ? "★★★★☆ by locals"
      : store.食べログスコア >= 3.0 ? "★★★☆☆ by locals"
      : "★★☆☆☆ by locals"
    : null;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#0d0d0d", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto", padding: "28px 24px 40px", border: "1px solid #222", borderBottom: "none" }}>
        <div style={{ width: 36, height: 4, background: "#333", borderRadius: 2, margin: "0 auto 24px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>{store.店名}</h2>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, background: "#1a1a1a", color: "#888", padding: "3px 10px", borderRadius: 6 }}>{store.エリア}</span>
              <span style={{ fontSize: 12, background: "#1a1a1a", color: "#888", padding: "3px 10px", borderRadius: 6 }}>{store.ジャンル}</span>
              <span style={{ fontSize: 12, color: contam.color, padding: "3px 10px", borderRadius: 6, border: `1px solid ${contam.color}44` }}>{contam.label}</span>
              {dist !== null && <span style={{ fontSize: 12, color: "#555", padding: "3px 10px", borderRadius: 6, background: "#1a1a1a" }}>📍 {formatDist(dist)}</span>}
            </div>
          </div>
          <div style={{ textAlign: "center", minWidth: 72 }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: gachi.color }}>{store.ガチ指数?.toFixed(1) ?? "−"}</div>
            <div style={{ fontSize: 11, color: gachi.color, letterSpacing: 0.5 }}>{gachi.label}</div>
          </div>
        </div>

        <div style={{ background: "#111", borderRadius: 12, padding: "16px 18px", marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#555", letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Score Breakdown</div>
          <ScoreBar label="Tabelog (Local Trust)" value={store.食べログスコア} color="#00C896" />
          {tabelogNote && <div style={{ fontSize: 11, color: "#00C896", marginTop: -6, marginBottom: 10, paddingLeft: 2 }}>= {tabelogNote} (Japanese reviewers are strict)</div>}
          <ScoreBar label="Google Rating" value={store.Google評価} color="#4A9EFF" />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1px solid #1a1a1a" }}>
            <span style={{ fontSize: 11, color: "#555" }}>Tabelog reviews</span>
            <span style={{ fontSize: 12, color: "#666" }}>{store.食べログ口コミ数?.toLocaleString() ?? "−"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 11, color: "#555" }}>Google reviews</span>
            <span style={{ fontSize: 12, color: "#666" }}>{store.Google件数?.toLocaleString() ?? "−"}</span>
          </div>
        </div>

        {store.reviewSummary && (
          <div style={{ background: "#111", borderRadius: 12, padding: "16px 18px", marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#555", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Why trusted by locals</div>
            <p style={{ fontSize: 13, color: "#bbb", lineHeight: 1.7, margin: 0 }}>{store.reviewSummary}</p>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <a href={store.食べログURL} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: "block", textAlign: "center", background: "#00C896", color: "#000", fontWeight: 700, fontSize: 14, padding: "14px", borderRadius: 10, textDecoration: "none", letterSpacing: 0.5 }}>
            View on Tabelog →
          </a>
          <button onClick={onClose} style={{ background: "#1a1a1a", border: "1px solid #333", color: "#888", fontSize: 14, padding: "14px 20px", borderRadius: 10, cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [area, setArea] = useState("すべて");
  const [genre, setGenre] = useState("すべて");
  const [nearbyGenre, setNearbyGenre] = useState("すべて");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [sortBy, setSortBy] = useState("gachi");
  const [userLocation, setUserLocation] = useState(null);
  const [gpsStatus, setGpsStatus] = useState("idle");

  useEffect(() => {
    fetch("/gachi_all.json").then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      setGpsStatus("loading");
      navigator.geolocation.getCurrentPosition(
        pos => {
          const { latitude, longitude } = pos.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setArea(getNearestArea(latitude, longitude));
          setGpsStatus("success");
        },
        () => setGpsStatus("error"),
        { timeout: 8000 }
      );
    }
  }, []);

  const filtered = useMemo(() => {
    let d = data.filter(r => r.ガチ指数);
    if (area !== "すべて") d = d.filter(r => r.エリア === area);
    if (genre !== "すべて") d = d.filter(r => r.ジャンル === genre);
    if (search) d = d.filter(r => r.店名.includes(search) || (r.reviewSummary || "").toLowerCase().includes(search.toLowerCase()));
    if (sortBy === "gachi") d = [...d].sort((a, b) => b.ガチ指数 - a.ガチ指数);
    else if (sortBy === "tabelog") d = [...d].sort((a, b) => (b.食べログスコア ?? 0) - (a.食べログスコア ?? 0));
    else if (sortBy === "google") d = [...d].sort((a, b) => (b.Google評価 ?? 0) - (a.Google評価 ?? 0));
    else if (sortBy === "distance" && userLocation) {
      d = d.filter(r => r.lat && r.lng).map(r => ({ ...r, _dist: getDistance(userLocation.lat, userLocation.lng, r.lat, r.lng) })).sort((a, b) => a._dist - b._dist);
    }
    return d;
  }, [data, area, genre, search, sortBy, userLocation]);

  const filterBtn = (val, current, setter) => (
    <button key={val} onClick={() => setter(val)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", background: current === val ? "#00C896" : "#111", color: current === val ? "#000" : "#666", border: current === val ? "1px solid #00C896" : "1px solid #222" }}>{val}</button>
  );

  return (
    <div style={{ background: "#080808", minHeight: "100vh", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", color: "#fff" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      <div style={{ padding: "24px 20px 0", maxWidth: 600, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: -0.5 }}><span style={{ color: "#00C896" }}>GACHI</span> FINDER</h1>
          <span style={{ fontSize: 12, color: "#444", letterSpacing: 1 }}>TOKYO</span>
          {gpsStatus === "success" && <span style={{ fontSize: 11, color: "#00C896", marginLeft: "auto" }}>📍 Location detected</span>}
          {gpsStatus === "loading" && <span style={{ fontSize: 11, color: "#555", marginLeft: "auto" }}>📍 Detecting...</span>}
        </div>
        <p style={{ fontSize: 13, color: "#555", margin: "0 0 20px", lineHeight: 1.5 }}>Restaurants trusted by locals — not just highly rated</p>

        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or cuisine..." style={{ width: "100%", padding: "12px 16px", borderRadius: 10, fontSize: 14, background: "#111", border: "1px solid #222", color: "#fff", outline: "none", boxSizing: "border-box", marginBottom: 14 }} />

        {userLocation && !search && <NearbySection stores={data} userLocation={userLocation} onSelect={setSelected} genre={nearbyGenre} setGenre={setNearbyGenre} />}

        <div style={{ fontSize: 11, color: "#444", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Browse All</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>{AREAS.map(a => filterBtn(a, area, setArea))}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>{GENRES.map(g => filterBtn(g, genre, setGenre))}</div>

        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 11, color: "#444", letterSpacing: 1 }}>SORT</span>
          {[["gachi", "Gachi"], ["tabelog", "Tabelog"], ["google", "Google"], ...(userLocation ? [["distance", "Distance"]] : [])].map(([val, label]) => (
            <button key={val} onClick={() => setSortBy(val)} style={{ padding: "4px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer", background: sortBy === val ? "#fff" : "transparent", color: sortBy === val ? "#000" : "#555", border: "1px solid #222", fontWeight: sortBy === val ? 700 : 400 }}>{label}</button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#444" }}>{filtered.length} spots</span>
        </div>
      </div>

      <div style={{ padding: "0 20px 40px", maxWidth: 600, margin: "0 auto" }}>
        {loading ? <div style={{ textAlign: "center", color: "#444", padding: 60 }}>Loading...</div> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.slice(0, 50).map((store, i) => <StoreCard key={i} store={store} onClick={setSelected} userLocation={userLocation} />)}
            {filtered.length > 50 && <div style={{ textAlign: "center", fontSize: 12, color: "#444", padding: 20 }}>Showing top 50 of {filtered.length} results</div>}
          </div>
        )}
      </div>

      {selected && <DetailModal store={selected} onClose={() => setSelected(null)} userLocation={userLocation} />}
    </div>
  );
}
