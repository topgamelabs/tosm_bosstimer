import json

# Raw boss data
raw = """7,Siauliai Miners Village,Cowardly Red Bube Warrior,Fire,1h 46m
9,Crystal Mine,Strong Spector Lord,Earth,30m
12,Nefritas Cliff,Strong Throne Weaver,Insect,null
13,Tanet Garden,Strong Nephentes,Plant,null
15,Tanet Church B1F,Cowardly Cyclops,Demon,null
17,Tanet Church 1F,Strong Malletwywern,Aberration,Dark,2h 20m
19,Tanet Church 2F,Strong Necrovanter,Demon,Dark,1h 45m
22,Dadan Jungle,Strong Iltiswort,Plant,Earth,1h 40m
24,Novaha Assembly Hall,Cowardly Mummygust,Aberration,Ice,2h 20m
26,Novaha Annex,Strong Velniamonkey,Beast,Holy,2h 20m
28,Novaha Institute,Indignant Deathweaver,Demon,null
32,Cobal Forrest,Cowardly Clymen,Plant,null
34,Septyni Glen,Strong Mothtem,Insect,null
36,Pelke Shine Ruins,Strong Tutu,Beast,Ice,2h
38,Absenta Reservoir,Indignant Hydra,Aberration,Ice,4h
44,Delmore Hamlet,Cowardly Reaverpede,Insect,Earth,1h 40m
46,Delmor Manor,Strong Grinender,Plant,Fire,2h 10m
48,Delmore Outskirt,Indignant Red Rambandage Demonas,Demon,null
52,Uskis Arable Land,Strong Taumas,Beast,Earth,null
53,Spring Light Woods,Cowardly Manticen,Insect,Lightning,2h 10m
55,Gate Route,Strong Chafer,Insect,null
57,Sirdgela Forest,Strong Archon,Demon,null
59,Kvailas Forest,Indignant Bramble,Plant,Earth,4h 40m
62,Zacharial Crossroads,Cowardly Vearkaras,Aberration,null
64,Royal Mausoleum 1F,Strong Thumlord,Aberration,null
66,Royal Mausoleum 2F,Strong Gorkas,Aberration,Lightning,1h 50m
68,Royal Mausoleum 3F,Angry Rexipher,Aberration,Dark,4h 40m
70,Baron Allerno,Cowardly Scorpio,Insect,Fire,2h
70,Aqueduct Bridge Area,Strong Corrupted,Aberration,null
71,Demon Prison District 1,Strong Blood,Plant,Earth,1h 50m
72,Demon Prison District 3,Cowardly Nuaele,Holy,2h
73,Demon Prison District 4,Strong Dionysus,Beast,Holy,2h 20m
74,Demon Prison District 5,Angry Demon Lord Hauberk,Beast,Earth,null
75,Goddess Ancient Garden,Strong Chapparition,Demon,Dark,2h 20m
76,Fedimain Suburbs,Cowardly Devilglove,Aberration,Ice,1h 40m
77,Mage Tower 1F,Strong Salamander,Beast,Fire,2h 20m
78,Mage Tower 2F,Strong Mineloader,Aberration,null
79,Mage Tower 3F,Indignant Helga Sircle,Demon,Earth,4h 20m
80,Penitance Route,Cowardly Glackuman,Beast,Earth,1h 50m
81,Main Building,Strong Fireload,Beast,null
82,Grand Corridor,Strong Riteris,Aberration,Lightning,1h 50m
83,Santuary,Indignant Naktis,Demon,null
85,Laukyme Swamp,Cowardly Gaigalas,Beast,null
86,Tyla Monastery,Strong Teraox,Beast,Dark,1h 10m
87,Bellai RainForest,Strong Ferretmarauder,Insect,Ice,1h
88,Zeraha,Strong Kirmeleech,Insect,Earth,1h
89,Seir Rainforest,Indignant Zaura,Demon,null
90,Coastal Fortress,Strong Stone Whale,Aberration,Lightning,2h
91,Dingofasil District,Strong Minotaurs,Beast,Dark,1h 40m
92,Storage Quarter,Strong Sitrygailla,Insect,Earth,1h 14m
93,Fortress Battlegrounds,Indignant Marnox,Beast,Fire,4h 40m
95,Alemeth Forest,Strong Colimencia,Plant,Holy,2h 20m
98,Barha Forest,Strong Sequoia,Aberration,Earth,1h 50m
101,Kalegimas Lounge,Strong Neop,Insect,Fire,2h
103,Investigation Room,Indignant Nebulas,Demon,Ice,4h 45m
105,Nheto Forest,Strong Dionia,Plant,Dark,null
107,Svalphinghas Forest,Strong Ellaganos,Demon,null
109,Lhadar Forest,Strong Ebonyphone,Demon,null
111,Tevhrin Stalactite Cave 1,Strong Gazing Golem,Construct,null
113,Tevhrin Stalactite Cave 2,Indignant Zesty of Destruction,Demon,null
115,Jonael Memorial Dist.,Strong Ironbaum,Construct,null
118,Jeromel Square,Strong Diena,Demon,null
120,Taniel I Memorial Dist.,Strong Ginklass,Construct,null
123,Timerys Temple,Indignant Algis,Demon,null"""

bosses = []
for line in raw.strip().split('\n'):
    parts = line.split(',')
    map_lv = int(parts[0])
    map_name = parts[1]
    name = parts[2]
    
    # Find element and spawn
    element = None
    spawn = None
    channels = 1
    
    # Parse remaining parts
    i = 3
    while i < len(parts):
        p = parts[i].strip()
        if p in ['Fire', 'Water', 'Earth', 'Ice', 'Lightning', 'Dark', 'Holy']:
            element = p
        elif p in ['Plant', 'Insect', 'Beast', 'Demon', 'Aberration', 'Construct']:
            # race, skip
            pass
        elif 'Hr' in p or 'hr' in p or 'min' in p or 'Min' in p:
            spawn = p.replace('Hr', 'h').replace('hr', 'h').replace('Min', 'm').replace('min', 'm')
            # Determine channels from spawn format if present
        i += 1
    
    # Set channels based on level ranges (common patterns)
    if map_lv in [12, 24, 26, 38, 59, 66, 68, 73, 79, 82, 93, 103]:
        channels = 2
    
    boss = {
        "map_lv": map_lv,
        "map": map_name,
        "name": name,
        "element": element or "null",
        "spawn": spawn,
        "channels": channels
    }
    bosses.append(boss)

# Sort by map_lv
bosses.sort(key=lambda x: x['map_lv'])

with open('bosses.json', 'w', encoding='utf-8') as f:
    json.dump(bosses, f, indent=2, ensure_ascii=False)

print(f"Generated {len(bosses)} bosses")
