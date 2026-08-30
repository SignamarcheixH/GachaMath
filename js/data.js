/* ============================================================
   DONNÉES — le folklore, les collections, les défis.
   ============================================================ */

/* ---------- nombres cultes ----------
   Là où les maths s'arrêtent, la culture prend le relais.  */
const CULTE = {
  0:     { nom:'Le Vide',                emoji:'🕳️', pts:29, desc:"Il n'a pas été tiré. Il a été forgé. Le gacha ne distribue pas le néant — il faut le fabriquer soi-même." },
  1:     { nom:"L'Unité",                emoji:'☝️', pts:6,  desc:"Ni premier, ni composé. On l'a exclu des premiers par décret, parce qu'il cassait tous les théorèmes." },
  7:     { nom:'Le Chanceux',            emoji:'🍀', pts:5,  desc:"Le nombre préféré de l'humanité, toutes cultures confondues. Les sondages sont formels." },
  12:    { nom:'La Douzaine',            emoji:'🥚', pts:4,  desc:"Le nombre que le système décimal a battu de justesse. Une injustice, disent les duodécimalistes." },
  13:    { nom:'Le Malchanceux',         emoji:'🐈‍⬛', pts:6,  desc:"Des immeubles entiers sautent son étage. C'est pourtant un premier tout à fait respectable." },
  23:    { nom:'Le Complot',             emoji:'👁️', pts:6,  desc:"Tout se ramène à 23 si l'on veut bien s'en donner la peine. C'est précisément le problème." },
  42:    { nom:'La Réponse',             emoji:'🌌', pts:17, desc:"À la Grande Question sur la Vie, l'Univers et le Reste. La question, elle, reste introuvable." },
  64:    { nom:'La Cartouche',           emoji:'🎮', pts:5,  desc:"Le bit qui a marqué une génération." },
  69:    { nom:'Nice',                   emoji:'😎', pts:9,  desc:"Nice." },
  73:    { nom:'Le Meilleur Nombre',     emoji:'🤓', pts:8,  desc:"21e premier, 12 renversé, 7×3=21. Sheldon Cooper y consacre un monologue entier, et il n'a pas tort." },
  88:    { nom:'Le Grand Huit',          emoji:'🎢', pts:4,  desc:"Deux infinis empilés. Ou une DeLorean lancée à 88 mph." },
  100:   { nom:'Le Cent Pour Cent',      emoji:'💯', pts:6,  desc:"L'unité de mesure universelle de l'accomplissement." },
  101:   { nom:"Le Cours d'Intro",       emoji:'🎓', pts:6,  desc:"Palindrome, premier, et titre de tous les cours pour débutants du monde anglophone." },
  108:   { nom:'La Trappe',              emoji:'🏝️', pts:5,  desc:"4 8 15 16 23 42. Il faut saisir la séquence toutes les 108 minutes. Sinon… on ne sait pas." },
  200:   { nom:'OK',                     emoji:'✅', pts:4,  desc:"Tout va bien. Le serveur vous aime." },
  256:   { nom:"L'Octet Plein",          emoji:'🧱', pts:6,  desc:"Le mur contre lequel se sont écrasés des milliers de programmes." },
  300:   { nom:'Les Spartiates',         emoji:'🛡️', pts:4,  desc:"CE SOIR NOUS DÎNERONS AUX ENFERS." },
  314:   { nom:'Presque Pi',             emoji:'🥧', pts:7,  desc:"Assez proche pour l'ingénierie, jamais assez pour un mathématicien." },
  360:   { nom:'Le No-Scope',            emoji:'🎯', pts:6,  desc:"Un tour complet. En degrés comme en réputation." },
  404:   { nom:'Introuvable',            emoji:'🫥', pts:13, desc:"Le nombre qui désigne l'absence. Vous l'avez trouvé. C'est paradoxal." },
  418:   { nom:'Je Suis Une Théière',    emoji:'🫖', pts:14, desc:"Vrai code HTTP, issu d'un poisson d'avril de 1998, défendu depuis avec une ferveur inquiétante." },
  420:   { nom:'Blaze It',               emoji:'🌿', pts:9,  desc:"Aucun commentaire mathématique n'est requis." },
  451:   { nom:'Fahrenheit',             emoji:'🔥', pts:6,  desc:"La température à laquelle le papier s'enflamme. Et un code HTTP pour la censure." },
  500:   { nom:'Erreur Serveur',         emoji:'💥', pts:5,  desc:"Quelque chose s'est mal passé. On ne vous dira pas quoi." },
  555:   { nom:'Le Faux Numéro',         emoji:'☎️', pts:5,  desc:"L'indicatif que Hollywood utilise pour ne jamais faire sonner un vrai téléphone." },
  666:   { nom:'Le Nombre de la Bête',   emoji:'😈', pts:13, desc:"Triangulaire, ce qui est ironique pour un symbole d'infernal désordre." },
  777:   { nom:'Le Jackpot',             emoji:'🎰', pts:9,  desc:"Trois rouleaux alignés. Le gacha vous salue." },
  911:   { nom:"L'Urgence",              emoji:'🚨', pts:5,  desc:"Premier, et le numéro qu'on ne veut jamais composer." },
  999:   { nom:'La Bête Renversée',      emoji:'🙃', pts:7,  desc:"666 debout sur la tête. Ou l'urgence, côté britannique." },
  1000:  { nom:'Le Kilo',                emoji:'⚖️', pts:5,  desc:"Le seuil psychologique de tout." },
  1024:  { nom:'Le Kibi',                emoji:'📀', pts:7,  desc:"Le kilo des informaticiens, qui refusent obstinément de valoir 1000." },
  1234:  { nom:"L'Échauffement",         emoji:'🪜', pts:5,  desc:"La séquence que tout le monde tape au moins une fois." },
  1337:  { nom:'L33T',                   emoji:'🕶️', pts:15, desc:"Premier. Naturellement." },
  1492:  { nom:'La Traversée',           emoji:'⛵', pts:5,  desc:"Une erreur de navigation devenue continent." },
  1789:  { nom:'La Révolution',          emoji:'🗼', pts:6,  desc:"Premier, tronquable par la gauche, et légèrement explosif." },
  1969:  { nom:'Le Petit Pas',           emoji:'🌕', pts:6,  desc:"Un petit pas pour l'homme." },
  1984:  { nom:'La Surveillance',        emoji:'📺', pts:6,  desc:"Big Brother compte vos tirages." },
  2000:  { nom:'Le Bug',                 emoji:'🐛', pts:5,  desc:"L'apocalypse qui n'a pas eu lieu, parce que des milliers de gens ont travaillé tout l'été." },
  2026:  { nom:'Ici et Maintenant',      emoji:'📅', pts:7,  desc:"L'année en cours. Elle ne le restera pas." },
  2718:  { nom:"Le Nombre d'Euler",      emoji:'📈', pts:9,  desc:"e ≈ 2,718. La croissance dans son état le plus pur." },
  3141:  { nom:'Pi Étendu',              emoji:'🥧', pts:8,  desc:"Quatre décimales. Suffisant pour envoyer une sonde sur Mars, en fait." },
  4711:  { nom:"L'Eau de Cologne",       emoji:'🧴', pts:5,  desc:"Le numéro d'une maison de Cologne devenu parfum mondial." },
  5040:  { nom:'Le Nombre de Platon',    emoji:'🏛️', pts:9,  desc:"Platon voulait que sa cité idéale compte exactement 5040 citoyens : il a 60 diviseurs, on peut la découper comme on veut." },
  8008:  { nom:'La Calculatrice',        emoji:'🔢', pts:8,  desc:"Vous savez très bien pourquoi. Retournez l'écran." },
  9001:  { nom:'Plus de 9000',           emoji:'💢', pts:14, desc:"C'EST PLUS DE 9000 !!! (La traduction originale disait 8000. Le mème a tranché.)" },
  9999:  { nom:'Le Plafond',             emoji:'🧗', pts:8,  desc:"Le plus grand nombre que le gacha puisse tirer. Au-delà, il faut forger." },
  12345: { nom:'Le Mot de Passe',        emoji:'🔓', pts:14,  desc:"Le mot de passe d'un idiot sur ses bagages. Introuvable au tirage — il se forge." },
  65535: { nom:'Le Débordement',         emoji:'📉', pts:17, desc:"2¹⁶ − 1. Au-delà, tout recommence à zéro. Demandez à Gandhi." },
  99999: { nom:'La Frontière',           emoji:'🚧', pts:24, desc:"Le plus grand nombre forgeable. Il n'y a rien après. Vraiment rien." },
};

