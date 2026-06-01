const MODEL_DIR = "./model/";

let model,
  labels = [];
let running = false;

const HIDE_LABELS = new Set(["none"]);
const isHidden = (name = "") =>
  HIDE_LABELS.has(String(name).trim().toLowerCase());

// 細菌資料庫
const BACTERIA_INFO = {
  "白血球 WBC": {
    name: "白血球 (White Blood Cells)",
    description:
      "尿液中白血球增多通常表示泌尿道有發炎或感染情況。常見疾病包括膀胱炎、腎盂腎炎、尿道炎等。典型症狀包括頻尿、排尿疼痛、尿液混濁，若是腎臟感染還可能出現發燒、腰痛等。若發現白血球異常升高且合併症狀，建議盡快就醫進行尿液培養檢查。",
    image: "img/wbc.jpeg",
  },
  "紅血球 RBC": {
    name: "紅血球 (Red Blood Cells)",
    description:
      "正常情況下尿液中不應含有大量紅血球，若尿液檢查發現紅血球增多（稱為血尿），代表泌尿系統某處有出血情況。造成血尿的原因很多，包括泌尿道感染、尿路結石、腎臟疾病、泌尿道腫瘤，或是劇烈運動後的暫時性血尿。若出現血尿特別是合併疼痛、頻尿、排尿困難等症狀，建議儘快就醫。",
    image: "img/RBC.jpeg",
  },
  "克雷伯氏菌 Klebsiella": {
    name: "克雷伯氏菌 (Klebsiella)",
    description:
      "克雷伯氏菌正常存在於人體腸道。可造成泌尿道感染、肺炎、傷口感染及敗血症等。常見高危險群包括住院病人、免疫力低下者及慢性病患者。許多已演變成對多數抗生素有抗藥性的「超級細菌」，治療困難。",
    image: "img/klebsiella.jpg",
  },
  "葡萄球菌 SA": {
    name: "葡萄球菌 (Staphylococcus aureus)",
    description:
      "葡萄球菌廣泛存在於人體皮膚、鼻腔等部位。常見感染包括皮膚感染、傷口感染、食物中毒，嚴重時可能引發敗血症。最大問題是抗藥性，許多已演變成對多種抗生素具抗藥性的「超級細菌」。預防包括保持手部衛生、妥善處理傷口。",
    image: "img/SA.jpeg",
  },
  "念珠菌 Candida": {
    name: "念珠菌 (Candida)",
    description:
      "念珠菌是一種真菌，常見高危險群包括免疫力低下者、糖尿病患者、長期使用抗生素者、懷孕婦女及長期留置導尿管的病人。念珠菌感染可造成泌尿道發炎，治療使用抗真菌藥物，同時需改善危險因子如控制血糖。",
    image: "img/Candida.jpg",
  },
  "表皮細胞 Epithelial Cells": {
    name: "表皮細胞 (Epithelial Cells)",
    description:
      "尿液中發現少量表皮細胞是正常現象。若出現大量，可能代表檢體採集時受到污染或尿道發炎。建議採用「中段尿」方式採檢，先排出一些尿液沖洗尿道口，再收集中段尿液送檢以獲得準確結果。",
    image: "img/EPC.jpeg",
  },
  "大腸桿菌 Escherichia coli": {
    name: "大腸桿菌 (Escherichia coli)",
    description:
      "大腸桿菌是泌尿道感染最常見的致病菌，約佔所有案例的70-80%。感染可引起膀胱炎、腎盂腎炎，嚴重時可能導致敗血症。治療使用抗生素，需完整服用療程。預防包括多喝水、不憋尿、保持會陰部清潔乾爽等。",
    image: "img/coli.png",
  },
  "尿結晶 Urine Crystals": {
    name: "尿結晶 (Urine Crystals)",
    description:
      "尿結晶是尿液中礦物質析出形成的微小晶體。少量通常無害，但若持續大量出現可能聚集形成「尿路結石」，引起劇烈疼痛、血尿、排尿困難。預防方法包括每天攝取充足水分（2000-2500毫升）、均衡飲食、定期健康檢查等。",
    image: "img/uc.jpeg",
  },
};

// 類別顯示名稱對照表（可自由修改）
const LABEL_DISPLAY = {
  "白血球 WBC": "白血球 (WBC)",
  "紅血球 RBC": "紅血球 (RBC)",
  "克雷伯氏菌 Klebsiella": "克雷伯氏菌 (Klebsiella)",
  "葡萄球菌 SA": "葡萄球菌 (SA)",
  "念珠菌 Candida": "念珠菌 (Candida)",
  "表皮細胞 Epithelial Cells": "表皮細胞 (Epithelial Cells)",
  "大腸桿菌 Escherichia coli": "大腸桿菌 (E. coli)",
  "尿結晶 Urine Crystals": "尿結晶 (Urine Crystals)",
};

// 取得顯示名稱，找不到就回傳原始 label
const getDisplayName = (label) => LABEL_DISPLAY[label] || label;
const els = {
  canvas: document.getElementById("webcam-canvas"),
  list: document.getElementById("list"),
  status: document.getElementById("status"),
  modelName: document.getElementById("modelName"),
  infoContent: document.getElementById("infoContent"),
};
const videoEl = document.getElementById("videoElement");
const setStatus = (t) => (els.status.textContent = t);

