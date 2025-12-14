const CONFIG = {
  SHEET_CSV: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTn_AISCPAvNtkZZcjcMn4_80wXuarbci9SyqBqDnnHpB5WM1QShft3xU7HHxgIP_AKz9ffyoEsAd9D/pub?output=csv"
};

const HOLLAND_MAP = {
  'R': { color: 'var(--color-R)', vn: 'Thực tế', en: 'Realistic' },
  'I': { color: 'var(--color-I)', vn: 'Nghiên cứu', en: 'Investigative' },
  'A': { color: 'var(--color-A)', vn: 'Nghệ thuật', en: 'Artistic' },
  'S': { color: 'var(--color-S)', vn: 'Xã hội', en: 'Social' },
  'E': { color: 'var(--color-E)', vn: 'Quản lý', en: 'Enterprising' },
  'C': { color: 'var(--color-C)', vn: 'Nghiệp vụ', en: 'Conventional' }
};

let rawData = [], mainQueue = [], retryQueue = [], user = { gender:'Nam', liked: [], disliked: [], neutral: [], scores: {} };
let currentItem = null, timerInterval = null, aiResultText = "";

window.onload = async () => {
  try {
      const res = await fetch(CONFIG.SHEET_CSV);
      rawData = parseCSV(await res.text());
      const libraryData = rawData.slice().sort(() => 0.5 - Math.random());
      renderLibrary(libraryData);
  } catch(e) { console.error(e); }
};

function parseCSV(text) {
  const lines = text.trim().split('\n'), res = [];
  for(let i=1; i<lines.length; i++) {
      const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      if(row.length < 2) continue;
      const c = t => t ? t.replace(/^"|"$/g, '').trim() : "";
      res.push({
          id: c(row[0]), nameVN: c(row[1]), nameEN: c(row[2]), group: c(row[3]),
          img1: c(row[4]), img2: c(row[5]), desc: c(row[6]), subjects: c(row[7]),
          qualities: c(row[8]), fact: c(row[9]), video: c(row[10]) || "" 
      });
  }
  return res;
}

/* --- UPDATED: HOLLAND RENDER WITH FULL NAMES --- */
function renderHollandFancy(codeStr) {
  let html = '<div class="holland-display">';
  let descParts = [];
  
  for (let char of codeStr) {
      let info = HOLLAND_MAP[char];
      if(!info) continue;
      
      // Letters
      html += `<span class="h-char" style="color:${info.color}">${char}</span>`;
      
      // Full description lines
      descParts.push(`<span style="color:${info.color}; display:block;">${char} (${info.en} - ${info.vn})</span>`);
  }
  html += '</div>';
  
  // Show detailed description below
  if(descParts.length > 0) {
      html += `<div class="h-desc" style="text-align:center; font-weight:700; margin-top:5px;">${descParts.join('')}</div>`;
  }
  return html;
}

/* --- GENDER SELECT --- */
function selectGender(g) {
  user.gender = g;
  document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('selected'));
  if(g === 'Nam') document.getElementById('gender-male').classList.add('selected');
  else document.getElementById('gender-female').classList.add('selected');
}

/* --- LIBRARY --- */
function renderLibrary(list) {
  document.getElementById('lib-container').innerHTML = list.map(i => {
      const code = i.group.charAt(0).toUpperCase();
      const color = HOLLAND_MAP[code] ? HOLLAND_MAP[code].color : 'var(--primary)';
      return `
      <div class="lib-card" onclick="showLibModal('${i.id}')">
          <div class="holland-badge" style="color: ${color}">${code}</div>
          <img src="${i.img2}" loading="lazy">
          <div class="lib-info">
              <span class="lib-name-vn">${i.nameVN}</span>
              <span class="lib-name-en">${i.nameEN}</span>
          </div>
      </div>`;
  }).join('');
}

