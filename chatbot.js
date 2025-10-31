/* chatbot.js — create a chat bubble and wire to OPENAI_CHAT_ENDPOINT (serverless function)
   Replace OPENAI_CHAT_ENDPOINT below with your deployed function URL
*/
const OPENAI_CHAT_ENDPOINT = "OPENAI_CHAT_ENDPOINT"; // e.g. https://us-central1-.../openaiChat

(function createChatUI(rootId='chatbot-root'){
  // If root element not present, try farmer root
  let root = document.getElementById(rootId);
  if(!root) root = document.getElementById('chatbot-root-farmer') || document.body.appendChild(document.createElement('div'));

  root.innerHTML = `
    <div class="chat-bubble fixed right-5 bottom-5 z-50">
      <div id="chatHeader" class="bg-gradient-to-br from-green-700 to-yellow-500 text-white p-3 rounded-t-xl shadow cursor-pointer">FamFresh Helper</div>
      <div class="chat-window hidden bg-white rounded-b-xl shadow p-3 w-80 max-w-xs">
        <div id="chatMessages" class="h-56 overflow-auto text-sm space-y-2"></div>
        <div class="mt-3 flex gap-2">
          <input id="chatInput" placeholder="Ask about weather, pests, storage, booking..." class="flex-1 border rounded px-3 py-2"/>
          <button id="sendBtn" class="bg-green-700 text-white px-3 py-2 rounded">Ask</button>
        </div>
        <div class="mt-2 text-xs text-gray-500">Tip: ask "book storage" or "weather" for quick actions.</div>
      </div>
    </div>
  `;
  // attach events
  const header = root.querySelector('#chatHeader');
  const windowEl = root.querySelector('.chat-window');
  const sendBtn = root.querySelector('#sendBtn');
  const chatInput = root.querySelector('#chatInput');
  const messagesEl = root.querySelector('#chatMessages');

  header.addEventListener('click', ()=> windowEl.classList.toggle('hidden'));
  function addMessage(role, text){
    messagesEl.innerHTML += `<div class="${role==='bot'?'text-sm text-gray-800':'text-sm text-green-700'}"><strong>${role==='bot'?'FamFresh':'You'}:</strong> ${text}</div>`;
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function getAIReply(prompt){
    if(!OPENAI_CHAT_ENDPOINT || OPENAI_CHAT_ENDPOINT === 'OPENAI_CHAT_ENDPOINT') return 'AI endpoint not configured. Set OPENAI_CHAT_ENDPOINT in chatbot.js';
    try{
      const r = await fetch(OPENAI_CHAT_ENDPOINT, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ prompt }) });
      const data = await r.json();
      if(r.ok && data.reply) return data.reply;
      return data.error || 'No reply from AI.';
    } catch(err){
      console.error('AI error', err);
      return 'AI service error — try again later.';
    }
  }

  sendBtn.addEventListener('click', async ()=> {
    const prompt = chatInput.value.trim();
    if(!prompt) return;
    addMessage('user', prompt);
    chatInput.value = '';
    addMessage('bot', 'Thinking...');
    const reply = await getAIReply(prompt);
    // remove the temporary thinking message and append real reply
    messagesEl.removeChild(messagesEl.lastElementChild);
    addMessage('bot', reply);
  });

  // expose small API for other pages
  window.appChat = window.appChat || {};
  window.appChat.addMessage = (r,t)=> addMessage(r,t);
  window.appChat.getReply = async (q)=> {
    addMessage('user', q);
    addMessage('bot', 'Thinking...');
    const rep = await getAIReply(q);
    messagesEl.removeChild(messagesEl.lastElementChild);
    addMessage('bot', rep);
    return rep;
  };
  window.appChat.fetchLocalWeatherAndTips = async ()=> {
    // call weather.js helper if available (defined in weather.js)
    if(typeof getLocalWeatherText === 'function') return await getLocalWeatherText();
    return 'Weather helper not configured.';
  };

})();