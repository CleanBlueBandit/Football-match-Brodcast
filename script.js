(function() {
  const STATE_URL = 'state.json';
  const SAVE_URL = 'save_state.php';

  function getDefaultState() {
    return {
      match: {
        homeTeam: "HOME", awayTeam: "AWAY", homeScore: 0, awayScore: 0,
        time: 0, isRunning: false, addedTime: 0, homeFouls: 0, awayFouls: 0,
        homePossession: 50, awayPossession: 50, homeFormation: "4-3-3", awayFormation: "4-4-2"
      },
      players: { home: [], away: [] },
      overlays: {
        goal: { visible: false, team: "", scorer: "", assist: "", number: "", assistNumber: "" },
        possession: false, fouls: false,
        card: { visible: false, player: "", type: "", team: "", number: "" },
        sub: { visible: false, out: "", in: "", team: "", outNumber: "", inNumber: "" },
        var: { visible: false, phase: "", checkType: "", verdict: "" },
        formations: false, table: false, goalHistory: false,
        offside: false, advantage: false, penaltyCall: false, handball: false, replay: false
      },
      goals: [], table: []
    };
  }

  let state = getDefaultState();

  // --- SERVER SYNC LOGIC ---

  async function saveState() {
    try {
      await fetch(SAVE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
    } catch (e) {
      console.error('Failed to save state to server:', e);
    }
  }

  async function syncFromServer() {
    try {
      const response = await fetch(STATE_URL + '?t=' + Date.now());
      if (response.ok) {
        const serverState = await response.json();
        if (JSON.stringify(serverState) !== JSON.stringify(state)) {
          state = serverState;
          
          // Sanitize complex objects
          if (state.overlays) {
            if (typeof state.overlays.var !== 'object') {
              state.overlays.var = { visible: !!state.overlays.var, phase: '', checkType: '', verdict: '' };
            } else {
              state.overlays.var.visible = !!state.overlays.var.visible;
              state.overlays.var.phase = state.overlays.var.phase || '';
              state.overlays.var.checkType = state.overlays.var.checkType || '';
              state.overlays.var.verdict = state.overlays.var.verdict || '';
            }
          }
          
          if (document.body.id === 'tv-page') renderTV();
          else if (document.body.id === 'control-page') renderControl();
        }
      }
    } catch (e) { 
      // Fails silently if file doesn't exist yet
    }
  }

  // --- DATA LOADING ---

  function loadStandings() {
    fetch('standings.json').then(r => r.json()).then(data => {
      state.table = data; saveState();
    }).catch(e => console.error('Failed to load standings:', e));
  }

  function loadPlayers() {
    fetch('players.json').then(r => r.json()).then(data => {
      state.players.home = data.home || [];
      state.players.away = data.away || [];
      saveState();
    }).catch(e => console.error('Failed to load players:', e));
  }

  // --- UTILITIES ---

  function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return m + ':' + s;
  }

  const FORMATIONS = {
    "4-3-3": [{t:85,l:50},{t:65,l:15},{t:65,l:38},{t:65,l:62},{t:65,l:85},{t:40,l:20},{t:40,l:50},{t:40,l:80},{t:15,l:20},{t:15,l:50},{t:15,l:80}],
    "4-4-2": [{t:85,l:50},{t:65,l:15},{t:65,l:38},{t:65,l:62},{t:65,l:85},{t:40,l:12},{t:40,l:37},{t:40,l:63},{t:40,l:88},{t:15,l:35},{t:15,l:65}],
    "3-5-2": [{t:85,l:50},{t:65,l:25},{t:65,l:50},{t:65,l:75},{t:40,l:12},{t:40,l:31},{t:40,l:50},{t:40,l:69},{t:40,l:88},{t:15,l:35},{t:15,l:65}],
    "5-4-1": [{t:85,l:50},{t:65,l:10},{t:65,l:30},{t:65,l:50},{t:65,l:70},{t:65,l:90},{t:40,l:15},{t:40,l:38},{t:40,l:62},{t:40,l:85},{t:15,l:50}]
  };

  // --- GLOBAL CONTROL EXPORTS (RESTORED) ---
  
  window.toggleTimer = function() { state.match.isRunning = !state.match.isRunning; saveState(); updateTimerDisplay(); };
  window.resetTimer = function() { state.match.isRunning = false; state.match.time = 0; saveState(); updateTimerDisplay(); };
  
  window.modScore = function(team, delta) {
    if (team === 'home') state.match.homeScore = Math.max(0, state.match.homeScore + delta);
    else state.match.awayScore = Math.max(0, state.match.awayScore + delta);
    saveState(); updateScoreDisplay();
  };

  window.updateStat = function(key, value) {
    if (key === 'addedTime') state.match.addedTime = parseInt(value) || 0;
    if (key === 'homeFouls') state.match.homeFouls = parseInt(value) || 0;
    if (key === 'awayFouls') state.match.awayFouls = parseInt(value) || 0;
    if (key === 'homeFormation') state.match.homeFormation = value;
    if (key === 'awayFormation') state.match.awayFormation = value;
    saveState();
  };

  window.addPlayer = function(team) {
    var name = document.getElementById('add-' + team + '-name').value.trim();
    var num = parseInt(document.getElementById('add-' + team + '-num').value);
    if (!name || isNaN(num)) return alert('Enter name and number');
    state.players[team].push({ name: name, number: num });
    saveState(); renderPlayerLists(); populateGoalSelects(); populatePlayers('card'); populatePlayers('sub');
  };

  window.removePlayer = function(team, idx) {
    state.players[team].splice(idx, 1);
    saveState(); renderPlayerLists(); populateGoalSelects(); populatePlayers('card'); populatePlayers('sub');
  };

  window.triggerGoal = function() {
    var sParts = document.getElementById('goal-scorer').value.split('|');
    var aParts = document.getElementById('goal-assist').value ? document.getElementById('goal-assist').value.split('|') : ['', ''];
    var team = document.getElementById('goal-team').value;
    state.match[team + 'Score'] += 1;
    state.overlays.goal = { visible: true, team: state.match[team + 'Team'], scorer: sParts[1], number: sParts[0], assist: aParts[1], assistNumber: aParts[0] };
    state.goals.push({ scorer: sParts[1], minute: state.match.time, team: team });
    saveState(); updateScoreDisplay();
  };

  window.triggerVarCheck = function() {
    state.overlays.var = { visible: true, phase: 'checking', checkType: document.getElementById('var-check-type').value, verdict: '' };
    saveState();
  };

  window.showVarVerdict = function() {
    state.overlays.var.phase = 'verdict';
    state.overlays.var.verdict = document.getElementById('var-verdict').value;
    saveState();
  };

  window.clearVarGraphic = function() {
    state.overlays.var.visible = false;
    saveState();
  };

  window.quickRefCall = function(type) {
    state.overlays[type] = true; saveState();
    setTimeout(() => { state.overlays[type] = false; saveState(); }, 3000);
  };

  window.hideOverlay = function(type) {
    if (state.overlays[type] && typeof state.overlays[type] === 'object') state.overlays[type].visible = false;
    else state.overlays[type] = false;
    saveState(); updateToggleButtons();
  };

  window.populatePlayers = function(context) {
    var plist = state.players[document.getElementById(context + '-team').value];
    if (!plist) return;
    var opts = plist.map(p => '<option value="' + p.number + '|' + p.name + '">' + p.number + ' ' + p.name + '</option>').join('');
    ['player', 'out', 'in'].forEach(target => {
      var el = document.getElementById(context + '-' + target);
      if (el) el.innerHTML = opts;
    });
  };

  window.triggerCard = function() {
    var parts = document.getElementById('card-player').value.split('|');
    state.overlays.card = { visible: true, player: parts[1], type: document.getElementById('card-type').value, team: state.match[document.getElementById('card-team').value + 'Team'], number: parts[0] };
    saveState();
  };

  window.triggerSub = function() {
    var outP = document.getElementById('sub-out').value.split('|');
    var inP = document.getElementById('sub-in').value.split('|');
    state.overlays.sub = { visible: true, out: outP[1], in: inP[1], team: state.match[document.getElementById('sub-team').value + 'Team'], outNumber: outP[0], inNumber: inP[0] };
    saveState();
  };

  window.updatePossession = function() {
    state.match.homePossession = parseInt(document.getElementById('inp-home-poss').value) || 0;
    state.match.awayPossession = parseInt(document.getElementById('inp-away-poss').value) || 0;
    saveState();
  };

  window.toggleOverlay = function(key) {
    if (state.overlays[key] && typeof state.overlays[key] === 'object') state.overlays[key].visible = !state.overlays[key].visible;
    else state.overlays[key] = !state.overlays[key];
    saveState(); updateToggleButtons();
  };

  // --- EVENT LISTENERS & HELPERS ---

  document.addEventListener('input', function(e) {
    if (e.target.id === 'inp-home-name') { state.match.homeTeam = e.target.value; saveState(); populateGoalSelects(); }
    if (e.target.id === 'inp-away-name') { state.match.awayTeam = e.target.value; saveState(); populateGoalSelects(); }
  });

  document.getElementById('goal-team')?.addEventListener('change', populateGoalSelects);

  function populateGoalSelects() {
    var s = document.getElementById('goal-scorer');
    var a = document.getElementById('goal-assist');
    if (!s) return;
    var teamEl = document.getElementById('goal-team');
    var teamValue = teamEl ? teamEl.value : 'home';
    var plist = (teamValue === 'home' ? state.players.home : state.players.away);
    var opts = plist.map(p => '<option value="' + p.number + '|' + p.name + '">' + p.number + ' ' + p.name + '</option>').join('');
    s.innerHTML = opts;
    if (a) a.innerHTML = '<option value="">-- None --</option>' + opts;
  }

  function renderPlayerLists() {
    ['home','away'].forEach(t => {
      var el = document.getElementById('list-' + t);
      if(el) {
        el.innerHTML = state.players[t].map((p, i) => '<li><span>' + p.number + ' ' + p.name + '</span><button class="btn" onclick="removePlayer(\'' + t + '\',' + i + ')">Remove</button></li>').join('');
      }
    });
  }

  function updateTimerDisplay() {
    var el = document.getElementById('ctrl-timer');
    if(el) el.textContent = formatTime(state.match.time);
    var btn = document.getElementById('btn-start');
    if(btn) btn.textContent = state.match.isRunning ? 'Pause' : 'Start';
  }

  function updateScoreDisplay() {
    var h = document.getElementById('ctrl-home-score');
    var a = document.getElementById('ctrl-away-score');
    if(h) h.textContent = state.match.homeScore;
    if(a) a.textContent = state.match.awayScore;
  }

  function updateToggleButtons() {
    var map = { possession: 'btn-possession', fouls: 'btn-fouls', table: 'btn-table', formations: 'btn-formations', goalHistory: 'btn-goal-history', var: 'btn-var', replay: 'btn-replay' };
    for (var key in map) {
      var btn = document.getElementById(map[key]);
      if (!btn) continue;
      var overlayVal = state.overlays[key];
      var active = typeof overlayVal === 'object' ? !!overlayVal.visible : !!overlayVal;
      btn.style.background = active ? 'var(--accent)' : '';
      btn.style.color = active ? 'var(--primary)' : '';
    }
  }

  // --- RENDER LOGIC ---

  function renderControl() {
    var ids = {
      'inp-home-name': state.match.homeTeam,
      'inp-away-name': state.match.awayTeam,
      'inp-home-formation': state.match.homeFormation,
      'inp-away-formation': state.match.awayFormation,
      'inp-added': state.match.addedTime,
      'inp-home-fouls': state.match.homeFouls,
      'inp-away-fouls': state.match.awayFouls,
      'inp-home-poss': state.match.homePossession,
      'inp-away-poss': state.match.awayPossession
    };
    for (var id in ids) { 
      var el = document.getElementById(id); 
      if (el) el.value = ids[id]; 
    }
    updateTimerDisplay();
    updateScoreDisplay();
    renderPlayerLists();
    populateGoalSelects();
    if(document.getElementById('card-team')) populatePlayers('card');
    if(document.getElementById('sub-team')) populatePlayers('sub');
    updateToggleButtons();
  }

  function renderPitch(containerId, formation, players, colorVar) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '<div class="center-spot"></div>';
    var positions = FORMATIONS[formation] || FORMATIONS['4-3-3'];
    positions.forEach((pos, idx) => {
      var dot = document.createElement('div');
      dot.className = 'player-dot';
      dot.style.top = pos.t + '%';
      dot.style.left = pos.l + '%';
      dot.style.background = colorVar;
      var pl = players[idx];
      dot.textContent = pl ? pl.number : idx + 1;
      if (pl) {
        var label = document.createElement('div');
        label.className = 'player-label';
        label.textContent = pl.name;
        dot.appendChild(label);
      }
      container.appendChild(dot);
    });
  }

  function renderTV() {
    document.getElementById('sb-home-name').textContent = state.match.homeTeam;
    document.getElementById('sb-away-name').textContent = state.match.awayTeam;
    document.getElementById('sb-home-score').textContent = state.match.homeScore;
    document.getElementById('sb-away-score').textContent = state.match.awayScore;
    document.getElementById('sb-time').textContent = formatTime(state.match.time);

    var anyOverlayActive = (state.overlays.goal && state.overlays.goal.visible) || state.overlays.possession || state.overlays.fouls || (state.overlays.card && state.overlays.card.visible) || (state.overlays.sub && state.overlays.sub.visible) || (state.overlays.var && state.overlays.var.visible) || state.overlays.formations || state.overlays.table || state.overlays.goalHistory || state.overlays.offside || state.overlays.advantage || state.overlays.penaltyCall || state.overlays.handball || state.overlays.replay;
    
    var shrinkScorebug;
    if (state.match.addedTime > 0) {
      shrinkScorebug = anyOverlayActive;
    } else {
      shrinkScorebug = (state.overlays.var && state.overlays.var.visible) || (state.overlays.card && state.overlays.card.visible) || state.overlays.formations || state.overlays.table || state.overlays.offside || state.overlays.advantage || state.overlays.penaltyCall || state.overlays.handball || state.overlays.replay;
    }

    var scorebugEl = document.getElementById('scorebug');
    var homeScoreEl = document.getElementById('sb-home-score');
    var awayScoreEl = document.getElementById('sb-away-score');
    if (!shrinkScorebug) {
      scorebugEl.classList.add('scorebug-big');
      homeScoreEl.classList.add('scorebug-score-big');
      awayScoreEl.classList.add('scorebug-score-big');
    } else {
      scorebugEl.classList.remove('scorebug-big');
      homeScoreEl.classList.remove('scorebug-score-big');
      awayScoreEl.classList.remove('scorebug-score-big');
    }

    var addEl = document.getElementById('sb-added');
    var externalTimeEl = document.getElementById('external-time');
    var externalAddedEl = document.getElementById('external-added');
    if (!anyOverlayActive && state.match.addedTime > 0) {
        addEl.style.display = 'none';
        externalTimeEl.style.display = 'flex';
        externalAddedEl.textContent = '+' + state.match.addedTime;
    } else {
        externalTimeEl.style.display = 'none';
        if (state.match.addedTime > 0) {
            addEl.textContent = '+' + state.match.addedTime;
            addEl.style.display = 'inline';
        } else {
            addEl.style.display = 'none';
        }
    }

    var g = document.getElementById('goal-overlay');
    if (state.overlays.goal.visible) {
      document.getElementById('g-team').textContent = state.overlays.goal.team;
      document.getElementById('g-scorer').textContent = (state.overlays.goal.number ? '#' + state.overlays.goal.number + ' ' : '') + state.overlays.goal.scorer;
      document.getElementById('g-assist').textContent = state.overlays.goal.assist ? 'Assist: ' + (state.overlays.goal.assistNumber ? '#' + state.overlays.goal.assistNumber + ' ' : '') + state.overlays.goal.assist : '';
      g.classList.add('active');
    } else g.classList.remove('active');

    var p = document.getElementById('possession-overlay');
    if (state.overlays.possession) {
      document.getElementById('p-home').style.width = state.match.homePossession + '%';
      document.getElementById('p-away').style.width = state.match.awayPossession + '%';
      document.getElementById('p-home-text').textContent = state.match.homeTeam + ' ' + state.match.homePossession + '%';
      document.getElementById('p-away-text').textContent = state.match.awayPossession + '% ' + state.match.awayTeam;
      p.classList.add('active');
    } else p.classList.remove('active');

    var f = document.getElementById('fouls-overlay');
    if (state.overlays.fouls) {
      document.getElementById('f-home-name').textContent = state.match.homeTeam;
      document.getElementById('f-away-name').textContent = state.match.awayTeam;
      document.getElementById('f-home-val').textContent = state.match.homeFouls;
      document.getElementById('f-away-val').textContent = state.match.awayFouls;
      f.classList.add('active');
    } else f.classList.remove('active');

    var c = document.getElementById('card-overlay');
    if (state.overlays.card.visible) {
      document.getElementById('c-team').textContent = state.overlays.card.team;
      document.getElementById('c-player').textContent = (state.overlays.card.number ? '#' + state.overlays.card.number + ' ' : '') + state.overlays.card.player;
      document.getElementById('c-type').textContent = state.overlays.card.type + ' card';
      document.getElementById('c-icon').className = 'card-icon ' + (state.overlays.card.type === 'red' ? 'card-red' : 'card-yellow');
      c.classList.add('active');
    } else c.classList.remove('active');

    var s = document.getElementById('sub-overlay');
    if (state.overlays.sub.visible) {
      document.getElementById('s-out').textContent = (state.overlays.sub.outNumber ? '#' + state.overlays.sub.outNumber + ' ' : '') + state.overlays.sub.out;
      document.getElementById('s-in').textContent = (state.overlays.sub.inNumber ? '#' + state.overlays.sub.inNumber + ' ' : '') + state.overlays.sub.in;
      document.getElementById('s-team').textContent = state.overlays.sub.team;
      s.classList.add('active');
    } else s.classList.remove('active');

    var varEl = document.getElementById('var-overlay');
    if (state.overlays.var && state.overlays.var.visible) {
      varEl.classList.add('active');
      var varInner = document.getElementById('var-inner');
      var varMain = document.getElementById('var-main');
      var varSub = document.getElementById('var-sub');
      var checkType = state.overlays.var.checkType;
      var verdict = state.overlays.var.verdict;
      
      varInner.classList.remove('checking', 'verdict', 'confirmed', 'overturned');
      
      if (state.overlays.var.phase === 'checking') {
        varInner.classList.add('checking');
        if (varMain) varMain.textContent = 'VAR CHECK IN PROGRESS';
        if (varSub) varSub.textContent = 'Checking ' + (checkType || '');
      } else if (state.overlays.var.phase === 'verdict') {
        varInner.classList.add('verdict');
        if (varSub) varSub.textContent = checkType || '';
        
        switch (verdict) {
          case 'Offside':
            varMain.textContent = (checkType === 'Goal') ? 'NO GOAL - OFFSIDE' : 'OFFSIDE';
            varInner.classList.add('overturned');
            break;
          case 'Foul':
            if (checkType === 'Goal') varMain.textContent = 'NO GOAL - FOUL';
            else if (checkType === 'Penalty') varMain.textContent = 'NO PENALTY - FOUL';
            else if (checkType === 'Red Card') { varMain.textContent = 'RED CARD CONFIRMED - FOUL'; varInner.classList.add('confirmed'); }
            else if (checkType === 'Foul') { varMain.textContent = 'FOUL CONFIRMED'; varInner.classList.add('confirmed'); }
            else varMain.textContent = 'FOUL';
            if (!varInner.classList.contains('confirmed')) varInner.classList.add('overturned');
            break;
          case 'No Penalty':
            varMain.textContent = (checkType === 'Penalty') ? 'NO PENALTY' : 'OVERTURNED';
            varInner.classList.add(checkType === 'Penalty' ? 'confirmed' : 'overturned');
            break;
          case 'Overturned':
            varInner.classList.add('overturned');
            if (checkType === 'Goal') varMain.textContent = 'NO GOAL';
            else if (checkType === 'Penalty') varMain.textContent = 'NO PENALTY';
            else if (checkType === 'Red Card') varMain.textContent = 'NO RED CARD';
            else if (checkType === 'Identity') varMain.textContent = 'IDENTITY MISTAKE OVERTURNED';
            else if (checkType === 'Foul') varMain.textContent = 'NO FOUL';
            break;
          case 'Confirmed':
            varInner.classList.add('confirmed');
            if (checkType === 'Goal') varMain.textContent = 'GOAL CONFIRMED';
            else if (checkType === 'Penalty') varMain.textContent = 'PENALTY GIVEN';
            else if (checkType === 'Red Card') varMain.textContent = 'RED CARD CONFIRMED';
            else if (checkType === 'Identity') varMain.textContent = 'IDENTITY MISTAKE CONFIRMED';
            else if (checkType === 'Foul') varMain.textContent = 'FOUL CONFIRMED';
            break;
        }
      }
    } else {
      varEl.classList.remove('active');
    }

    var fm = document.getElementById('formations-overlay');
    if (state.overlays.formations) {
      document.getElementById('f-home-title').textContent = state.match.homeTeam;
      document.getElementById('f-away-title').textContent = state.match.awayTeam;
      renderPitch('formation-home', state.match.homeFormation, state.players.home, 'var(--home-color)');
      renderPitch('formation-away', state.match.awayFormation, state.players.away, 'var(--away-color)');
      fm.classList.add('active');
    } else fm.classList.remove('active');

    var t = document.getElementById('table-overlay');
    if (state.overlays.table) {
      var tBody = document.getElementById('table-body');
      if (tBody && state.table) {
        tBody.innerHTML = state.table.map(r => '<tr><td>' + r.pos + '</td><td>' + r.team + '</td><td>' + r.p + '</td><td>' + r.pts + '</td></tr>').join('');
      }
      t.classList.add('active');
    } else t.classList.remove('active');

    var gh = document.getElementById('goal-history-overlay');
    if (state.overlays.goalHistory) {
      document.getElementById('gh-home-team').textContent = state.match.homeTeam;
      document.getElementById('gh-away-team').textContent = state.match.awayTeam;
      document.getElementById('goal-history-home').innerHTML = state.goals.filter(g => g.team === 'home').map(g => g.scorer + ', \'' + g.minute + '.').join('<br>') || '<div style="color:#888;">No goals</div>';
      document.getElementById('goal-history-away').innerHTML = state.goals.filter(g => g.team === 'away').map(g => g.scorer + ', \'' + g.minute + '.').join('<br>') || '<div style="color:#888;">No goals</div>';
      gh.classList.add('active');
    } else gh.classList.remove('active');

    document.getElementById('offside-overlay')?.classList.toggle('active', !!state.overlays.offside);
    document.getElementById('advantage-overlay')?.classList.toggle('active', !!state.overlays.advantage);
    document.getElementById('penalty-overlay')?.classList.toggle('active', !!state.overlays.penaltyCall);
    document.getElementById('handball-overlay')?.classList.toggle('active', !!state.overlays.handball);
    document.getElementById('replay-overlay')?.classList.toggle('active', !!state.overlays.replay);
  }

  // --- INITIALIZATION ---

  if (document.body.id === 'tv-page') {
    syncFromServer().then(() => {
      loadStandings();
      loadPlayers();
      renderTV();
    });
    setInterval(syncFromServer, 1000);
  } else if (document.body.id === 'control-page') {
    syncFromServer().then(() => {
      loadStandings();
      loadPlayers();
      renderControl();
    });
    setInterval(function() {
      if (state.match.isRunning) {
        state.match.time += 1;
        saveState();
        updateTimerDisplay();
      }
    }, 1000);
  }

})();