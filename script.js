(() => {
  // Constants
  const DELIMITER = '####END####';

  // Elements
  const encPill = document.getElementById('encPill');
  const decPill = document.getElementById('decPill');
  const encryptSection = document.getElementById('encryptSection');
  const decryptSection = document.getElementById('decryptSection');

  const randomFlower = document.getElementById('randomFlower');
  const uploadCover = document.getElementById('uploadCover');
  const previewImage = document.getElementById('previewImage');
  const imageWrap = document.getElementById('imageWrap');
  const metaArea = document.getElementById('metaArea');
  const statusArea = document.getElementById('statusArea');
  const hiddenCanvas = document.getElementById('hiddenCanvas');
  const messageInput = document.getElementById('messageInput');
  const encodeBtn = document.getElementById('encodeBtn');
  const previewEncodeBtn = document.getElementById('previewEncodeBtn');
  const uploadStego = document.getElementById('uploadStego');
  const decodeBtn = document.getElementById('decodeBtn');

  let currentImage = new Image();
  let currentImageLoaded = false;

  // Mode toggle
  encPill.addEventListener('click', () => { setMode('enc'); });
  decPill.addEventListener('click', () => { setMode('dec'); });

  function setMode(m){
    if(m==='enc'){
      encPill.classList.add('active'); decPill.classList.remove('active');
      encryptSection.style.display='block'; decryptSection.style.display='none';
      clearStatus();
    } else {
      decPill.classList.add('active'); encPill.classList.remove('active');
      encryptSection.style.display='none'; decryptSection.style.display='block';
      clearStatus();
    }
  }

  // Utility: show status
  function showStatus(msg, ok=true){
    statusArea.style.display='block';
    statusArea.textContent = msg;
    statusArea.className = 'status ' + (ok? 'ok' : 'err');
  }
  function clearStatus(){ statusArea.style.display='none'; statusArea.textContent=''; }

  // Load an image into preview and canvas
  function loadImageFromSrc(src){
    currentImageLoaded = false;
    currentImage = new Image();
    currentImage.crossOrigin = 'anonymous';
    currentImage.onload = () => {
      previewImage.src = src;
      currentImageLoaded = true;
      updateMeta();
      clearStatus();
    };
    currentImage.onerror = () => {
      showStatus('Could not load the image (CORS or invalid file). Try uploading or another image.', false);
    };
    currentImage.src = src;
  }

  // Random flower image (Unsplash quick source)
  

  // Upload cover input
  uploadCover.addEventListener('change', (e)=>{
    clearStatus();
    const f = e.target.files && e.target.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = (ev)=>{
      loadImageFromSrc(ev.target.result);
    };
    reader.readAsDataURL(f);
  });

  // Update meta info
  function updateMeta(){
    if(!currentImageLoaded) { metaArea.textContent = 'Image info: —'; return; }
    const w = currentImage.width, h = currentImage.height;
    const capacity = w * h * 3; // bits
    const maxChars = Math.floor(capacity / 8);
    metaArea.textContent = `Image info: ${w} x ${h} — capacity: ${capacity} bits (${maxChars} chars).`;
  }

  // Prepare canvas image data
  function paintToCanvas(){
    if(!currentImageLoaded) return null;
    const canvas = hiddenCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width = currentImage.width;
    canvas.height = currentImage.height;
    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.drawImage(currentImage, 0,0);
    return {canvas, ctx};
  }

  // Helpers for binary conversion
  function stringToBinary(str){
    let bin = '';
    for(let i=0;i<str.length;i++){
      let b = str.charCodeAt(i).toString(2);
      b = b.padStart(8, '0');
      bin += b;
    }
    return bin;
  }
  function binaryToString(bin){
    let out = '';
    for(let i=0;i<bin.length;i+=8){
      const byte = bin.slice(i,i+8);
      if(byte.length < 8) break;
      const code = parseInt(byte,2);
      out += String.fromCharCode(code);
    }
    return out;
  }

  // Encode: modify LSB of R,G,B sequentially
  function encodeMessage(){
    if(!currentImageLoaded){ showStatus('Select or upload a cover image first.', false); return; }
    const msg = messageInput.value || '';
    if(msg.length === 0){ showStatus('Message cannot be empty.', false); return; }
    const messageWithDelimiter = msg + DELIMITER;
    const bin = stringToBinary(messageWithDelimiter);

    const {canvas, ctx} = paintToCanvas() || {};
    if(!canvas) { showStatus('Could not prepare image canvas.', false); return; }
    const imgData = ctx.getImageData(0,0,canvas.width, canvas.height);
    const data = imgData.data; // RGBA

    const capacity = canvas.width * canvas.height * 3; // bits
    if(bin.length > capacity){
      showStatus(`Message too long for this image. Needs ${bin.length} bits, capacity is ${capacity} bits.`, false);
      return;
    }

    // iterate pixels
    let bitIndex = 0;
    for(let p=0; p < data.length && bitIndex < bin.length; p += 4){
      // R
      if(bitIndex < bin.length){ data[p] = setLSB(data[p], bin[bitIndex++]); }
      // G
      if(bitIndex < bin.length){ data[p+1] = setLSB(data[p+1], bin[bitIndex++]); }
      // B
      if(bitIndex < bin.length){ data[p+2] = setLSB(data[p+2], bin[bitIndex++]); }
      // skip alpha (p+3)
    }

    ctx.putImageData(imgData, 0,0);

    // produce output blob and auto-download
    canvas.toBlob((blob) => {
      if(!blob){ showStatus('Failed to generate output image.', false); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'stego_image.png';
      a.click();
      URL.revokeObjectURL(url);
      showStatus('Message encoded and download started. Use the downloaded file for later decoding.');
    }, 'image/png');
  }

  function setLSB(value, bit){
    const even = (value & 1) === 0;
    const bitInt = bit === '1' ? 1 : 0;
    if((value & 1) === bitInt) return value; // already correct
    if(bitInt === 1) return value | 1; // set LSB
    return value & (~1); // clear LSB
  }

  // Decode: read LSBs and reconstruct
  function decodeMessageFromImage(imgFileOrSrc){
    clearStatus();
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = ()=>{
      const canvas = hiddenCanvas;
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img,0,0);
      const imgData = ctx.getImageData(0,0,canvas.width,canvas.height);
      const data = imgData.data;

      // read bits
      let bin = '';
      for(let p=0;p<data.length;p+=4){
        bin += (data[p] & 1).toString();
        bin += (data[p+1] & 1).toString();
        bin += (data[p+2] & 1).toString();
      }

      const text = binaryToString(bin);
      const idx = text.indexOf(DELIMITER);
      if(idx !== -1){
        const message = text.slice(0, idx);
        showStatus('Message successfully extracted.');
        showRevealModal(message);
      } else {
        showStatus('No hidden message found (delimiter missing). The image may not contain data or uses another encoding.', false);
      }
    };
    img.onerror = ()=>{
      showStatus('Could not read the provided stego image (CORS or invalid file).', false);
    };

    if(typeof imgFileOrSrc === 'string') img.src = imgFileOrSrc;
    else {
      const reader = new FileReader();
      reader.onload = (ev)=>{ img.src = ev.target.result; };
      reader.readAsDataURL(imgFileOrSrc);
    }
  }

  // UI: Upload stego file for decoding
  uploadStego.addEventListener('change', (e)=>{
    clearStatus();
    const f = e.target.files && e.target.files[0];
    if(!f) return;
    // preview it
    const reader = new FileReader();
    reader.onload = (ev)=>{ previewImage.src = ev.target.result; currentImageLoaded = false; updateMeta(); decodeFileForUser(f); };
    reader.readAsDataURL(f);
  });

  function decodeFileForUser(file){
    decodeMessageFromImage(file);
  }

  // decode button (for when user uploaded via uploadStego)
  decodeBtn.addEventListener('click', ()=>{
    const files = uploadStego.files;
    if(!files || files.length===0){ showStatus('Please upload a stego image to decode.', false); return; }
    decodeMessageFromImage(files[0]);
  });

  // encode button
  encodeBtn.addEventListener('click', ()=>{
    encodeMessage();
  });

  // preview capacity button
  previewEncodeBtn.addEventListener('click', ()=>{
    if(!currentImageLoaded){ showStatus('Select or upload an image first to see capacity.', false); return; }
    const {canvas} = paintToCanvas() || {};
    if(!canvas){ showStatus('Could not prepare image canvas.', false); return; }
    const cap = canvas.width * canvas.height * 3;
    const maxChars = Math.floor(cap / 8);
    showStatus(`Capacity: ${cap} bits (${maxChars} characters).`, true);
  });

  // helper to show message in a modal-like way (simple prompt)
  function showRevealModal(msg){
    // simple custom modal using prompt-like behavior
    // We'll display in a confirm box style using a new window-ish element - but for simplicity use window.prompt for copy ease
    // But the user asked for the message to be shown on screen — we will create a pleasant overlay.

    const overlay = document.createElement('div');
    overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.display='flex'; overlay.style.alignItems='center'; overlay.style.justifyContent='center'; overlay.style.background='rgba(2,6,23,0.6)'; overlay.style.zIndex=9999;
    const box = document.createElement('div');
    box.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.3), rgba(255,255,255,0.4))';
    box.style.padding = '18px'; box.style.borderRadius='12px'; box.style.width='min(720px,92vw)'; box.style.boxShadow='0 20px 60px rgba(2,6,23,0.8)';
    const h = document.createElement('h3'); h.textContent = 'Revealed message:'; h.style.margin='0 0 8px 0'; h.style.color='white';
    const pre = document.createElement('textarea'); pre.readOnly = true; pre.style.width='100%'; pre.style.minHeight='120px'; pre.style.borderRadius='8px'; pre.style.padding='10px'; pre.style.background='transparent'; pre.style.color='var(--muted)'; pre.style.border='1px solid rgba(255,255,255,0.04)'; pre.value = msg;
    const buttons = document.createElement('div'); buttons.style.display='flex'; buttons.style.justifyContent='flex-end'; buttons.style.gap='8px'; buttons.style.marginTop='10px';
    const close = document.createElement('button'); close.className='btn ghost'; close.textContent='Close';
    const copy = document.createElement('button'); copy.className='btn primary'; copy.textContent='Copy message';
    close.onclick = ()=>{ document.body.removeChild(overlay); };
    copy.onclick = ()=>{ navigator.clipboard.writeText(msg).then(()=>{ copy.textContent='Copied ✓'; setTimeout(()=>copy.textContent='Copy message',1200); }); };
    buttons.appendChild(close); buttons.appendChild(copy);
    box.appendChild(h); box.appendChild(pre); box.appendChild(buttons);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  // When user clicks preview image (in preview column) allow replacing with uploaded stego too
  previewImage.addEventListener('click', ()=>{
    // small easter: if encrypt mode, open upload, if decrypt mode, open stego upload
    if(encPill.classList.contains('active')) uploadCover.click(); else uploadStego.click();
  });

  // initial placeholder
  updateMeta();
})();