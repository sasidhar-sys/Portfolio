document.addEventListener('DOMContentLoaded', () => {

  // ─── Inject HTML ──────────────────────────────────────────────────────────
  const chatbotHTML = `
    <div id="chat-widget-container">
      <div id="chat-window" role="dialog" aria-label="Sasidhar's AI Assistant">
        <div class="chat-header">
          <div class="chat-header-info">
            <div class="chat-avatar">S</div>
            <div>
              <h3>Sasi's Assistant</h3>
              <span class="chat-status">● Online</span>
            </div>
          </div>
          <button id="chat-close-btn" aria-label="Close chat">&times;</button>
        </div>
        <div id="chat-messages" aria-live="polite"></div>
        <div id="chat-quick-replies"></div>
        <div class="chat-input-area">
          <input type="text" id="chat-input" placeholder="Ask me anything..." aria-label="Chat input" autocomplete="off" />
          <button id="chat-send-btn" aria-label="Send message">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
      <button id="chat-toggle-btn" aria-label="Open chat assistant">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span class="chat-badge">1</span>
      </button>
    </div>
  `;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = chatbotHTML;
  document.body.appendChild(wrapper);

  // ─── DOM refs ─────────────────────────────────────────────────────────────
  const toggleBtn = document.getElementById('chat-toggle-btn');
  const closeBtn = document.getElementById('chat-close-btn');
  const chatWindow = document.getElementById('chat-window');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send-btn');
  const messagesEl = document.getElementById('chat-messages');
  const quickRepliesEl = document.getElementById('chat-quick-replies');

  let userName = null;   // remember user's name if given
  let isOpen = false;

  // ─── Knowledge base ────────────────────────────────────────────────────────
  // Each entry: { keywords: [], response: string|fn, chips?: [] }
  const kb = [
    // Greetings
    {
      keywords: ['hi', 'hello', 'hey', 'howdy', 'sup', 'what\'s up', 'yo'],
      response: () => {
        const hour = new Date().getHours();
        const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
        const name = userName ? `, ${userName}` : '';
        return `${greet}${name}! 👋 I'm Sasi's AI assistant. I can tell you about Sasidhar's work, skills, projects, or even answer general tech and AI questions. What would you like to know?`;
      },
      chips: ['About Sasi', 'Projects', 'Skills', 'Contact']
    },

    // Name memory
    {
      keywords: ['my name is', 'i am', 'call me'],
      response: (input) => {
        const match = input.match(/(?:my name is|i am|call me)\s+([a-zA-Z]+)/i);
        if (match) {
          userName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
          return `Nice to meet you, ${userName}! 😊 Feel free to ask me anything.`;
        }
        return `Nice to meet you! What's your name?`;
      },
      chips: ['About Sasi', 'Skills', 'Projects']
    },

    // About / Bio
    {
      keywords: ['about', 'bio', 'who is', 'who are you', 'tell me about', 'introduce', 'background'],
      response: `Sasidhar Aarumugam is an aspiring **AI & ML engineer** from India 🇮🇳. He's passionate about building intelligent, production-ready solutions through research-driven development.\n\n🎓 He studies AI & Data Science and combines academic knowledge with real-world projects in deep learning, computer vision, and full-stack web development.`,
      chips: ['Skills', 'Projects', 'Education', 'Contact']
    },

    // Skills
    {
      keywords: ['skills', 'technologies', 'tech stack', 'tools', 'proficiency', 'languages', 'know'],
      response: `Sasidhar's core skill set:\n\n💻 **Languages:** Python, JavaScript, HTML, CSS, SQL\n⚛️ **Frontend:** React.js, Tailwind CSS\n🤖 **AI/ML:** PyTorch, EfficientNet, Grad-CAM, Scikit-learn\n☁️ **Cloud:** AWS (ML & Cloud Practitioner certified)\n🔧 **Tools:** Git, GitHub, VS Code, Postman`,
      chips: ['AI/ML Skills', 'Web Skills', 'Certifications']
    },

    // AI/ML-specific skills
    {
      keywords: ['ai', 'machine learning', 'ml', 'deep learning', 'neural', 'pytorch', 'efficientnet', 'gradcam', 'grad-cam'],
      response: `Sasidhar specialises in applied AI/ML:\n\n🔬 **Models:** EfficientNet-B0, CNN architectures\n📊 **Frameworks:** PyTorch, TorchVision\n🧠 **Explainability:** Grad-CAM for visual interpretation\n📁 **Datasets:** Medical imaging, classification tasks\n📈 **Best result:** 99% test accuracy on lung cancer dataset!`,
      chips: ['Lung Cancer Project', 'Esophageal Project', 'More Skills']
    },

    // Web skills
    {
      keywords: ['react', 'frontend', 'web', 'html', 'css', 'javascript', 'js', 'tailwind'],
      response: `On the web-dev side, Sasidhar is skilled in:\n\n⚛️ **React.js** — component-driven UIs\n🎨 **CSS / Tailwind** — responsive, modern designs\n🌐 **Vanilla JS** — animations, DOM work, canvas APIs\n🔗 **REST APIs** — integration & form handling\n\nHe built this very portfolio from scratch! 🚀`,
      chips: ['Projects', 'Experience', 'Contact']
    },

    // Projects
    {
      keywords: ['project', 'projects', 'work', 'built', 'made', 'portfolio'],
      response: `Sasidhar's featured projects:\n\n🫁 **Lung Cancer Detection** — EfficientNet-B0, 99% accuracy, Grad-CAM\n🍽️ **Esophageal Cancer Detection** — Smartphone-first pipeline\n🌐 **This Portfolio** — Custom HTML/CSS/JS with animations & modals\n\nAsk me about any specific project for more details!`,
      chips: ['Lung Cancer Project', 'Esophageal Project', 'Portfolio Project']
    },

    // Lung cancer project
    {
      keywords: ['lung', 'lung cancer', 'efficientnet', 'chest', 'x-ray', 'xray', '99%'],
      response: `🫁 **Lung Cancer Detection using EfficientNet**\n\n• Architecture: EfficientNet-B0 (PyTorch)\n• Dataset: Chest X-ray images\n• Test Accuracy: **99%** 🎯\n• Explainability: Grad-CAM heatmaps highlight suspicious regions\n• Goal: Aid radiologists with AI-assisted pre-screening\n\nThis is one of Sasidhar's most impressive research projects!`,
      chips: ['Esophageal Project', 'More Skills', 'Contact']
    },

    // Esophageal project
    {
      keywords: ['esophageal', 'esophagus', 'foodpipe', 'smartphone', 'phone', 'mobile', 'cancer'],
      response: `🍽️ **Esophageal Cancer Detection**\n\n• Designed for **smartphone-captured images**\n• Mobile-first pre-processing pipeline\n• Architecture: EfficientNet-based\n• Explainability: Grad-CAM for clinical trust\n• Goal: Non-invasive, accessible detection\n\nThis tackles a real healthcare accessibility gap!`,
      chips: ['Lung Cancer Project', 'AI/ML Skills', 'Contact']
    },

    // Experience / Work
    {
      keywords: ['experience', 'work', 'job', 'intern', 'company', 'internship', 'career', 'employed'],
      response: `💼 Sasidhar's professional experience:\n\n🏢 **Software Developer @ ConceptVines** *(2025 – Present)*\n→ Building scalable software with clean architecture\n\n🚀 **ReactJS Intern @ SSS Group** *(July 2025)*\n→ Responsive frontends, Framer Motion micro-animations\n\nHe's actively growing in both AI engineering and web development!`,
      chips: ['Skills', 'Projects', 'Contact']
    },

    // Certifications
    {
      keywords: ['certificate', 'certification', 'aws', 'udemy', 'course', 'achievement'],
      response: `🏆 Sasidhar's certifications:\n\n☁️ **AWS ML Fundamentals** — Amazon (Aug 2025)\n☁️ **AWS Cloud Practitioner Essentials** — Amazon (Aug 2025)\n🐍 **Python for Data Science** — Udemy (June 2025)\n🔧 **Python Programming Workshop** — Top Engineers (Jan 2025)\n💼 **ReactJS Internship Completion** — SSS Group (July 2025)`,
      chips: ['Skills', 'Experience', 'Projects']
    },

    // Education
    {
      keywords: ['education', 'study', 'college', 'university', 'degree', 'student', 'academic'],
      response: `🎓 Sasidhar is pursuing a degree in **Artificial Intelligence & Data Science**.\n\nHe actively bridges the gap between academic research and real-world engineering — from university coursework to building production ML pipelines and deployed web apps.`,
      chips: ['Projects', 'Skills', 'Experience']
    },

    // Contact
    {
      keywords: ['contact', 'email', 'phone', 'reach', 'hire', 'message', 'linkedin', 'github'],
      response: `📬 Get in touch with Sasidhar:\n\n📧 **Email:** mailtosasi.official@gmail.com\n📱 **Phone:** +91-9677119933\n🐙 **GitHub:** github.com/sasidhar-sys\n💼 **LinkedIn:** via the Contact page on this site\n\nHe's open to collaborations, internships, and full-time roles!`,
      chips: ['About Sasi', 'Projects', 'Skills']
    },

    // Resume
    {
      keywords: ['resume', 'cv', 'download'],
      response: `📄 You can **download Sasidhar's resume** using the "Download Resume" button in the navigation bar at the top of the page.\n\nIt covers his education, experience, projects, and certifications in full detail.`,
      chips: ['Contact', 'Experience', 'Projects']
    },

    // ── General AI/Tech knowledge ──────────────────────────────────────────

    // What is AI
    {
      keywords: ['what is ai', 'what is artificial intelligence', 'explain ai', 'define ai'],
      response: `🤖 **Artificial Intelligence (AI)** is the simulation of human intelligence in machines.\n\nAI systems can:\n• Learn from data (Machine Learning)\n• Recognize patterns (Computer Vision, NLP)\n• Make decisions & predictions\n• Generate creative content (Generative AI)\n\nSasidhar works with AI daily — ask me about his projects!`,
      chips: ['AI/ML Skills', 'Lung Cancer Project', 'What is ML']
    },

    // What is ML
    {
      keywords: ['what is ml', 'what is machine learning', 'explain ml', 'define machine learning'],
      response: `🧠 **Machine Learning (ML)** is a subset of AI where systems *learn from data* without being explicitly programmed.\n\n**Types:**\n• Supervised — learns from labeled examples\n• Unsupervised — finds hidden patterns\n• Reinforcement — learns via rewards\n\n**Common algorithms:** Linear Regression, Decision Trees, CNNs, Transformers\n\nSasidhar uses PyTorch for supervised deep learning tasks.`,
      chips: ['What is Deep Learning', 'AI/ML Skills', 'Projects']
    },

    // What is deep learning
    {
      keywords: ['deep learning', 'neural network', 'cnn', 'what is dl'],
      response: `🔬 **Deep Learning** is ML using multi-layer neural networks (like the human brain).\n\n**Key architectures:**\n• **CNN** — great for images (what Sasidhar uses!)\n• **RNN/LSTM** — for sequences & time series\n• **Transformer** — powers GPT, BERT\n\n**Why it's powerful:** learns features automatically from raw data with enough training data + compute.`,
      chips: ['AI/ML Skills', 'EfficientNet', 'What is ML']
    },

    // EfficientNet explanation
    {
      keywords: ['efficientnet', 'what is efficientnet', 'explain efficientnet'],
      response: `⚡ **EfficientNet** is a family of neural network models by Google that scales width, depth, and resolution *together* using a compound coefficient.\n\n**Why it's great:**\n• State-of-the-art accuracy with fewer parameters\n• Efficient (less compute, less memory)\n• Works well on medical imaging tasks\n\nSasidhar uses **EfficientNet-B0** for cancer detection — achieving 99% accuracy! 🎯`,
      chips: ['Lung Cancer Project', 'Esophageal Project', 'AI/ML Skills']
    },

    // What is Python
    {
      keywords: ['what is python', 'explain python', 'python language', 'why python'],
      response: `🐍 **Python** is the most popular programming language for AI, data science, and automation.\n\n**Why everyone loves it:**\n• Simple, readable syntax\n• Massive library ecosystem (PyTorch, NumPy, Pandas, etc.)\n• Great for prototyping and production\n\nSasidhar uses Python as his primary language for all ML work.`,
      chips: ['Skills', 'AI/ML Skills', 'What is ML']
    },

    // What is React
    {
      keywords: ['what is react', 'explain react', 'reactjs', 'react.js'],
      response: `⚛️ **React.js** is a JavaScript library by Meta for building fast, component-based UIs.\n\n**Core concepts:**\n• Components — reusable UI blocks\n• State & Props — data flow\n• Hooks — logic in functional components\n• Virtual DOM — efficient updates\n\nSasidhar built reactive UIs and did his internship in ReactJS!`,
      chips: ['Web Skills', 'Experience', 'Projects']
    },

    // What is Grad-CAM
    {
      keywords: ['grad-cam', 'gradcam', 'what is gradcam', 'explain gradcam', 'explainable', 'xai'],
      response: `🔍 **Grad-CAM** (Gradient-weighted Class Activation Mapping) is an explainability technique for CNNs.\n\n**How it works:**\n• Uses gradients flowing into the last conv layer\n• Produces a heatmap showing *where* the model "looked"\n• Makes AI decisions interpretable to humans\n\nSasidhar uses Grad-CAM in his medical imaging projects to highlight suspicious regions for doctors! Very important for clinical trust. 🏥`,
      chips: ['Lung Cancer Project', 'AI/ML Skills', 'What is Deep Learning']
    },

    // General tech — what is cloud/AWS
    {
      keywords: ['what is aws', 'amazon web services', 'cloud', 'cloud computing'],
      response: `☁️ **AWS (Amazon Web Services)** is the world's largest cloud platform.\n\n**Key services:**\n• EC2 — virtual servers\n• S3 — file storage\n• SageMaker — managed ML training\n• Lambda — serverless functions\n\nSasidhar holds both the **AWS ML** and **AWS Cloud Practitioner** certifications! 🏆`,
      chips: ['Certifications', 'Skills', 'Experience']
    },

    // Jokes / fun
    {
      keywords: ['joke', 'funny', 'laugh', 'humor', 'fun', 'lol'],
      response: `😄 Here's one for you:\n\n**Why do programmers prefer dark mode?**\n*Because light attracts bugs!* 🐛\n\n...Want another or shall we talk tech?`,
      chips: ['About Sasi', 'Skills', 'Projects']
    },

    // Motivation / inspiration
    {
      keywords: ['motivat', 'inspir', 'quote', 'advice', 'tips'],
      response: `💡 Something Sasidhar lives by:\n\n*"The best way to predict the future is to invent it."* — Alan Kay\n\nHis approach: stay curious, build consistently, and let the work speak for itself. 🚀`,
      chips: ['About Sasi', 'Projects', 'Contact']
    },

    // Thanks
    {
      keywords: ['thank', 'thanks', 'ty', 'appreciate', 'helpful'],
      response: () => {
        const name = userName ? `, ${userName}` : '';
        return `You're very welcome${name}! 😊 If you have any more questions about Sasidhar or anything tech, just ask. Happy to help! 🌟`;
      },
      chips: ['Projects', 'Contact', 'Skills']
    },

    // Bye
    {
      keywords: ['bye', 'goodbye', 'see you', 'later', 'cya', 'exit', 'close'],
      response: () => {
        const name = userName ? `, ${userName}` : '';
        return `Goodbye${name}! 👋 It was great chatting with you. Feel free to come back anytime. Have a great day! ✨`;
      },
      chips: []
    },
  ];

  // ─── Quick reply sets ─────────────────────────────────────────────────────
  const defaultChips = ['About Sasi', 'Skills', 'Projects', 'Experience', 'Contact', 'What is AI'];

  // ─── Render quick replies ─────────────────────────────────────────────────
  function renderChips(chips) {
    quickRepliesEl.innerHTML = '';
    if (!chips || chips.length === 0) return;
    chips.forEach(label => {
      const btn = document.createElement('button');
      btn.className = 'quick-reply-btn';
      btn.textContent = label;
      btn.addEventListener('click', () => processUserInput(label));
      quickRepliesEl.appendChild(btn);
    });
  }

  // ─── Add message bubble ───────────────────────────────────────────────────
  function addMessage(text, sender, html = false) {
    const bubble = document.createElement('div');
    bubble.classList.add('message', sender);
    if (html) {
      // Convert simple markdown-ish bold (**text**) and newlines
      bubble.innerHTML = text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
    } else {
      bubble.textContent = text;
    }
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  // ─── Typing indicator ─────────────────────────────────────────────────────
  function showTyping() {
    const indicator = document.createElement('div');
    indicator.classList.add('message', 'bot', 'typing-indicator');
    indicator.id = 'typing-indicator';
    indicator.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(indicator);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function removeTyping() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
  }

  // ─── Core: find response ──────────────────────────────────────────────────
  function findResponse(input) {
    const lower = input.toLowerCase().trim();

    for (const entry of kb) {
      for (const kw of entry.keywords) {
        if (lower.includes(kw)) {
          const text = typeof entry.response === 'function'
            ? entry.response(input)
            : entry.response;
          const chips = entry.chips !== undefined ? entry.chips : defaultChips;
          return { text, chips };
        }
      }
    }

    // ── Fallback ─────────────────────────────────────────────────────────
    return {
      text: `Hmm, I didn't quite catch that 🤔\n\nI can answer questions about:\n• Sasidhar's **skills, projects, experience**\n• **AI, ML, Deep Learning** concepts\n• Technologies like **Python, React, AWS**\n\nTry rephrasing or tap a topic below!`,
      chips: defaultChips
    };
  }

  // ─── Process input (send pipeline) ───────────────────────────────────────
  function processUserInput(text) {
    if (!text.trim()) return;
    addMessage(text, 'user');
    chatInput.value = '';
    quickRepliesEl.innerHTML = '';

    showTyping();
    const delay = 600 + Math.random() * 500; // 600-1100ms feels natural

    setTimeout(() => {
      removeTyping();
      const { text: reply, chips } = findResponse(text);
      addMessage(reply, 'bot', true);
      renderChips(chips);
    }, delay);
  }

  // ─── Toggle open/close ────────────────────────────────────────────────────
  function openChat() {
    chatWindow.style.display = 'flex';
    toggleBtn.style.display = 'none';
    isOpen = true;
    chatInput.focus();
    // Hide badge
    const badge = toggleBtn.querySelector('.chat-badge');
    if (badge) badge.style.display = 'none';
  }

  function closeChat() {
    chatWindow.style.display = 'none';
    toggleBtn.style.display = 'flex';
    isOpen = false;
  }

  toggleBtn.addEventListener('click', openChat);
  closeBtn.addEventListener('click', closeChat);

  // Close if ESC pressed
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeChat();
  });

  // ─── Send events ──────────────────────────────────────────────────────────
  sendBtn.addEventListener('click', () => processUserInput(chatInput.value));
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') processUserInput(chatInput.value);
  });

  // ─── Initial welcome ──────────────────────────────────────────────────────
  (function init() {
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    addMessage(
      `${greet}! 👋 I'm Sasi's AI assistant.\n\nI can tell you about Sasidhar's **skills, projects, and experience**, or answer general **AI & tech** questions.\n\nWhat would you like to know?`,
      'bot',
      true
    );
    renderChips(defaultChips);
  })();

});
