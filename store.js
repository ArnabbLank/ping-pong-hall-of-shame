// Data layer. Same interface in both modes:
//   mode, onPlayers(cb, onErr), onMatches(cb, onErr), addPlayer(p), addMatch(m), deleteMatch(id, passcode)
// Rows handed to the page use: players {id,name,emoji,createdAt}, matches {id,date,aId,bId,aScore,bScore,target,createdAt}
(function () {
  const cfg = window.PP_CONFIG || {};
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));

  function demoStore() {
    const K = 'pp-demo-v1';
    let db = { players: [], matches: [] };
    try { db = JSON.parse(localStorage.getItem(K)) || db; } catch (e) {}
    const subs = { players: [], matches: [] };
    const save = () => { try { localStorage.setItem(K, JSON.stringify(db)); } catch (e) {} };
    const emit = (t) => subs[t].forEach((cb) => cb(db[t].slice()));
    const on = (t) => (cb) => { subs[t].push(cb); setTimeout(() => cb(db[t].slice()), 0); };
    return {
      mode: 'demo',
      onPlayers: on('players'),
      onMatches: on('matches'),
      async addPlayer(p) { db.players.push({ id: uid(), name: p.name, emoji: p.emoji, createdAt: Date.now() }); save(); emit('players'); },
      async addMatch(m) { db.matches.push(Object.assign({ id: uid(), createdAt: Date.now() }, m)); save(); emit('matches'); },
      async deleteMatch(id) { db.matches = db.matches.filter((m) => m.id !== id); save(); emit('matches'); }
    };
  }

  function supabaseStore(sb) {
    const toPlayer = (r) => ({ id: r.id, name: r.name, emoji: r.emoji, createdAt: Date.parse(r.created_at) });
    const toMatch = (r) => ({ id: r.id, date: r.played_on, aId: r.a_id, bId: r.b_id, aScore: r.a_score, bScore: r.b_score, target: r.target, createdAt: Date.parse(r.created_at) });
    function watch(table, map, cb, onErr) {
      const load = async () => {
        const { data, error } = await sb.from(table).select('*').order('created_at', { ascending: true }).limit(5000);
        if (error) { onErr && onErr(error); return; }
        cb(data.map(map));
      };
      load();
      sb.channel('pp-' + table).on('postgres_changes', { event: '*', schema: 'public', table }, load).subscribe();
    }
    return {
      mode: 'supabase',
      onPlayers: (cb, e) => watch('players', toPlayer, cb, e),
      onMatches: (cb, e) => watch('matches', toMatch, cb, e),
      async addPlayer(p) { const { error } = await sb.from('players').insert({ name: p.name, emoji: p.emoji }); if (error) throw error; },
      async addMatch(m) {
        const { error } = await sb.from('matches').insert({ played_on: m.date, a_id: m.aId, b_id: m.bId, a_score: m.aScore, b_score: m.bScore, target: m.target });
        if (error) throw error;
      },
      async deleteMatch(id, passcode) {
        const { data, error } = await sb.rpc('delete_match', { match_id: id, passcode: passcode || '' });
        if (error) throw error;
        if (data !== true) throw new Error('bad_passcode');
      }
    };
  }

  window.PPStore = {
    async create() {
      if (cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase) {
        return supabaseStore(window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey));
      }
      return demoStore();
    }
  };
})();