/* ---------- théorèmes : les collections ----------
   Compléter un set débloque un bonus permanent.  */
const COLLECTIONS = [
  { id:'parfaits',   nom:'Les Parfaits',        emoji:'👑', nums:[6,28,496,8128],
    desc:"Les quatre nombres parfaits sous dix mille. Il n'y en aura pas d'autres.",
    bonus:{ type:'dustMult', val:0.30 }, bonusLabel:'+30 % de poussière' },

  { id:'fibo',       nom:'La Suite Dorée',      emoji:'🐚', nums:[1,2,3,5,8,13,21,34,55,89,144,233,377,610,987],
    desc:"Fibonacci jusqu'à 987. Chaque terme porte les deux précédents sur son dos.",
    bonus:{ type:'coinMult', val:0.25 }, bonusLabel:'+25 % de jetons/min' },

  { id:'pow2',       nom:'Les Puissances de Deux', emoji:'💾', nums:[1,2,4,8,16,32,64,128,256,512,1024,2048,4096,8192],
    desc:"De l'unité au huit-mille-cent-quatre-vingt-douze. La colonne vertébrale de toute machine.",
    bonus:{ type:'forgeDiscount', val:0.25 }, bonusLabel:'−25 % sur les aides de la Forge' },

  { id:'pantheon',   nom:'Le Panthéon',         emoji:'🗿', nums:[42,69,404,418,420,666,1337,9001],
    desc:"Aucune propriété mathématique commune. Juste une immense dette culturelle.",
    bonus:{ type:'luck', val:1 }, bonusLabel:'Relance automatique des tirages Communs' },

  { id:'premiers10', nom:'Les Dix Premiers',    emoji:'🔷', nums:[2,3,5,7,11,13,17,19,23,29],
    desc:"Les dix premières briques indivisibles. Tout le reste en découle.",
    bonus:{ type:'coinMult', val:0.20 }, bonusLabel:'+20 % de jetons/min' },

  { id:'carres',     nom:"L'Échiquier",         emoji:'⬛', nums:[1,4,9,16,25,36,49,64,81,100],
    desc:"Les dix premiers carrés. Rangés, prévisibles, réconfortants.",
    bonus:{ type:'dustMult', val:0.15 }, bonusLabel:'+15 % de poussière' },

  { id:'narcissiq',  nom:'Les Narcissiques',    emoji:'💅', nums:[153,370,371,407,1634,8208,9474],
    desc:"Chacun se reconstruit à partir de ses propres chiffres. Ils n'ont besoin de personne.",
    bonus:{ type:'dustMult', val:0.35 }, bonusLabel:'+35 % de poussière' },

  { id:'horloge',    nom:"L'Horloge",           emoji:'🕛', nums:[1,2,3,4,5,6,7,8,9,10,11,12],
    desc:"Douze heures. La collection la plus facile — et pourtant.",
    bonus:{ type:'coinFlat', val:40 }, bonusLabel:'+40 jetons/min' },

  { id:'triangles',  nom:'La Pyramide',         emoji:'🔺', nums:[1,3,6,10,15,21,28,36,45,55],
    desc:"Empilables en triangle. Gauss les additionnait de tête à sept ans.",
    bonus:{ type:'coinMult', val:0.15 }, bonusLabel:'+15 % de jetons/min' },

  { id:'mersenne',   nom:'Les Mersenne',        emoji:'⛰️', nums:[3,7,31,127,8191],
    desc:"Cinq sommets. Le suivant est 131071 — hors de portée.",
    bonus:{ type:'dustMult', val:0.25 }, bonusLabel:'+25 % de poussière' },

  { id:'repdigits',  nom:"L'Écho",              emoji:'🔁', nums:[11,22,33,44,55,66,77,88,99],
    desc:"Le même chiffre, deux fois. Neuf petites tautologies.",
    bonus:{ type:'coinFlat', val:25 }, bonusLabel:'+25 jetons/min' },

  { id:'millenaire', nom:'Le Millénaire',       emoji:'🏔️', nums:[1000,2000,3000,4000,5000,6000,7000,8000,9000],
    desc:"Les neuf paliers ronds. Très communs, très pénibles à réunir.",
    bonus:{ type:'coinFlat', val:120 }, bonusLabel:'+120 jetons/min' },

  { id:'anomalies',  nom:'Les Anomalies',       emoji:'👽', nums:[70,1729,6174,2520,1260],
    desc:"Le bizarre, le taxi, le trou noir, le PPCM de un à dix, le vampire. Rien ne les relie. C'est bien le problème.",
    bonus:{ type:'forgeDiscount', val:0.20 }, bonusLabel:'−20 % sur les aides de la Forge' },

  /* Théorème à prédicat plutôt qu'à liste : depuis que la Forge tire elle-même
     ses cibles, exiger cinq nombres nommément désignés au-delà du mur serait
     exiger une loterie sur 90 000 tirages. On compte, on n'énumère plus. */
  { id:'aunmot',     nom:'Le Grand Large',      emoji:'🚧', pred:{ type:'forgeable', n:12 },
    desc:"Douze nombres au-delà de 9 999, ou le zéro. Le tirage ne les atteint pas : il faut les gagner à la Forge, une commande à la fois.",
    bonus:{ type:'coinMult', val:0.50 }, bonusLabel:'+50 % de jetons/min' },
];