function showLibModal(id) {
  const item = rawData.find(x => x.id === id);
  if(!item) return;
  
  document.getElementById('m-title-vn').innerText = item.nameVN;
  document.getElementById('m-title-en').innerText = item.nameEN;
  document.getElementById('m-desc').innerText = item.desc;
  document.getElementById('m-subjects').innerText = item.subjects;
  document.getElementById('m-qualities').innerText = item.qualities;
  document.getElementById('m-fact').innerText = item.fact;
  
  // Use Updated Render Function
  document.getElementById('m-group').innerHTML = renderHollandFancy(item.group);

  const mediaCon = document.getElementById('m-media-container');
  if(item.video) {
       const vidUrl = item.video.replace("watch?v=", "embed/");
       mediaCon.innerHTML = `<iframe src="${vidUrl}" style="width:100%; height:100%; border:none"></iframe>`;
  } else {
       mediaCon.innerHTML = `<img src="${item.img2}" style="width:100%; height:100%; object-fit:cover">`;
  }
  
  document.getElementById('modal-info').style.display = 'flex';
  setTimeout(() => document.getElementById('lib-modal-card').classList.add('zoom-in'), 10);
}

function closeModal() {
  document.getElementById('lib-modal-card').classList.remove('zoom-in');
  setTimeout(() => {
      document.getElementById('modal-info').style.display = 'none';
      document.getElementById('m-media-container').innerHTML = "";
  }, 300);
}

function closeModalClass() {
  document.getElementById('class-modal-card').classList.remove('zoom-in');
  setTimeout(() => {
      document.getElementById('modal-classification').style.display = 'none';
  }, 300);
}

function filterLib() {
  const k = document.getElementById('search-lib').value.toLowerCase();
  renderLibrary(rawData.filter(i => i.nameVN.toLowerCase().includes(k)));
}

/* --- QUIZ --- */
function goToScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function startQuiz() {
  const name = document.getElementById('inp-name').value;
  const yob = document.getElementById('inp-yob').value;
  if(!name || !yob) return alert("Vui lòng nhập Tên và Năm sinh!");
  
  user.name = name;
  user.yob = yob;
  user.class = document.getElementById('inp-class').value;
  user.email = document.getElementById('inp-email').value;
  user.liked = []; user.disliked = []; user.neutral = []; user.scores = {};
  
  mainQueue = rawData.slice().sort(()=>0.5-Math.random()).slice(0, 20);
  retryQueue = [];
  
  goToScreen('screen-swipe');
  loadNextCard();
}

function loadNextCard() {
  if(mainQueue.length === 0) {
      if(retryQueue.length > 0) { mainQueue = retryQueue; retryQueue = []; }
      else return finishAndAnalyze();
  }
  currentItem = mainQueue.shift();
  renderCard(currentItem);
  startTimer();
}

function renderCard(item) {
  document.getElementById('video-section').style.display = 'none';
  document.getElementById('video-frame').src = "";
  
  const html = `
  <div class="tinder-card" id="active-card" onclick="flipCard()">
      <div class="card-face card-front">
          <img src="${item.img2}" draggable="false">
          <div class="card-overlay">
              <h2 class="card-title-vn">${item.nameVN}</h2>
              <p class="card-title-en">${item.nameEN}</p>
          </div>
      </div>
      <div class="card-face card-back">
          <div class="back-header">
              <h3 style="margin:0">${item.nameVN}</h3>
              ${renderHollandFancy(item.group)}
          </div>
          <div class="back-content">
              <p><b>Mô tả:</b> ${item.desc}</p>
              <p><b>Môn học:</b> ${item.subjects}</p>
              <p><b>Thú vị:</b> ${item.fact}</p>
          </div>
      </div>
  </div>`;
  document.getElementById('card-zone').innerHTML = html;
  document.getElementById('progress-count').innerText = (mainQueue.length + retryQueue.length + 1);
}

function flipCard() {
  const card = document.getElementById('active-card');
  card.classList.toggle('is-flipped');
  const vidSec = document.getElementById('video-section');
  
  if(card.classList.contains('is-flipped')) {
      vidSec.style.display = 'block';
      const vidUrl = currentItem.video ? (currentItem.video.replace("watch?v=", "embed/")) : `https://www.youtube.com/embed?listType=search&list=nghề ${currentItem.nameVN}`;
      document.getElementById('video-frame').src = vidUrl;
  } else {
      vidSec.style.display = 'none';
      document.getElementById('video-frame').src = "";
  }
}

function startTimer() {
  clearInterval(timerInterval);
  const bar = document.getElementById('timer-bar');
  bar.style.transition = 'none'; bar.style.width = '100%';
  setTimeout(() => { bar.style.transition = 'width 5s linear'; bar.style.width = '0%'; }, 10);
  timerInterval = setTimeout(() => { userSwipe('down'); }, 5000);
}

