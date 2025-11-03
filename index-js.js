// 全域變數
let customFontName = null;
let customFontLoaded = false;
let backgroundImage = null;
let backgroundImageLoaded = false;
let currentAnim = 'none';
let animFrame = null;
let animTick = 0;
let colorMode = 'single';
let multiColors = ['#222222'];
let strokeLayers = [{ color: '#000000', width: 2 }];
let textTransform = { x: 135, y: 135, scale: 1, rotation: 0 };

// DOM 元素
const textInput = document.getElementById('text-input');
const fontUpload = document.getElementById('font-upload');
const bgUpload = document.getElementById('bg-upload');
const removeBgBtn = document.getElementById('remove-bg');
const fontSizeSlider = document.getElementById('font-size');
const fontSizeValue = document.getElementById('font-size-value');
const colorPicker = document.getElementById('color-picker');
const animBtns = document.querySelectorAll('.anim-btn');
const previewCanvas = document.getElementById('preview-canvas');
const ctx = previewCanvas.getContext('2d', { willReadFrequently: true });
const colorModeRadios = document.getElementsByName('color-mode');
const colorPickerRow = document.getElementById('color-picker-row');
const multiColorPickersRow = document.getElementById('multi-color-pickers-row');
const strokeLayersList = document.getElementById('stroke-layers-list');
const addStrokeLayerBtn = document.getElementById('add-stroke-layer');
const textControls = document.getElementById('text-controls');
const posXSlider = document.getElementById('pos-x');
const posYSlider = document.getElementById('pos-y');
const scaleSlider = document.getElementById('scale');
const rotationSlider = document.getElementById('rotation');
const resetTransformBtn = document.getElementById('reset-transform');

// 輔助函數
function getFontFamily() {
    return customFontLoaded && customFontName ? `'${customFontName}', Arial, sans-serif` : 'Arial, sans-serif';
}

