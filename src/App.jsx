import { useState, useEffect, useRef } from 'react'
import './App.css'

// Element emoji mapping
const ELEMENT_EMOJI = {
  Fire: '🔥',
  Water: '💧',
  Earth: '🌍',
  Ice: '❄️',
  Lightning: '⚡',
  Dark: '🌑',
  Holy: '✨',
  null: '❓'
}

// Fixed server (no selection)
const SERVER_ID = 'global'

// EP to level mapping
const EP_LEVELS = {
  7: 1, 9: 1,
  12: 2, 13: 2, 15: 2, 17: 2, 19: 2,
  22: 3, 24: 3, 26: 3, 28: 3,
  32: 4, 34: 4, 36: 4, 38: 4,
  44: 5, 46: 5, 48: 5,
  52: 6, 53: 6, 55: 6, 57: 6, 59: 6,
  62: 7, 64: 7, 66: 7, 68: 7,
  70: 8, 71: 8, 72: 8, 73: 8, 74: 8,
  75: 9, 76: 9, 77: 9, 78: 9, 79: 9,
  80: 10, 81: 10, 82: 10, 83: 10,
  85: 11, 86: 11, 87: 11, 88: 11, 89: 11,
  90: 12, 91: 12, 92: 12, 93: 12,
  95: 13, 98: 13, 101: 13, 103: 13,
  105: 14, 107: 14, 109: 14, 111: 14, 113: 14,
  115: 15, 118: 15, 120: 15, 123: 15
}

// EP descriptions
const EP_INFO = {
  1: { levels: [7, 9], count: 2 },
  2: { levels: [12, 13, 15, 17, 19], count: 5 },
  3: { levels: [22, 24, 26, 28], count: 4 },
  4: { levels: [32, 34, 36, 38], count: 4 },
  5: { levels: [44, 46, 48], count: 3 },
  6: { levels: [52, 53, 55, 57, 59], count: 5 },
  7: { levels: [62, 64, 66, 68], count: 4 },
  8: { levels: [70, 71, 72, 73, 74], count: 6 },
  9: { levels: [75, 76, 77, 78, 79], count: 5 },
  10: { levels: [80, 81, 82, 83], count: 4 },
  11: { levels: [85, 86, 87, 88, 89], count: 5 },
  12: { levels: [90, 91, 92, 93], count: 4 },
  13: { levels: [95, 98, 101, 103], count: 4 },
  14: { levels: [105, 107, 109, 111, 113], count: 5 },
  15: { levels: [115, 118, 120, 123], count: 4 }
}

// Parse spawn time string to minutes
function parseSpawnToMinutes(spawn) {
  if (!spawn) return null
  const match = spawn.match(/(\d+)h\s*(\d+)?m?|(\d+)m/)
  if (match) {
    const hours = parseInt(match[1]) || 0
    const mins = parseInt(match[2] || match[3]) || 0
    return hours * 60 + mins
  }
  return null
}