// 攝影機
async function startCamera() {
  setStatus("請求鏡頭權限…");
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: "user",
    },
    audio: false,
  });
  videoEl.srcObject = stream;
  await new Promise((resolve) => {
    videoEl.onloadedmetadata = resolve;
  });
}

// 自動啟動
async function autoStart() {
  try {
    await startCamera();
    setStatus("載入模型中…");

    const base = MODEL_DIR.endsWith("/") ? MODEL_DIR : MODEL_DIR + "/";

    // 讀 metadata 取得 labels
    const metaRes = await fetch(base + "metadata.json");
    if (!metaRes.ok) throw new Error("找不到 metadata.json");
    const metadata = await metaRes.json();
    labels = metadata.labels || [];
    console.log("📋 labels：", labels);

    // 用 tf.loadLayersModel 載入 TM 模型
    model = await tf.loadLayersModel(base + "model.json");

    const visibleCount = labels.filter((n) => !isHidden(n)).length;
    els.modelName.textContent =
      (metadata.modelName || "自訂模型") + `（${visibleCount} 類）`;

    buildClassList();
    setStatus("辨識中");
    running = true;
    loop();
  } catch (err) {
    console.error(err);
    setStatus("⚠️ 載入失敗：" + err.message);
  }
}

// 建立結果列表
function buildClassList() {
  els.list.innerHTML = "";
  labels.forEach((name, idx) => {
    if (isHidden(name)) return;
    const div = document.createElement("div");
    div.className = "result-item not-detected";
    div.dataset.idx = idx;
    div.innerHTML = `
      <div class="progress-container">
        <span class="class-name">${getDisplayName(name)}</span>
        <div class="progress-bar">
          <div class="progress-fill" id="p${idx}" style="width:0%;"></div>
        </div>
        <span class="percentage" id="p${idx}-text">0%</span>
      </div>
    `;
    els.list.appendChild(div);
  });
}

// 主偵測循環
async function loop() {
  if (!running) return;

  try {
    // TM 模型已輸出 softmax 機率，直接用，不要再做 softmax
    const probs = tf.tidy(() => {
      const img = tf.browser
        .fromPixels(videoEl) // 直接從 video 取像素
        .resizeBilinear([224, 224])
        .toFloat()
        .div(255)
        .expandDims(0);
      return Array.from(model.predict(img).dataSync());
    });

    console.log(
      "🔢 原始機率：",
      labels.map((l, i) => `${l}:${(probs[i] * 100).toFixed(1)}%`).join(", "),
    );

    // 找 none 的 index
    const noneIdx = labels.findIndex((n) => n.trim().toLowerCase() === "none");
    const noneProb = noneIdx >= 0 ? probs[noneIdx] : 0;

    // 找可見 label 中最高分
    let bestIdx = -1,
      bestProb = -1;
    labels.forEach((name, i) => {
      if (isHidden(name)) return;
      if (probs[i] > bestProb) {
        bestProb = probs[i];
        bestIdx = i;
      }
    });

    // 如果 none 比所有類別都高，清空
    if (noneProb >= bestProb || bestIdx === -1) {
      clearBars();
      setStatus("未偵測到目標");
      setTimeout(loop, 1000);
      return;
    }

    // 更新所有進度條
    labels.forEach((name, i) => {
      if (isHidden(name)) return;
      const bar = document.getElementById(`p${i}`);
      const txt = document.getElementById(`p${i}-text`);
      const item = els.list.querySelector(`[data-idx="${i}"]`);
      if (!bar || !txt) return;
      const pct = Math.round(probs[i] * 100);
      bar.style.width = pct + "%";
      txt.textContent = pct + "%";
      if (item) {
        if (pct > 0) item.classList.remove("not-detected");
        else item.classList.add("not-detected");
      }
    });

    const bestPct = Math.round(bestProb * 100);
    setStatus(`${labels[bestIdx]}：${bestPct}%`);

    // 顯示細菌介紹
    console.log(
      `🦠 最高：${labels[bestIdx]} ${bestPct}% | key存在：${!!BACTERIA_INFO[labels[bestIdx]]}`,
    );
    updateBacteriaInfo(labels[bestIdx]);
  } catch (e) {
    console.error("[Predict Error]", e);
    setStatus("預測錯誤");
  }

  setTimeout(loop, 1000);
}

// 清空進度條
function clearBars() {
  labels.forEach((_, i) => {
    const bar = document.getElementById(`p${i}`);
    const txt = document.getElementById(`p${i}-text`);
    const item = els.list.querySelector(`[data-idx="${i}"]`);
    if (bar) bar.style.width = "0%";
    if (txt) txt.textContent = "0%";
    if (item) item.classList.add("not-detected");
  });
  updateBacteriaInfo(null);
}

// 細菌介紹
function updateBacteriaInfo(bacteriaName) {
  if (!bacteriaName || !BACTERIA_INFO[bacteriaName]) {
    els.infoContent.innerHTML = `
      <div class="info-empty"><p>尚未偵測到細菌</p></div>
    `;
    return;
  }
  const info = BACTERIA_INFO[bacteriaName];
  els.infoContent.innerHTML = `
    <div class="bacteria-detail">
      ${info.image ? `<img src="${info.image}" alt="${info.name}" class="bacteria-image">` : ""}
      <div class="bacteria-description">
        <h4>${info.name}</h4>
        <p>${info.description}</p>
      </div>
    </div>
  `;
}

window.addEventListener("load", autoStart);