function drawPreview(progress = null) {
    const text = textInput.value || '預覽';
    const size = parseInt(fontSizeSlider.value, 10);
    const letterSpacing = parseFloat(document.getElementById('letter-spacing').value);
    const lineHeight = parseFloat(document.getElementById('line-height').value);
    
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    
    if (backgroundImageLoaded && backgroundImage) {
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.drawImage(backgroundImage, 0, 0, previewCanvas.width, previewCanvas.height);
        ctx.restore();
    }
    
    ctx.save();
    ctx.font = `${size}px ${getFontFamily()}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#0002';
    ctx.shadowBlur = 2;
    
    ctx.translate(textTransform.x, textTransform.y);
    ctx.scale(textTransform.scale, textTransform.scale);
    ctx.rotate(textTransform.rotation * Math.PI / 180);

    const anim = currentAnim;
    const tick = progress !== null ? progress * 60 : animTick;
    
    const lines = text.split('\n');
    const totalHeight = lines.length * size * lineHeight;
    let startY = -totalHeight / 2 + size / 2;
    
    lines.forEach((line, lineIndex) => {
        if (!line.trim()) return;
        
        ctx.save();
        let y = startY + lineIndex * size * lineHeight;
        
        applyAnimation(ctx, anim, tick);
        
        drawStrokeAndFill(ctx, line, y, anim, tick, size, letterSpacing);
        
        ctx.restore();
    });
    
    ctx.restore();
}

function applyAnimation(ctx, anim, tick) {
    if(anim === 'scale') {
        ctx.scale(1 + 0.1 * Math.sin(tick/10), 1 + 0.1 * Math.sin(tick/10));
    } else if(anim === 'rotate') {
        ctx.rotate(tick/20);
    } else if(anim === 'bounce') {
        const by = Math.sin(tick/8)*24;
        const impact = Math.max(0, -Math.sin(tick/8));
        ctx.translate(0, by);
        ctx.scale(1 + 0.12*impact, 1 - 0.12*impact);
    } else if(anim === 'slide') {
        ctx.translate(Math.sin(tick/10)*60, 0);
    } else if(anim === 'scale-rotate') {
        ctx.scale(1 + 0.08 * Math.sin(tick/10), 1 + 0.08 * Math.sin(tick/10));
        ctx.rotate(tick/15);
    } else if(anim === 'breath') {
        const scale = 1 + 0.12 * Math.sin(tick/16);
        ctx.scale(scale, scale);
        ctx.globalAlpha *= 0.7 + 0.3 * Math.abs(Math.sin(tick/16));
    } else if(anim === 'shake-random') {
        ctx.translate((Math.random()-0.5)*8, (Math.random()-0.5)*8);
    } else if(anim === 'fade' || anim === 'blink') {
        ctx.globalAlpha = 0.5 + 0.5*Math.sin(tick/10);
    } else if(anim === 'flipY') {
        ctx.scale(1, Math.cos(Math.sin(tick/20)*Math.PI));
    } else if(anim === 'flipX') {
        ctx.scale(Math.cos(Math.sin(tick/20)*Math.PI), 1);
    } else if(anim === 'spring') {
        const scale = 1 + 0.3 * Math.abs(Math.sin(tick/8));
        ctx.scale(scale, 1/scale);
    } else if(anim === 'shake') {
        ctx.translate(Math.sin(tick/4)*15, 0);
    } else if(anim === 'scale-blink') {
        const scale = 1 + 0.2 * Math.sin(tick/10);
        ctx.scale(scale, scale);
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(tick/10);
    } else if(anim === 'drop') {
        ctx.translate(0, Math.abs(Math.sin(tick/10))*60);
    } else if(anim === 'stretch') {
        ctx.scale(1 + 0.5 * Math.sin(tick/10), 1);
    }
}

function drawStrokeAndFill(ctx, line, y, anim, tick, size, letterSpacing) {
    const chars = line.split('');
    const midIndex = (chars.length - 1) / 2;
    let typeCount = anim === 'typewriter' ? Math.min(chars.length, Math.max(0, Math.floor((tick/2) % (chars.length + 1)))) : chars.length;
    
    // 繪製外框
    for(let l=strokeLayers.length-1; l>=0; l--) {
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.strokeStyle = strokeLayers[l].color;
        ctx.lineWidth = strokeLayers[l].width;
        
        applyStrokeEffects(ctx, anim, tick, strokeLayers[l]);
        
        let x = -ctx.measureText(line).width/2;
        chars.forEach((ch, i) => {
            if (i >= typeCount) return;
            const charWidth = ctx.measureText(ch).width;
            const {dx, dy} = getCharOffset(i, midIndex, anim, tick);
            const {charDX, charDY} = getCharAnimation(i, anim, tick);
            
            if(colorMode === 'multi' && anim === 'rainbow') {
                ctx.strokeStyle = `hsl(${((tick*10 + i*40) % 360)}, 90%, 60%)`;
            }
            
            ctx.strokeText(ch, x + charWidth/2 + dx + charDX, y + dy + charDY);
            x += charWidth + letterSpacing;
        });
        ctx.restore();
    }
    
    // 繪製填色
    let fillStyle = colorPicker.value;
    if(anim === 'rainbow') fillStyle = `hsl(${(tick*10)%360}, 90%, 60%)`;
    if(anim === 'color-flow') fillStyle = createColorFlowGradient(ctx, line, tick);
    
    ctx.fillStyle = fillStyle;
    let x = -ctx.measureText(line).width/2;
    chars.forEach((ch, i) => {
        if (i >= typeCount) return;
        const charWidth = ctx.measureText(ch).width;
        const {dx, dy} = getCharOffset(i, midIndex, anim, tick);
        const {charDX, charDY} = getCharAnimation(i, anim, tick);
        
        if(colorMode === 'multi') {
            ctx.fillStyle = multiColors[i] || '#222';
            if(anim === 'rainbow') ctx.fillStyle = `hsl(${((tick*10 + i*40) % 360)}, 90%, 60%)`;
        }
        
        ctx.fillText(ch, x + charWidth/2 + dx + charDX, y + dy + charDY);
        x += charWidth + letterSpacing;
    });
    
    // 打字機游標
    if (anim === 'typewriter') {
        const shownText = line.slice(0, typeCount);
        const baseX = -ctx.measureText(line).width/2;
        const shownWidth = ctx.measureText(shownText).width + typeCount * letterSpacing;
        ctx.save();
        ctx.globalAlpha = 0.2 + 0.8 * (Math.sin(tick/5) > 0 ? 1 : 0);
        ctx.fillRect(baseX + shownWidth + 1, y - size*0.6, 2, size*1.2);
        ctx.restore();
    }
}

function applyStrokeEffects(ctx, anim, tick, layer) {
    if(anim === 'ripple') {
        ctx.shadowBlur = 20 * Math.abs(Math.sin(tick/10));
        ctx.globalAlpha *= 1 - Math.abs(Math.sin(tick/10)) * 0.7;
        ctx.shadowColor = layer.color;
    } else if(anim === 'lightning') {
        ctx.globalAlpha = 0.5 + 0.5 * Math.random();
    } else if(anim === 'blur-blink') {
        ctx.filter = `blur(${2 + 2 * Math.abs(Math.sin(tick/10))}px)`;
        ctx.globalAlpha = 0.7 + 0.3 * Math.abs(Math.sin(tick/10));
    }
}

function getCharOffset(i, midIndex, anim, tick) {
    let dx = 0, dy = 0;
    if (anim === 'split') {
        dx = (i - midIndex) * 20 * Math.sin(tick/10);
    } else if (anim === 'implode') {
        const angle = (i - midIndex) * 0.6 + tick/6;
        const radius = 30 * (0.6 + 0.4 * Math.abs(Math.sin(tick/12)));
        dx = Math.cos(angle) * radius;
        dy = Math.sin(angle) * radius;
    }
    return {dx, dy};
}

function getCharAnimation(i, anim, tick) {
    let charDX = 0, charDY = 0;
    if(anim === 'wave') {
        charDX = Math.sin(tick/6 + i*0.8) * 12;
    } else if (anim === 'jump') {
        charDY = -Math.abs(Math.sin(tick/6 + i*0.9)) * 22;
    } else if (anim === 'jump-wave') {
        charDX = Math.cos(tick/6 + i*0.8) * 10;
        charDY = Math.sin(tick/6 + i*0.8) * 10;
    }
    return {charDX, charDY};
}

function createColorFlowGradient(ctx, line, tick) {
    const lineWidth = ctx.measureText(line).width;
    const xStart = -lineWidth/2;
    const shift = (tick*4) % (lineWidth + 1);
    const grad = ctx.createLinearGradient(xStart - shift, 0, xStart + lineWidth - shift, 0);
    grad.addColorStop(0, '#ff0048');
    grad.addColorStop(0.5, '#00c2ff');
    grad.addColorStop(1, '#7cff00');
    return grad;
}

function animate() {
    drawPreview();
    animTick++;
    if(currentAnim !== 'none') {
        animFrame = requestAnimationFrame(animate);
    }
}

function updatePreview() {
    if(animFrame) cancelAnimationFrame(animFrame);
    animTick = 0;
    if(currentAnim !== 'none') {
        animate();
    } else {
        drawPreview();
    }
}

function updateMultiColorPickers() {
    const chars = (textInput.value || '預覽').split('');
    multiColors.length = chars.length;
    for(let i=0;i<chars.length;i++) {
        if(!multiColors[i]) multiColors[i] = '#'+((Math.random()*0xffffff)|0).toString(16).padStart(6,'0');
    }
    multiColorPickersRow.innerHTML = '';
    chars.forEach((ch, i) => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:4px;';
        row.innerHTML = `<label style="font-size:1.1rem;">第${i+1}字：</label>`;
        const picker = document.createElement('input');
        picker.type = 'color';
        picker.value = multiColors[i];
        picker.className = 'color-picker';
        picker.addEventListener('input', e => {
            multiColors[i] = e.target.value;
            updatePreview();
        });
        row.appendChild(picker);
        multiColorPickersRow.appendChild(row);
    });
}

function renderStrokeLayers() {
    strokeLayersList.innerHTML = '';
    strokeLayers.forEach((layer, idx) => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:4px;';
        row.innerHTML = `
            <span>第${idx+1}層</span>
            <input type="color" value="${layer.color}" style="width:32px;height:32px;">
            <input type="number" min="1" max="20" value="${layer.width}" style="width:50px;">
            <button type="button" class="remove-stroke-layer">刪除</button>
        `;
        row.querySelector('input[type="color"]').addEventListener('input', e => {
            strokeLayers[idx].color = e.target.value;
            updatePreview();
        });
        row.querySelector('input[type="number"]').addEventListener('input', e => {
            strokeLayers[idx].width = parseFloat(e.target.value) || 1;
            updatePreview();
        });
        row.querySelector('.remove-stroke-layer').addEventListener('click', () => {
            if(strokeLayers.length > 1) {
                strokeLayers.splice(idx, 1);
                renderStrokeLayers();
                updatePreview();
            }
        });
        strokeLayersList.appendChild(row);
    });
}

// 事件監聽
textInput.addEventListener('input', () => {
    if(colorMode === 'multi') updateMultiColorPickers();
    updatePreview();
});

fontSizeSlider.addEventListener('input', () => {
    fontSizeValue.textContent = fontSizeSlider.value;
    updatePreview();
});

colorPicker.addEventListener('input', updatePreview);

document.getElementById('letter-spacing').addEventListener('input', (e) => {
    document.getElementById('letter-spacing-value').textContent = e.target.value + 'px';
    updatePreview();
});

document.getElementById('line-height').addEventListener('input', (e) => {
    document.getElementById('line-height-value').textContent = e.target.value;
    updatePreview();
});

animBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        animBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        currentAnim = btn.dataset.anim;
        updatePreview();
    });
});

colorModeRadios.forEach(radio => {
    radio.addEventListener('change', function() {
        colorMode = this.value;
        colorPickerRow.style.display = colorMode === 'single' ? '' : 'none';
        multiColorPickersRow.style.display = colorMode === 'multi' ? '' : 'none';
        if(colorMode === 'multi') updateMultiColorPickers();
        updatePreview();
    });
});

fontUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        customFontName = 'CustomFont_' + Date.now();
        const font = new FontFace(customFontName, ev.target.result);
        font.load().then(loadedFont => {
            document.fonts.add(loadedFont);
            customFontLoaded = true;
            updatePreview();
        }).catch(() => alert('字型載入失敗'));
    };
    reader.readAsArrayBuffer(file);
});

bgUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            backgroundImage = new Image();
            backgroundImage.onload = function() {
                backgroundImageLoaded = true;
                updatePreview();
            };
            backgroundImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

removeBgBtn.addEventListener('click', function() {
    backgroundImage = null;
    backgroundImageLoaded = false;
    bgUpload.value = '';
    updatePreview();
});

addStrokeLayerBtn.addEventListener('click', () => {
    strokeLayers.push({ color: '#000000', width: 2 });
    renderStrokeLayers();
    updatePreview();
});

posXSlider.addEventListener('input', function() {
    textTransform.x = parseInt(this.value);
    updatePreview();
});

posYSlider.addEventListener('input', function() {
    textTransform.y = parseInt(this.value);
    updatePreview();
});

scaleSlider.addEventListener('input', function() {
    textTransform.scale = parseFloat(this.value);
    updatePreview();
});

rotationSlider.addEventListener('input', function() {
    textTransform.rotation = parseInt(this.value);
    updatePreview();
});

resetTransformBtn.addEventListener('click', function() {
    textTransform = { x: 135, y: 135, scale: 1, rotation: 0 };
    posXSlider.value = 135;
    posYSlider.value = 135;
    scaleSlider.value = 1;
    rotationSlider.value = 0;
    updatePreview();
});

// 下載功能
document.getElementById('download-png').addEventListener('click', function() {
    const w = previewCanvas.width, h = previewCanvas.height;
    const imageData = ctx.getImageData(0, 0, w, h);
    let minX = w, minY = h, maxX = 0, maxY = 0;
    for(let y=0; y<h; y++) {
        for(let x=0; x<w; x++) {
            const idx = (y*w + x)*4;
            if(imageData.data[idx+3] > 0) {
                if(x < minX) minX = x;
                if(x > maxX) maxX = x;
                if(y < minY) minY = y;
                if(y > maxY) maxY = y;
            }
        }
    }
    if(minX > maxX || minY > maxY) { minX = 0; minY = 0; maxX = w-1; maxY = h-1; }
    const cutW = maxX - minX + 1, cutH = maxY - minY + 1;
    const cutCanvas = document.createElement('canvas');
    cutCanvas.width = cutW;
    cutCanvas.height = cutH;
    const cutCtx = cutCanvas.getContext('2d');
    cutCtx.drawImage(previewCanvas, minX, minY, cutW, cutH, 0, 0, cutW, cutH);
    const link = document.createElement('a');
    link.download = 'text.png';
    link.href = cutCanvas.toDataURL('image/png');
    link.click();
});

document.getElementById('download-gif').addEventListener('click', function() {
    if(animFrame) cancelAnimationFrame(animFrame);
    const frames = 32, duration = 1;
    let gifFrames = [];
    let minX = previewCanvas.width, minY = previewCanvas.height, maxX = 0, maxY = 0;
    
    for(let i=0;i<frames*duration;i++){
        animTick = i;
        ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        drawPreview(i / (frames*duration));
        const w = previewCanvas.width, h = previewCanvas.height;
        const imageData = ctx.getImageData(0, 0, w, h);
        let fminX = w, fminY = h, fmaxX = 0, fmaxY = 0;
        for(let y=0; y<h; y++) {
            for(let x=0; x<w; x++) {
                const idx = (y*w + x)*4;
                if(imageData.data[idx+3] > 0) {
                    if(x < fminX) fminX = x;
                    if(x > fmaxX) fmaxX = x;
                    if(y < fminY) fminY = y;
                    if(y > fmaxY) fmaxY = y;
                }
            }
        }
        if(fminX > fmaxX || fminY > fmaxY) { fminX = 0; fminY = 0; fmaxX = w-1; fmaxY = h-1; }
        if(fminX < minX) minX = fminX;
        if(fminY < minY) minY = fminY;
        if(fmaxX > maxX) maxX = fmaxX;
        if(fmaxY > maxY) maxY = fmaxY;
        gifFrames.push({minX: fminX, minY: fminY, maxX: fmaxX, maxY: fmaxY});
    }
    
    const cutW = maxX - minX + 1, cutH = maxY - minY + 1;
    const isLocalFile = window.location.protocol === 'file:';
    const gifOptions = {
        workers: isLocalFile ? 0 : 2,
        quality: 10,
        width: cutW,
        height: cutH,
        transparent: 0x00000000
    };
    if (!isLocalFile) gifOptions.workerScript = './gif.worker.js';
    
    let gif = new GIF(gifOptions);
    setTimeout(() => {
        if (colorMode === 'multi') {
            const pickers = multiColorPickersRow.querySelectorAll('input[type="color"]');
            multiColors = [];
            pickers.forEach((picker, i) => { multiColors[i] = picker.value || '#222222'; });
        }
        for(let i=0;i<frames*duration;i++){
            animTick = i;
            ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
            drawPreview(i / (frames*duration));
            const cutCanvas = document.createElement('canvas');
            cutCanvas.width = cutW;
            cutCanvas.height = cutH;
            const cutCtx = cutCanvas.getContext('2d');
            cutCtx.drawImage(previewCanvas, minX, minY, cutW, cutH, 0, 0, cutW, cutH);
            gif.addFrame(cutCanvas, {copy: true, delay: 1000/frames});
        }
        gif.on('finished', function(blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = 'text.gif';
            link.href = url;
            link.click();
            updatePreview();
        });
        gif.render();
    }, 100);
});

async function recordVideo(format) {
    if(animFrame) cancelAnimationFrame(animFrame);
    const frames = 60, fps = 30;
    const videoCanvas = document.createElement('canvas');
    videoCanvas.width = previewCanvas.width;
    videoCanvas.height = previewCanvas.height;
    const videoCtx = videoCanvas.getContext('2d');
    const stream = videoCanvas.captureStream(fps);
    const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000
    });
    
    const chunks = [];
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `text.${format}`;
        link.href = url;
        link.click();
        updatePreview();
    };
    
    mediaRecorder.start();
    for(let i = 0; i < frames; i++) {
        animTick = i * 2;
        videoCtx.clearRect(0, 0, videoCanvas.width, videoCanvas.height);
        if (backgroundImageLoaded && backgroundImage) {
            videoCtx.save();
            videoCtx.globalAlpha = 0.8;
            videoCtx.drawImage(backgroundImage, 0, 0, videoCanvas.width, videoCanvas.height);
            videoCtx.restore();
        }
        const originalCtx = window.ctx;
        window.ctx = videoCtx;
        drawPreview(i / frames);
        window.ctx = originalCtx;
        await new Promise(resolve => setTimeout(resolve, 1000 / fps));
    }
    mediaRecorder.stop();
}

document.getElementById('download-mp4').addEventListener('click', () => recordVideo('mp4'));
document.getElementById('download-webm').addEventListener('click', () => recordVideo('webm'));

// 初始化
if (window.location.protocol === 'file:') {
    document.getElementById('local-file-warning').style.display = 'block';
}
renderStrokeLayers();
updatePreview();