// Format countdown timer
function formatTime(ms) {
  if (!ms || ms <= 0 || isNaN(ms)) return 'ALIVE'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Get EP from level
function getEP(level) {
  return EP_LEVELS[level] || null
}

function App() {
  const [bosses, setBosses] = useState([])
  const [kills, setKills] = useState({})
  const [customSpawns, setCustomSpawns] = useState({})
  const [showKillModal, setShowKillModal] = useState(null)
  const [selectedChannel, setSelectedChannel] = useState(1)
  const [respawnHour, setRespawnHour] = useState('')
  const [respawnMinute, setRespawnMinute] = useState('')

  const [selectedEPs, setSelectedEPs] = useState(Object.keys(EP_INFO).map(Number))
  const [selectedBosses, setSelectedBosses] = useState([])
  const [showFilter, setShowFilter] = useState(false)
  const [showBossFilter, setShowBossFilter] = useState(false)
  const [bossSearch, setBossSearch] = useState('')
  const [now, setNow] = useState(Date.now())
  const intervalRef = useRef(null)

  // Load bosses data
  useEffect(() => {
    fetch('/data/bosses.json')
      .then(r => r.json())
      .then(data => setBosses(data))
  }, [])

  // Update timer every second
  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(intervalRef.current)
  }, [])

  // Load kills and custom spawns from localStorage
  useEffect(() => {
    const savedKills = {}
    const savedSpawns = {}
    const savedSelectedBosses = localStorage.getItem('selectedBosses')
    bosses.forEach(b => {
      // Load custom spawn defaults
      const spawnKey = `spawn_${b.map_lv}_${b.name}`
      const storedSpawn = localStorage.getItem(spawnKey)
      if (storedSpawn) savedSpawns[`${b.map_lv}_${b.name}`] = storedSpawn

      // Load kills
      for (let ch = 1; ch <= Math.max(b.channels, 3); ch++) {
        const key = `kill_${b.map_lv}_${b.name}_ch${ch}`
        const stored = localStorage.getItem(key)
        if (stored) savedKills[`${b.map_lv}_${b.name}_ch${ch}`] = JSON.parse(stored)
      }
    })
    setKills(savedKills)
    setCustomSpawns(savedSpawns)
    if (savedSelectedBosses) {
      setSelectedBosses(JSON.parse(savedSelectedBosses))
    }
  }, [bosses])

  // Get spawn time for a boss (custom or default)
  const getSpawnMins = (boss) => {
    const customKey = `${boss.map_lv}_${boss.name}`
    const customSpawn = customSpawns[customKey]
    if (customSpawn) {
      const parsed = parseSpawnToMinutes(customSpawn)
      if (parsed) return parsed
    }
    return parseSpawnToMinutes(boss.spawn)
  }

  // Calculate boss + channel status
  const getChannelStatus = (boss, channel) => {
    const killKey = `${boss.map_lv}_${boss.name}_ch${channel}`
    const kill = kills[killKey]
    const spawnMins = getSpawnMins(boss)

    if (!kill || !spawnMins || !kill.respawnAt) {
      return { hasKill: false, remaining: null, isAlive: false, isWarning: false }
    }

    const respawnAt = kill.respawnAt
    const remaining = respawnAt - now
    const isAlive = remaining <= 0
    const isWarning = remaining > 0 && remaining <= 60000

    return { hasKill: true, remaining, respawnAt, isAlive, isWarning, spawnMins }
  }

  // Build expanded list with channel
  const expandedBosses = []
  bosses.forEach(b => {
    let maxChannel = 1
    for (let ch = 1; ch <= 5; ch++) {
      if (kills[`${b.map_lv}_${b.name}_ch${ch}`]) {
        maxChannel = Math.max(maxChannel, ch)
      }
    }
    for (let ch = 1; ch <= maxChannel; ch++) {
      expandedBosses.push({ ...b, channel: ch })
    }
  })

  // Filter by selected EPs and selected bosses
  const filteredBosses = expandedBosses.filter(b => {
    const epMatch = selectedEPs.includes(getEP(b.map_lv))
    const bossMatch = selectedBosses.length === 0 || selectedBosses.includes(`${b.map_lv}_${b.name}`)
    return epMatch && bossMatch
  })

  // Sort
  const sortedBosses = [...filteredBosses].sort((a, b) => {
    const statusA = getChannelStatus(a, a.channel)
    const statusB = getChannelStatus(b, b.channel)

    if (!statusA.hasKill && !statusB.hasKill) return a.map_lv - b.map_lv
    if (!statusA.hasKill) return 1
    if (!statusB.hasKill) return -1

    if (statusA.isAlive && !statusB.isAlive) return -1
    if (!statusA.isAlive && statusB.isAlive) return 1

    return statusA.remaining - statusB.remaining
  })

  // Toggle EP
  const toggleEP = (ep) => {
    setSelectedEPs(prev =>
      prev.includes(ep)
        ? prev.length > 1 ? prev.filter(e => e !== ep) : prev
        : [...prev, ep].sort((a, b) => a - b)
    )
  }

  const selectAllEPs = () => setSelectedEPs(Object.keys(EP_INFO).map(Number))
  const selectNoEPs = () => setSelectedEPs([1])

  // Toggle boss selection
  const toggleBoss = (bossKey) => {
    const newSelection = selectedBosses.includes(bossKey)
      ? selectedBosses.filter(b => b !== bossKey)
      : [...selectedBosses, bossKey]
    setSelectedBosses(newSelection)
    localStorage.setItem('selectedBosses', JSON.stringify(newSelection))
  }

  const selectAllBosses = () => {
    setSelectedBosses([])
    localStorage.setItem('selectedBosses', JSON.stringify([]))
  }

  const selectVisibleBosses = () => {
    const visible = filteredBosses.map(b => `${b.map_lv}_${b.name}`)
    setSelectedBosses(visible)
    localStorage.setItem('selectedBosses', JSON.stringify(visible))
  }

  // Search filtered bosses for display in filter dropdown
  const bossListForFilter = bosses
    .filter(b => selectedEPs.includes(getEP(b.map_lv)))
    .filter(b => {
      const key = `${b.map_lv}_${b.name}`
      const search = bossSearch.toLowerCase()
      return key.toLowerCase().includes(search) || b.name.toLowerCase().includes(search) || b.map.toLowerCase().includes(search)
    })
    .sort((a, b) => a.map_lv - b.map_lv)


  const openKillModal = (boss, channel) => {
    setSelectedChannel(channel)
    setRespawnHour('')
    setRespawnMinute('')

    setShowKillModal({ ...boss, _channel: channel })
  }

  // Record kill
  const handleKill = (boss) => {
    const spawnMins = getSpawnMins(boss) || 60
    let respawnAt

    const inputHours = parseInt(respawnHour) || 0
    const inputMinutes = parseInt(respawnMinute) || 0

    if (inputHours > 0 || inputMinutes > 0) {
      const totalMs = (inputHours * 60 * 60 * 1000) + (inputMinutes * 60 * 1000)
      respawnAt = Date.now() + totalMs

      const newSpawn = `${inputHours}h ${inputMinutes}m`.trim()
      const spawnStorageKey = `spawn_${boss.map_lv}_${boss.name}`
      localStorage.setItem(spawnStorageKey, newSpawn)
      setCustomSpawns(prev => ({ ...prev, [`${boss.map_lv}_${boss.name}`]: newSpawn }))
    } else {
      respawnAt = Date.now() + spawnMins * 60 * 1000
    }

    const killTime = respawnAt - spawnMins * 60 * 1000
    const killKey = `${boss.map_lv}_${boss.name}_ch${selectedChannel}`
    const killData = { killTime, respawnAt }

    setKills(prev => ({ ...prev, [killKey]: killData }))

    const storageKey = `kill_${killKey}`
    localStorage.setItem(storageKey, JSON.stringify(killData))

    setShowKillModal(null)
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <img src="/logo.png" alt="TG Labs" className="logo-img" />
            <div>
              <h1>TG Labs</h1>
              <p>Boss Spawn Tracker</p>
            </div>
          </div>
          <div className="header-actions">
            <span className="live-indicator">● LIVE</span>
          </div>
        </div>
      </header>

      {/* Filter Row */}
      <div className="filter-row">
        {/* EP Filter */}
        <div className="filter-container">
          <button
            className={`filter-toggle ${showFilter ? 'active' : ''}`}
            onClick={() => { setShowFilter(!showFilter); setShowBossFilter(false); }}
          >
            🎯 EP {selectedEPs.length < 13 ? `(${selectedEPs.length})` : ''}
          </button>

          {showFilter && (
            <div className="filter-dropdown">
              <div className="filter-header">
                <span>เลือก EP:</span>
                <div className="filter-quick">
                  <button onClick={selectAllEPs}>ทั้งหมด</button>
                  <button onClick={selectNoEPs}>ล้าง</button>
                </div>
              </div>
              <div className="ep-checkboxes">
                {Object.entries(EP_INFO).map(([ep, info]) => (
                  <label key={ep} className={`ep-checkbox ${selectedEPs.includes(Number(ep)) ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedEPs.includes(Number(ep))}
                      onChange={() => toggleEP(Number(ep))}
                    />
                    <span className="ep-label">EP {ep}</span>
                    <span className="ep-count">Lv.{info.levels.join(',')}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Boss Filter */}
        <div className="filter-container">
          <button
            className={`filter-toggle ${showBossFilter ? 'active' : ''}`}
            onClick={() => { setShowBossFilter(!showBossFilter); setShowFilter(false); }}
          >
            👹 Boss {selectedBosses.length > 0 ? `(${selectedBosses.length})` : '(ทั้งหมด)'}
          </button>

          {showBossFilter && (
            <div className="filter-dropdown boss-dropdown">
              <div className="filter-header">
                <span>เลือกบอสที่ต้องการ:</span>
                <div className="filter-quick">
                  <button onClick={selectAllBosses}>ทั้งหมด</button>
                  <button onClick={selectVisibleBosses}>ตาม EP</button>
                </div>
              </div>
              <input
                type="text"
                placeholder="🔍 ค้นหาบอส..."
                value={bossSearch}
                onChange={e => setBossSearch(e.target.value)}
                className="boss-search"
              />
              <div className="boss-list">
                {bossListForFilter.map(b => {
                  const key = `${b.map_lv}_${b.name}`
                  const isSelected = selectedBosses.includes(key)
                  return (
                    <label key={key} className={`boss-item ${isSelected ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleBoss(key)}
                      />
                      <span className="boss-lv">Lv.{b.map_lv}</span>
                      <span className="boss-name">{b.name}</span>
                      <span className="boss-map">{b.map}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Boss Count */}
      <div className="boss-count">
        แสดง {sortedBosses.length} บอส {selectedBosses.length > 0 ? `(${selectedBosses.length} ที่เลือก)` : '(ทั้งหมด)'}
      </div>

      {/* Boss List */}
      <main className="boss-list">
        {sortedBosses.map((boss, idx) => {
          const status = getChannelStatus(boss, boss.channel)
          const displaySpawn = customSpawns[`${boss.map_lv}_${boss.name}`] || boss.spawn
          const bossKey = `${boss.map_lv}_${boss.name}_ch${boss.channel}`

          return (
            <div
              key={bossKey}
              className={`boss-card ${status.isAlive ? 'alive' : ''} ${status.isWarning ? 'warning' : ''}`}
            >
              <div className="boss-top">
                <div className="boss-badges">
                  <span className="boss-level">Lv.{boss.map_lv}</span>
                  <span className="boss-channel">Ch.{boss.channel}</span>
                  <span className="boss-ep">EP.{getEP(boss.map_lv)}</span>
                </div>
                <span className="boss-element">
                  {ELEMENT_EMOJI[boss.element] || '❓'} {boss.element}
                </span>
              </div>

              <h3 className="boss-name">{boss.name}</h3>
              <p className="boss-map">📍 {boss.map}</p>

              <div className="boss-footer">
                <span className="boss-spawn">
                  ⏱ {displaySpawn || 'กดกำหนดเอง'}
                </span>

                {status.hasKill && !status.isAlive ? (
                  <div className={`countdown ${status.isWarning ? 'warning' : ''}`}>
                    {formatTime(status.remaining)}
                  </div>
                ) : (
                  <button
                    className={`kill-btn ${status.isAlive ? 'alive' : ''}`}
                    onClick={() => openKillModal(boss, boss.channel)}
                  >
                    💀 Kill
                  </button>
                )}
              </div>




            </div>
          )
        })}
      </main>

      {/* Kill Modal */}
      {showKillModal && (
        <div className="modal-overlay" onClick={() => setShowKillModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>💀 Record Kill</h2>
            <p className="modal-boss">{showKillModal.name}</p>
            <p className="modal-channel">📺 Channel {selectedChannel}</p>
            <p className="modal-map">📍 {showKillModal.map}</p>
            <p className="modal-spawn">⏱ Default: {showKillModal.spawn || 'ยังไม่มี default'}</p>



            {/* Channel Selector */}
            <div className="kill-time-input">
              <p className="kill-time-label">📺 Channel</p>
              <div className="channel-selector">
                {[1, 2, 3, 4, 5].map(ch => (
                  <button
                    key={ch}
                    className={`channel-btn ${selectedChannel === ch ? 'active' : ''}`}
                    onClick={() => setSelectedChannel(ch)}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            {/* Respawn Time Input */}
            <div className="kill-time-input">
              <p className="kill-time-label">⏰ บอสจะเกิดอีกกี่ชั่วโมง/นาที (ถ้าว่าง = ใช้ default)</p>
              <div className="kill-time-fields">
                <div className="kill-time-field">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={respawnHour}
                    onChange={e => setRespawnHour(e.target.value)}
                    placeholder="0"
                    className="kill-time-input-field"
                  />
                  <span className="kill-time-unit">ชม.</span>
                </div>
                <div className="kill-time-field">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={respawnMinute}
                    onChange={e => setRespawnMinute(e.target.value)}
                    placeholder="0"
                    className="kill-time-input-field"
                  />
                  <span className="kill-time-unit">นาที</span>
                </div>
              </div>
              {respawnHour !== '' || respawnMinute !== '' ? (
                <p className="kill-time-hint">
                  ⏰ บอสจะเกิดอีก {respawnHour || 0} ชม. {respawnMinute || 0} นาที (จะถูกบันทึกเป็น default ใหม่)
                </p>
              ) : (
                <p className="kill-time-hint">
                  ⏰ ใช้ default: {showKillModal.spawn || '1 ชม.'}
                </p>
              )}
            </div>

            <div className="modal-actions">
              <button
                className="btn-record"
                onClick={() => handleKill(showKillModal)}
              >
                💀 Confirm Kill
              </button>
              <button
                className="btn-cancel"
                onClick={() => setShowKillModal(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
