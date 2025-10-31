/* chatbot-admin.js — Admin chatbot panel for FamFresh */

const OPENAI_CHAT_ENDPOINT = "OPENAI_CHAT_ENDPOINT"; // e.g. https://us-central1-.../openaiChat

(function createAdminChatUI(rootId='chatbot-root'){
  let root = document.getElementById(rootId);
  if(!root) root = document.body.appendChild(document.createElement('div'));

  root.innerHTML = `
    <div class="chat-bubble fixed right-5 bottom-5 z-50">
      <div id="chatHeader" class="bg-gradient-to-br from-green-700 to-yellow-500 text-white p-3 rounded-t-xl shadow cursor-pointer">Admin Chat</div>
      <div class="chat-window hidden bg-white rounded-b-xl shadow p-3 w-96 max-w-xs">
        <div id="chatMessages" class="h-64 overflow-auto text-sm space-y-2"></div>
        <div class="mt-3 flex gap-2">
          <input id="chatInput" placeholder="Reply to user queries..." class="flex-1 border rounded px-3 py-2"/>
          <button id="sendBtn" class="bg-green-700 text-white px-3 py-2 rounded">Send</button>
        </div>
        <div class="mt-2 text-xs text-gray-500">Tip: Admin can type answers or send instructions.</div>
      </div>
    </div>
  `;

  // Elements
  const header = root.querySelector('#chatHeader');
  const windowEl = root.querySelector('.chat-window');
  const sendBtn = root.querySelector('#sendBtn');
  const chatInput = root.querySelector('#chatInput');
  const messagesEl = root.querySelector('#chatMessages');

  // Toggle chat window
  header.addEventListener('click', ()=> windowEl.classList.toggle('hidden'));

  function addMessage(role, text){
    messagesEl.innerHTML += `<div class="${role==='bot'?'text-sm text-gray-800':'text-sm text-green-700'}"><strong>${role==='bot'?'User':'Admin'}:</strong> ${text}</div>`;
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function getAIReply(prompt){
    if(!OPENAI_CHAT_ENDPOINT || OPENAI_CHAT_ENDPOINT === 'OPENAI_CHAT_ENDPOINT') return 'AI endpoint not configured.';
    try{
      const r = await fetch(OPENAI_CHAT_ENDPOINT,{
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await r.json();
      if(r.ok && data.reply) return data.reply;
      return data.error || 'No reply from AI.';
    } catch(err){
      console.error('AI error', err);
      return 'AI service error — try again later.';
    }
  }

  // Send button click
  sendBtn.addEventListener('click', async ()=>{
    const prompt = chatInput.value.trim();
    if(!prompt) return;
    addMessage('user', prompt); // admin message
    chatInput.value = '';
    addMessage('bot', 'Thinking...');
    const reply = await getAIReply(prompt);
    messagesEl.removeChild(messagesEl.lastElementChild);
    addMessage('bot', reply);
  });

  // Expose small API
  window.appChatAdmin = window.appChatAdmin || {};
  window.appChatAdmin.addMessage = (r,t)=> addMessage(r,t);
  window.appChatAdmin.getReply = async (q)=>{
    addMessage('user', q);
    addMessage('bot', 'Thinking...');
    const rep = await getAIReply(q);
    messagesEl.removeChild(messagesEl.lastElementChild);
    addMessage('bot', rep);
    return rep;
  };

  window.appChatAdmin.fetchUserQueries = async ()=>{
    // fetch last 20 user queries from Firestore bookings/messages collection
    try{
      const snap = await db.collection('userQueries').orderBy('createdAt','desc').limit(20).get();
      messagesEl.innerHTML = '';
      snap.docs.reverse().forEach(d=>{
        const q = d.data();
        addMessage('bot', `[${q.userName||q.email}]: ${q.query}`);
      });
    } catch(e){
      console.warn('No user queries found', e);
      addMessage('bot','No user queries found.');
    }
  };

  // Initial load of user queries
  window.appChatAdmin.fetchUserQueries();

})();