function userSwipe(dir) {
  clearInterval(timerInterval);
  const card = document.getElementById('active-card');
  if(!card) return;

  card.style.transition = 'transform 0.5s ease-out, opacity 0.5s';
  let tr = '';
  if(dir === 'left') tr = 'translateX(-150%) rotate(-30deg)';
  if(dir === 'right') tr = 'translateX(150%) rotate(30deg)';
  if(dir === 'up') tr = 'translateY(-150%)';
  if(dir === 'down') tr = 'translateY(150%)';

  card.style.transform = tr; card.style.opacity = '0';

  if(dir === 'right') {
      user.liked.push(currentItem);
      const g = currentItem.group.charAt(0);
      user.scores[g] = (user.scores[g] || 0) + 1;
  } else if (dir === 'left') user.disliked.push(currentItem);
  else if (dir === 'up') user.neutral.push(currentItem);
  else if (dir === 'down') retryQueue.push(currentItem);
  
  setTimeout(loadNextCard, 400);
}

/* --- RESULT --- */
function finishAndAnalyze() {
  goToScreen('screen-result');
  document.getElementById('res-name').innerText = user.name;
  document.getElementById('res-class').innerText = user.class || "?";
  document.getElementById('res-email').innerText = user.email || "";
  document.getElementById('res-gender').innerText = user.gender;

  const sorted = Object.entries(user.scores).sort((a,b) => b[1] - a[1]);
  let topHolland = "";
  if(sorted.length > 0) topHolland += sorted[0][0];
  if(sorted.length > 1) topHolland += sorted[1][0];

  const prompt = `
      Học sinh: ${user.name}, Giới tính: ${user.gender}, Lớp: ${user.class}, Năm sinh: ${user.yob}.
      Kết quả Holland: ${topHolland}.
      Thích: ${user.liked.map(i=>i.nameVN).join(', ')}.
      Viết báo cáo HTML (body only) gồm: 1. Sở thích. 2. Tính cách. 3. Mã Holland.
  `;
  
  if (typeof google !== 'undefined') {
       google.script.run
      .withSuccessHandler(res => { 
          if(res.status === 'success') {
              document.getElementById('ai-result-container').innerHTML = res.text;
              aiResultText = res.text;
          } else document.getElementById('ai-result-container').innerHTML = "Lỗi: " + res.message;
      })
      .callGeminiAI(prompt);
  } else {
      document.getElementById('ai-result-container').innerHTML = "<p>Demo: Kết nối Google Script để xem AI phân tích.</p>";
  }
}

function showClassification() {
  document.getElementById('list-liked').innerHTML = user.liked.map(i=>`<div class='class-list-item'>${i.nameVN}</div>`).join('') || "<i>Trống</i>";
  document.getElementById('list-neutral').innerHTML = user.neutral.map(i=>`<div class='class-list-item'>${i.nameVN}</div>`).join('') || "<i>Trống</i>";
  document.getElementById('list-disliked').innerHTML = user.disliked.map(i=>`<div class='class-list-item'>${i.nameVN}</div>`).join('') || "<i>Trống</i>";
  
  document.getElementById('modal-classification').style.display = 'flex';
  setTimeout(() => document.getElementById('class-modal-card').classList.add('zoom-in'), 10);
}

function sendEmail() {
  if(!user.email) return alert("Bạn chưa nhập Email!");
  const btn = document.getElementById('btn-mail');
  btn.innerText = "Đang gửi...";
  
  if (typeof google !== 'undefined') {
      google.script.run
      .withSuccessHandler(res => { 
          if(res.status === 'success') { alert("Đã gửi email!"); btn.innerText = "Đã gửi xong"; }
          else { alert("Lỗi: " + res.message); btn.innerText = "Gửi lại"; }
      })
      .sendEmailReport({
          name: user.name,
          email: user.email,
          result: aiResultText || "Chưa có kết quả AI"
      });
  }
}

function restartApp() {
  if(confirm("Làm lại từ đầu?")) {
      user = { liked: [], disliked: [], neutral: [], scores: {}, gender: user.gender };
      goToScreen('screen-input');
  }
}
function quitQuiz() { if(confirm("Thoát?")) goToScreen('screen-home'); }