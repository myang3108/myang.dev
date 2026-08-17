/* ================================================================
   Projects — the data behind the little objects on the globe.
   ----------------------------------------------------------------
   Each entry owns the card that opens when its object is clicked, plus
   which piece of artwork represents it:

     icon.id    the <g> to clone out of #deskTemplate in index.html
     icon.view  the viewBox to frame that artwork with, in the template's
                520x300 coordinate space

   Every view is a *square* centred on the drawing's real bounding box, which
   is what keeps each object dead-centre in its round tile — a frame that only
   roughly fits the art reads as an object hanging off to one side. The boxes
   were measured in the browser rather than eyeballed, because getBBox()
   ignores clipping and several drawings (the phone's scrolling app grid above
   all) extend well past what they actually draw.

   The side lengths are deliberately not tight to each drawing: they're pulled
   halfway towards a common ~110-unit frame, so stroke weights stay close
   across the set while a keyboard still reads as bigger than a mochi. Nudge a
   view here if you edit a drawing.
   ================================================================ */
window.PROJECTS = {
  phone: {
    name: 'vault',
    date: '2024 – 2025',
    desc: '☩ co-founded a time-capsule iOS app for preserving memories with friends — grew to 1,000+ users\n☩ architected the SwiftUI client with MVVM state management\n☩ built a real-time camera capture and filter pipeline with AVFoundation, with MapKit-based location tagging and geographic post discovery\n☩ optimized Firestore-backed content retrieval with lazy pagination, batched reads, and client-side caching for smooth infinite scrolling',
    chips: ['SwiftUI', 'MVVM', 'AVFoundation', 'MapKit', 'Firestore'],
    url: 'https://apps.apple.com/us/app/vault-safekeep-your-memories/id6590602325',
    icon: { id: 'deskPhone', view: '9 117 98 98' },
  },
  genedate: {
    name: '(gened)ate',
    date: 'hackillinois 2024',
    desc: '☩ a gened matchmaker for uiuc students — type the things you actually care about (“asian, culture, politics”) and get courses back instead of scrolling the catalog\n☩ pulled uiuc course datasets and RateMyProfessor data, then ranked matches with rake keyword extraction and cosine similarity\n☩ every result carries the description, average gpa, professor ratings, and links to the reddit threads people really decide from\n☩ next.js + react + tailwind front end over a flask/pandas backend; i built the ui',
    chips: ['TypeScript', 'Next.js', 'React', 'Tailwind', 'Flask', 'Python', 'Pandas', 'RAKE'],
    url: 'https://devpost.com/software/gened-ate',
    icon: { id: 'deskGened', view: '139.5 111.5 88 88' },
  },
  towers: {
    name: 'research',
    date: '2024 – present',
    desc: '☩ undergraduate research in the Fahnestock group at UIUC\n☩ architected an MCP server integrating a vector database and tool-calling endpoints — AI agents automate simulation execution, extract seismic data, and retrieve domain protocols\n☩ engineered an ML inference pipeline combining geolocation REST APIs, XGBoost models, and a randomized greedy optimizer to design multi-objective steel structures with >90% validation accuracy\n☩ awarded the Illinois Scholars Undergraduate Research Scholarship (1 of 20), selected for the PURE program (1 of 40), and won Best Audience Choice at the Undergraduate Research Symposium among 100+ projects',
    chips: ['Python', 'XGBoost', 'MCP', 'OpenSeesPy', 'Vector DB', 'REST APIs'],
    url: 'https://publish.illinois.edu/fahnestock/people/',
    icon: { id: 'deskTowers', view: '391.5 197.5 111 111' },
  },
  workbook: {
    name: 'geni',
    date: '2024',
    desc: '☩ developed a learning platform integrating with Google Classroom, providing LLM tools and assignment generation to 1,000 users\n☩ queried MongoDB via Prisma to retrieve JSON data through REST APIs, rendered via reusable components across 10 pages\n☩ enhanced UI/UX across 10 pages in Next.js and React, letting users generate and interact with assignments seamlessly',
    chips: ['Next.js', 'React', 'MongoDB', 'Prisma', 'REST APIs', 'LLM'],
    url: 'https://geni.zone/',
    icon: { id: 'deskBook', view: '54 204 112 112' },
  },
  mochi: {
    name: 'mochi',
    date: 'hackillinois 2026',
    desc: '☩ a multiplayer focus app that turns pomodoro sessions into a tamagotchi you can starve — everyone in the room declares a task, then keeps their pet alive by actually doing it\n☩ an ai agent reads each player’s active windows through screen permissions and scores them against the task they declared\n☩ mediapipe face and pose models check gaze and posture every 5 seconds, with modal inference judging task relevance from the video feed\n☩ built as a tauri (rust) desktop shell with a transparent always-on-top react/typescript ui and a custom physics engine for the pet\n☩ a python socket.io backend keeps every participant’s pet health in sync across the local network',
    chips: ['Tauri', 'Rust', 'React', 'TypeScript', 'Python', 'Socket.IO', 'MediaPipe', 'Modal'],
    url: 'https://devpost.com/software/mochi-s13nbt',
    icon: { id: 'deskMochi', view: '215 -1 90 90' },
  },
  vr: {
    name: 'bino.dev',
    date: 'hackillinois 2025',
    desc: '☩ an assistive ar headset app that narrates the room for people with visual impairments — say “detect” and it names what’s in front of you through your headphones\n☩ real-time object detection with YOLOv8n behind a flask inference backend, with results spoken back through the google web speech api\n☩ worked around meta’s locked-down camera api by streaming the quest 3s passthrough feed out through obs, then piping those frames into the cv pipeline\n☩ hands-free speech recognition for asking about the surroundings mid-walk',
    chips: ['Python', 'Flask', 'YOLOv8n', 'Meta Quest 3S', 'Unity', 'OBS', 'JavaScript'],
    url: 'https://devpost.com/software/bino',
    icon: { id: 'deskVR', view: '239.5 201.5 119 119' },
  },
  box: {
    name: 'amazon',
    date: '2025 – 2026',
    desc: 'Sandstone Triad (summer 2026)\n☩ built a knowledge graph recommendation system on Amazon Neptune — 750M+ entities connecting 10M customers, 4,096 sparse-autoencoder behavioral personas, and a four-level Semantic-ID hierarchy\n☩ 11 REST endpoints on API Gateway + Lambda with parameterized openCypher queries — 56ms p50, 138ms p95, and server-side batching that cut response times 82%\n☩ designed a weekly blue/green batch rebuild across Cradle, SageMaker Processing, Step Functions, Lambda, and Neptune, with a SigV4 snapshot/reset/bulk-load/validation control plane\n☩ made an RQ-VAE’s machine-learned product groupings interpretable by feeding purchase-weighted taxonomy data to a Bedrock agent — 100% labeling coverage\n☩ wrapped the graph tools and chained prompt workflows into an MCP server for natural-language queries\n\nSandstone Embedding Generation Pipeline (summer 2025)\n☩ scalable CI/CD pipeline automating batch vector embedding generation for 100M-parameter model training — 35% faster, 10% cheaper, 99.5% accuracy held\n☩ serverless ML workflow letting applied scientists analyze payment fraud across 150M+ daily customer orders, views, and searches\n☩ optimized real-time TrafficStream queries 15% with distributed customer group hashing in PySpark\n☩ helped integrate a Strands agent with case retrieval and order lookup tools for a fraud investigation assistant prototype, plus its evaluation metrics',
    chips: ['Python', 'PySpark', 'Neptune', 'openCypher', 'Lambda', 'Step Functions', 'SageMaker', 'Bedrock', 'MCP'],
    url: 'https://www.amazon.com/',
    icon: { id: 'deskBox', view: '396.8 8.3 102.5 102.5' },
  },
  scanner: {
    name: 'mh3d',
    date: 'summer 2024',
    desc: '☩ software engineering intern at a medical imaging startup building cancer-detection SPECT scanners\n☩ developed a .NET C# WinForms application with C++/CLI interop for real-time SPECT detector control\n☩ deployed a MySQL user database on AWS RDS with IAM authentication\n☩ moved 3D reconstruction to compute-optimized EC2 instances — 25% faster, eliminating CPU bottlenecks on legacy hardware',
    chips: ['C#', 'C++/CLI', '.NET WinForms', 'MySQL', 'AWS RDS', 'EC2', 'S3'],
    url: 'https://www.mh3dinc.com/',
    icon: { id: 'deskScanner', view: '212 104 96 96' },
  },
  cpu: {
    name: 'risc-v os',
    date: 'feb – apr 2025',
    desc: '☩ built a RISC-V Unix-like operating system in C and assembly from scratch\n☩ implemented Sv39 virtual memory, trap/interrupt handling, and a preemptive monolithic scheduler with context switching across user processes\n☩ developed UART serial and VirtIO block drivers, enabling kernel-space device IO\n☩ built an inode-based file system',
    chips: ['C', 'Assembly', 'RISC-V', 'Sv39', 'VirtIO', 'QEMU'],
    url: 'https://github.com/myang3108',
    icon: { id: 'deskCPU', view: '392.5 110.5 95 95' },
  },
  brain: {
    name: 'braincells',
    date: '2026',
    desc: '☩ designed an agentic tutoring harness that runs inside Claude Code — a closed teach-test-remediate loop that refuses to advance until you can prove you understand the material\n☩ authored a teaching contract plus three skills (/learn, /grill-gate, /add-resources) driving intake → adaptive diagnostic → approved roadmap → per-unit teach loop → cumulative final exam weighted toward weak spots\n☩ gated every unit at ~85% on generative assessment only — teach-backs with novel analogies, unseen transfer problems, edge-case prediction — never recall or multiple choice\n☩ built remediation that names the exact misconception, logs it, and reteaches from a different angle (new analogy → concrete numbers → diagram → code) with fresh questions\n☩ made the harness fully file-backed and resumable: per-topic state, roadmaps, quiz logs, and a learner profile that accumulates which explanations land, so topics bridge into each other and sessions pick up mid-roadmap',
    chips: ['Claude Code', 'Agent Design', 'Skills', 'Context Engineering'],
    url: 'https://github.com/myang3108/StopLosingBraincellsToAI',
    icon: { id: 'deskBrain', view: '292 101 102 102' },
  },
  laptop: {
    name: 'everything else',
    date: 'ongoing',
    desc: 'coursework at illinois — b.s. computer engineering, 3.65 gpa\n☩ data structures, algorithms, computer architecture, operating systems\n☩ artificial intelligence, applied machine learning, data mining\n☩ database systems, computer networks, distributed systems\n\n☩ aws certified ai practitioner + aws certified cloud practitioner',
    chips: ['React', 'Python', 'Docker', 'AWS'],
    url: 'https://github.com/myang3108',
    icon: { id: 'deskLaptop', view: '28 0 124 124' },
  },
};