/* ---------- opérateurs de la Forge ----------
   OPS_BASE : les cinq que tout le monde comprend sans explication. Ce sont les
   seuls que le générateur utilise, donc toute commande est solvable avec eux
   seuls — personne n'a besoin de connaître l'indicatrice d'Euler pour jouer.
   OPS_OUTILS : les instruments de spécialiste, débloqués par la taille de la
   collection. Jamais nécessaires, souvent des raccourcis spectaculaires.
   `fn` renvoie null quand l'opération n'a pas de résultat acceptable. */

const OPS_BASE = [
  { id:'add', sym:'+', arity:2, comm:true,  nom:'Addition',       fn:(a,b)=>a+b },
  { id:'sub', sym:'−', arity:2, comm:false, nom:'Soustraction',   fn:(a,b)=> a>=b ? a-b : null,
    refus:"Pas de négatifs : soustrayez le plus petit du plus grand." },
  { id:'mul', sym:'×', arity:2, comm:true,  nom:'Multiplication', fn:(a,b)=> (a<2||b<2) ? null : a*b,
    refus:"Multiplier par 0 ou par 1 ne fabrique rien." },
  { id:'div', sym:'÷', arity:2, comm:false, nom:'Division',       fn:(a,b)=> (b>1 && a%b===0) ? a/b : null,
    refus:"La division doit tomber juste, et diviser par 1 ne sert à rien." },
  { id:'cat', sym:'‖', arity:2, comm:false, nom:'Soudure',        fn:(a,b)=> +(String(a)+String(b)),
    refus:"Les chiffres collés dépassent le plafond." },
];

