const screens = {
  home: document.getElementById('homeScreen'),
  record: document.getElementById('recordScreen'),
  review: document.getElementById('reviewScreen'),
  saved: document.getElementById('savedScreen'),
  gallery: document.getElementById('galleryScreen'),
};

const els = {
  startBtn: document.getElementById('startBtn'),
  galleryBtn: document.getElementById('galleryBtn'),
  backFromRecordBtn: document.getElementById('backFromRecordBtn'),
  backFromGalleryBtn: document.getElementById('backFromGalleryBtn'),
  previewVideo: document.getElementById('previewVideo'),
  reviewVideo: document.getElementById('reviewVideo'),
  recordBtn: document.getElementById('recordBtn'),
  stopBtn: document.getElementById('stopBtn'),
  discardBtn: document.getElementById('discardBtn'),
  retakeBtn: document.getElementById('retakeBtn'),
  saveBtn: document.getElementById('saveBtn'),
  doneBtn: document.getElementById('doneBtn'),
  guestName: document.getElementById('guestName'),
  countdown: document.getElementById('countdown'),
  recordingBadge: document.getElementById('recordingBadge'),
  galleryList: document.getElementById('galleryList'),
  emptyGallery: document.getElementById('emptyGallery'),
  exportBtn: document.getElementById('exportBtn'),
  clearBtn: document.getElementById('clearBtn'),
  toast: document.getElementById('toast'),
};

let stream = null;
let recorder = null;
let chunks = [];
let pendingBlob = null;
let pendingMimeType = 'video/webm';

const prompts = [
  'Tell us your favorite memory, a piece of advice, or your wedding day wish.',
  'Share one thing you love about the couple.',
  'Give us your best marriage advice in under one minute.',
  'Tell us what you hope we remember about this day.',
];
document.getElementById('promptText').textContent = prompts[Math.floor(Math.random() * prompts.length)];

function showScreen(name) {
  Object.values(screens).forEach(screen => screen.classList.remove('active'));
  screens[name].classList.add('active');
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.remove('hidden');
  setTimeout(() => els.toast.classList.add('hidden'), 2400);
}

function bestMimeType() {
  const types = [
    'video/mp4;codecs=h264,aac',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  return types.find(type => window.MediaRecorder && MediaRecorder.isTypeSupported(type)) || '';
}

async function startCamera() {
  if (stream) return;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    els.previewVideo.srcObject = stream;
  } catch (error) {
    console.error(error);
    toast('Camera permission is needed to record.');
    showScreen('home');
  }
}

function stopCamera() {
  if (!stream) return;
  stream.getTracks().forEach(track => track.stop());
  stream = null;
  els.previewVideo.srcObject = null;
}

async function runCountdown() {
  els.countdown.classList.remove('hidden');
  for (const number of [3, 2, 1]) {
    els.countdown.textContent = number;
    await new Promise(resolve => setTimeout(resolve, 650));
  }
  els.countdown.textContent = 'Go!';
  await new Promise(resolve => setTimeout(resolve, 400));
  els.countdown.classList.add('hidden');
}

async function startRecording() {
  if (!stream) await startCamera();
  if (!stream) return;

  await runCountdown();
  chunks = [];
  const mimeType = bestMimeType();
  pendingMimeType = mimeType || 'video/webm';
  recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

  recorder.ondataavailable = event => {
    if (event.data && event.data.size > 0) chunks.push(event.data);
  };

  recorder.onstop = () => {
    pendingBlob = new Blob(chunks, { type: pendingMimeType });
    const url = URL.createObjectURL(pendingBlob);
    els.reviewVideo.src = url;
    els.recordingBadge.classList.add('hidden');
    els.recordBtn.classList.remove('hidden');
    els.stopBtn.classList.add('hidden');
    stopCamera();
    showScreen('review');
  };

  recorder.start();
  els.recordingBadge.classList.remove('hidden');
  els.recordBtn.classList.add('hidden');
  els.stopBtn.classList.remove('hidden');
}

function stopRecording() {
  if (recorder && recorder.state === 'recording') recorder.stop();
}

async function savePendingVideo() {
  if (!pendingBlob) return;
  const name = els.guestName.value.trim() || 'Guest';
  const createdAt = Date.now();
  const extension = pendingMimeType.includes('mp4') ? 'mp4' : 'webm';
  const safeName = name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'guest';

  await saveVideoRecord({
    id: crypto.randomUUID(),
    guestName: name,
    createdAt,
    mimeType: pendingMimeType,
    filename: `${safeName}-${new Date(createdAt).toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${extension}`,
    blob: pendingBlob,
  });

  pendingBlob = null;
  els.reviewVideo.removeAttribute('src');
  els.reviewVideo.load();
  els.guestName.value = '';
  showScreen('saved');
}

async function renderGallery() {
  const videos = await getAllVideos();
  els.galleryList.innerHTML = '';
  els.emptyGallery.classList.toggle('hidden', videos.length > 0);

  for (const video of videos) {
    const url = URL.createObjectURL(video.blob);
    const card = document.createElement('article');
    card.className = 'video-card';
    card.innerHTML = `
      <video controls playsinline src="${url}"></video>
      <h3>${escapeHtml(video.guestName)}</h3>
      <p>${new Date(video.createdAt).toLocaleString()}</p>
      <div class="card-actions">
        <a href="${url}" download="${escapeHtml(video.filename)}">Download</a>
        <button class="delete-one" data-id="${video.id}">Delete</button>
      </div>
    `;
    els.galleryList.appendChild(card);
  }

  document.querySelectorAll('.delete-one').forEach(button => {
    button.addEventListener('click', async () => {
      if (!confirm('Delete this video from the iPad?')) return;
      await deleteVideoRecord(button.dataset.id);
      await renderGallery();
      toast('Video deleted.');
    });
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

async function exportList() {
  const videos = await getAllVideos();
  const csv = ['Guest Name,Date,Filename', ...videos.map(v => `"${v.guestName.replaceAll('"', '""')}","${new Date(v.createdAt).toLocaleString()}","${v.filename}"`)].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'guest-video-book-list.csv';
  a.click();
  URL.revokeObjectURL(url);
}

els.startBtn.addEventListener('click', async () => { showScreen('record'); await startCamera(); });
els.galleryBtn.addEventListener('click', async () => { showScreen('gallery'); await renderGallery(); });
els.backFromRecordBtn.addEventListener('click', () => { stopCamera(); showScreen('home'); });
els.backFromGalleryBtn.addEventListener('click', () => showScreen('home'));
els.recordBtn.addEventListener('click', startRecording);
els.stopBtn.addEventListener('click', stopRecording);
els.discardBtn.addEventListener('click', () => { pendingBlob = null; showScreen('home'); });
els.retakeBtn.addEventListener('click', async () => { pendingBlob = null; showScreen('record'); await startCamera(); });
els.saveBtn.addEventListener('click', savePendingVideo);
els.doneBtn.addEventListener('click', () => showScreen('home'));
els.exportBtn.addEventListener('click', exportList);
els.clearBtn.addEventListener('click', async () => {
  if (!confirm('Delete ALL saved videos from this iPad? This cannot be undone.')) return;
  await clearAllVideos();
  await renderGallery();
  toast('All videos cleared.');
});

window.addEventListener('pagehide', stopCamera);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}

if (!navigator.mediaDevices || !window.MediaRecorder || !window.indexedDB) {
  toast('This browser does not support recording. Use Safari on iPadOS.');
}
