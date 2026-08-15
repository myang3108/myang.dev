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
  box: {
    name: 'amazon',
    date: '2025 – 2026',
    desc: 'Sandstone Triad (summer 2026)\n☩ customer-behavior knowledge graph rec engine on Amazon Neptune — 750M weighted relationships for openCypher traversal\n☩ served through Lambda + API Gateway with sub-second latency for 10M customers\n☩ scored 50M+ buyer-affinity edges with a Wilson lift metric\n☩ exposed the system as an MCP server for natural-language graph access\n\nSandstone Embedding Generation Pipeline (summer 2025)\n☩ scalable CI/CD pipeline automating batch vector embedding generation for 100M-parameter model training — 35% faster, 10% cheaper\n☩ serverless ML workflow spanning 150M+ daily customer orders, views, and searches\n☩ integrated an internal MCP server with Claude for an agentic shopping assistant prototype',
    chips: ['Python', 'PySpark', 'Neptune', 'openCypher', 'Lambda', 'Step Functions', 'SageMaker', 'MCP'],
    url: 'https://www.amazon.com/',
    icon: { id: 'deskBox', view: '396.8 8.3 102.5 102.5' },
  },
  towers: {
    name: 'research',
    date: '2024 – present',
    desc: '☩ undergraduate research in the Fahnestock group at UIUC\n☩ architected an MCP server integrating a vector database and tool-calling endpoints — AI agents automate simulation execution, extract seismic data, and retrieve domain protocols\n☩ engineered an ML inference pipeline combining geolocation REST APIs, XGBoost models, and a randomized greedy optimizer to design multi-objective steel structures with >90% validation accuracy\n☩ awarded the Illinois Scholars Undergraduate Research Scholarship (1 of 20) and Best Audience Choice at the Undergraduate Research Symposium',
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
    date: '2024',
    desc: '☩ a cute virtual pet companion app with personality and animated interactions',
    chips: ['Swift', 'SpriteKit', 'UIKit'],
    url: 'https://github.com/myang3108/Mochi',
    icon: { id: 'deskMochi', view: '215 -1 90 90' },
  },
  vr: {
    name: 'bino.dev',
    date: '2025',
    desc: '☩ immersive vr experiences and spatial computing explorations',
    chips: ['Unity', 'C#', 'XR Toolkit', 'Shader Graph'],
    url: 'https://bino.dev',
    icon: { id: 'deskVR', view: '239.5 201.5 119 119' },
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
  laptop: {
    name: 'everything else',
    date: 'ongoing',
    desc: '☩ side projects, open-source contributions, and whatever catches my curiosity',
    chips: ['React', 'Python', 'Docker', 'AWS'],
    url: 'https://github.com/myang3108',
    icon: { id: 'deskLaptop', view: '28 0 124 124' },
  },
};