const OPS_OUTILS = [
  { id:'mirror', sym:'⇄', arity:1, unlock:40,  nom:'Miroir',              fn:a=>reverseNum(a),
    hint:"Retourne les chiffres. Les palindromes n'y gagnent rien, les emirps tout." },
  { id:'digsum', sym:'Σ', arity:1, unlock:60,  nom:'Somme des chiffres',  fn:a=>digitSum(a),
    hint:"Réduit un géant à une poignée. Pour redescendre quand on a trop monté." },
  { id:'gcd',    sym:'∧', arity:2, unlock:90,  nom:'PGCD',                fn:(a,b)=> a===b ? null : gcd(a,b),
    refus:"Le PGCD d'un nombre avec lui-même le redonne.",
    hint:"Le plus grand diviseur commun. Il descend au lieu de monter." },
  { id:'lcm',    sym:'∨', arity:2, unlock:130, nom:'PPCM',                fn:(a,b)=> a===b ? null : lcm(a,b),
    refus:"Le PPCM d'un nombre avec lui-même le redonne.",
    hint:"Le plus petit multiple commun. 2520 = ppcm(1…10) : la route vers les hautement composés." },
  { id:'revadd', sym:'↺', arity:1, unlock:170, nom:'Miroir additif',      fn:a=>a+reverseNum(a),
    hint:"A + son propre miroir. Répétez : presque tout finit palindrome. Sauf 196, qui résiste depuis 1938." },
  { id:'sigma',  sym:'σ', arity:1, unlock:220, nom:'Somme des diviseurs', fn:a=>divisorSum(a),
    hint:"L'opérateur qui a fait naître les nombres parfaits et amicaux." },
  { id:'phi',    sym:'φ', arity:1, unlock:300, nom:"Indicatrice d'Euler", fn:a=>totient(a),
    hint:"Combien d'entiers sous A lui sont premiers. Imprévisible, et toute la cryptographie RSA tient dessus." },
  { id:'nextp',  sym:'→', arity:1, unlock:400, nom:'Le Crible',           fn:a=>nextPrime(a),
    hint:"Le premier qui suit A. La route des grands premiers." },
];

/* ---------- défis ---------- */
const DEFIS = [
  { id:'d_first',   nom:'Le Premier Geste',     desc:"Effectuer un tirage.",                          emoji:'🎰', check:s=>s.stats.pulls>=1,        rw:{coins:200} },
  { id:'d_10',      nom:'Chauffé',              desc:"10 tirages.",                                   emoji:'🔥', check:s=>s.stats.pulls>=10,       rw:{coins:500} },
  { id:'d_100',     nom:'Accro',                desc:"100 tirages.",                                  emoji:'🌀', check:s=>s.stats.pulls>=100,      rw:{coins:3000, dust:200} },
  { id:'d_1000',    nom:'Le Problème',          desc:"1000 tirages. On devrait en parler.",           emoji:'🫠', check:s=>s.stats.pulls>=1000,     rw:{coins:40000, dust:2500} },
  { id:'d_u25',     nom:'Petite Étagère',       desc:"25 nombres différents.",                        emoji:'📚', check:s=>uniqueCount(s)>=25,      rw:{coins:600, dust:60} },
  { id:'d_u100',    nom:'Bibliothèque',         desc:"100 nombres différents.",                       emoji:'🏛️', check:s=>uniqueCount(s)>=100,     rw:{coins:4000, dust:400} },
  { id:'d_u500',    nom:'Archiviste',           desc:"500 nombres différents.",                       emoji:'🗄️', check:s=>uniqueCount(s)>=500,     rw:{coins:25000, dust:2000} },
  { id:'d_u1000',   nom:'Le Cadastre',          desc:"1000 nombres différents. Un dixième du monde.", emoji:'🗺️', check:s=>uniqueCount(s)>=1000,    rw:{coins:120000, dust:9000} },
  { id:'d_forge1',  nom:'Première Étincelle',   desc:"Forger un nombre.",                             emoji:'⚒️', check:s=>s.stats.forges>=1,       rw:{dust:80} },
  { id:'d_forge25', nom:'Artisan',              desc:"25 forges.",                                    emoji:'🛠️', check:s=>s.stats.forges>=25,      rw:{coins:3000, dust:300} },
  { id:'d_forge150',nom:'Maître de Forge',      desc:"150 forges.",                                   emoji:'🏭', check:s=>s.stats.forges>=150,     rw:{coins:30000, dust:3000} },
  { id:'d_myth',    nom:'Contact',              desc:"Posséder un nombre Mythique.",                  emoji:'🌠', check:s=>hasRarity(s,'mythique'), rw:{coins:10000, dust:800} },
  { id:'d_leg5',    nom:'Panthéon Privé',       desc:"Posséder 5 Légendaires ou mieux.",              emoji:'🏆', check:s=>countAtLeast(s,4)>=5,    rw:{coins:15000, dust:1200} },
  { id:'d_void',    nom:'Le Vide',              desc:"Obtenir 0. Indice : il ne se tire pas.",        emoji:'🕳️', check:s=>!!s.owned[0],            rw:{coins:20000, dust:1500} },
  { id:'d_taxi',    nom:'Le Taxi',              desc:"Obtenir 1729.",                                 emoji:'🚕', check:s=>!!s.owned[1729],         rw:{coins:25000, dust:2000} },
  { id:'d_wall',    nom:'Franchir le Mur',      desc:"Obtenir un nombre au-dessus de 9999.",          emoji:'🚧', check:s=>Object.keys(s.owned).some(k=>+k>9999), rw:{coins:8000, dust:600} },
  { id:'d_stack',   nom:'Doublon Compulsif',    desc:"Posséder 20 copies d'un même nombre.",          emoji:'📦', check:s=>Object.values(s.owned).some(c=>c.copies>=20), rw:{coins:5000, dust:500} },
  { id:'d_theo1',   nom:'Premier Théorème',     desc:"Compléter une collection.",                     emoji:'📐', check:s=>s.claimed.length>=1,     rw:{coins:6000, dust:500} },
  { id:'d_theo5',   nom:'Corpus',               desc:"Compléter 5 collections.",                      emoji:'📜', check:s=>s.claimed.length>=5,     rw:{coins:50000, dust:4000} },
  { id:'d_rev25',   nom:'Bachotage',            desc:"25 bonnes réponses en Révision, toutes sessions confondues.",              emoji:'🎓', check:s=>(s.stats.bonnesReponses||0)>=25, rw:{coins:4000, dust:400} },
  { id:'d_rev15',   nom:'Mention Bien',          desc:"15 réussites dans un même examen.",                 emoji:'🥇', check:s=>(s.stats.meilleureSerie||0)>=15, rw:{coins:12000, dust:1000} },
  { id:'d_theoAll', nom:'Q.E.D.',               desc:"Compléter les 14 collections.",                 emoji:'🎓', check:s=>s.claimed.length>=COLLECTIONS.length, rw:{coins:500000, dust:50000} },
];
