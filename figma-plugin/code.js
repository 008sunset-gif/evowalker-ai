// Helper to convert Hex to Figma RGB (0-1)
function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 };
}

// Design Token Colors
const colors = {
  bgMain: hexToRgb("#05070c"),
  bgPanel: hexToRgb("#0f172a"),
  textPrimary: hexToRgb("#f8fafc"),
  textSecondary: hexToRgb("#94a3b8"),
  cyan: hexToRgb("#4fd1c5"),
  purple: hexToRgb("#c084fc"),
  red: hexToRgb("#f56565"),
  yellow: hexToRgb("#ecc94b"),
  green: hexToRgb("#48bb78")
};

// Create a Styled Frame helper
function createStyledFrame(name, x, y, width = 1440, height = 900) {
  const frame = figma.createFrame();
  frame.name = name;
  frame.x = x;
  frame.y = y;
  frame.resize(width, height);
  frame.fills = [{ type: 'SOLID', color: colors.bgMain }];
  return frame;
}

// Create a Styled Text helper
function createStyledText(parent, characters, x, y, size, weight = "Regular", color = colors.textPrimary, width = null) {
  const text = figma.createText();
  parent.appendChild(text);
  text.fontName = { family: "Inter", style: weight };
  text.characters = characters;
  text.fontSize = size;
  text.fills = [{ type: 'SOLID', color: color }];
  text.x = x;
  text.y = y;
  if (width !== null) {
    text.textAutoResize = "HEIGHT";
    text.resize(width, text.height);
  }
  return text;
}

// Create a Styled Card/Panel helper
function createStyledCard(parent, name, x, y, width, height, strokeColor = colors.cyan, opacity = 0.4) {
  const rect = figma.createRectangle();
  parent.appendChild(rect);
  rect.name = name;
  rect.x = x;
  rect.y = y;
  rect.resize(width, height);
  rect.fills = [{ type: 'SOLID', color: colors.bgPanel, opacity: opacity }];
  rect.strokes = [{ type: 'SOLID', color: strokeColor, opacity: 0.2 }];
  rect.strokeWeight = 1;
  rect.cornerRadius = 12;
  return rect;
}

// Create a Styled Button helper
function createStyledButton(parent, textStr, x, y, width, height, isPrimary = true) {
  const rect = figma.createRectangle();
  parent.appendChild(rect);
  rect.name = "Button - " + textStr;
  rect.x = x;
  rect.y = y;
  rect.resize(width, height);
  rect.cornerRadius = 8;
  
  if (isPrimary) {
    rect.fills = [{ type: 'SOLID', color: colors.cyan }];
  } else {
    rect.fills = [{ type: 'SOLID', color: colors.bgPanel, opacity: 0.2 }];
    rect.strokes = [{ type: 'SOLID', color: colors.textSecondary, opacity: 0.3 }];
    rect.strokeWeight = 1;
  }
  
  const text = figma.createText();
  parent.appendChild(text);
  text.fontName = { family: "Inter", style: "Bold" };
  text.characters = textStr;
  text.fontSize = 14;
  text.fills = [{ type: 'SOLID', color: isPrimary ? colors.bgMain : colors.textPrimary }];
  
  // Center text inside button rectangle
  text.x = x + (width - text.width) / 2;
  text.y = y + (height - text.height) / 2;
}

// Create standard Page Header (Step Indicator & Page Title)
function createPageHeader(frame, title, stepText) {
  // Navigation / Header bar panel
  const navBg = figma.createRectangle();
  frame.appendChild(navBg);
  navBg.name = "Header Bar Background";
  navBg.resize(1440, 70);
  navBg.fills = [{ type: 'SOLID', color: colors.bgPanel, opacity: 0.3 }];
  navBg.strokes = [{ type: 'SOLID', color: colors.textSecondary, opacity: 0.1 }];
  navBg.strokeWeight = 1;

  // Title
  createStyledText(frame, "EVODRIVE AI", 60, 24, 16, "Bold", colors.cyan);
  
  // Step indicator
  if (stepText) {
    const stepBox = figma.createRectangle();
    frame.appendChild(stepBox);
    stepBox.name = "Step Badge";
    stepBox.resize(120, 28);
    stepBox.x = 1260;
    stepBox.y = 21;
    stepBox.fills = [{ type: 'SOLID', color: colors.cyan, opacity: 0.1 }];
    stepBox.cornerRadius = 20;

    const sText = figma.createText();
    frame.appendChild(sText);
    sText.fontName = { family: "Inter", style: "Bold" };
    sText.characters = stepText;
    sText.fontSize = 12;
    sText.fills = [{ type: 'SOLID', color: colors.cyan }];
    sText.x = 1260 + (120 - sText.width) / 2;
    sText.y = 21 + (28 - sText.height) / 2;
  }

  // Large Page Title in main content
  createStyledText(frame, title, 80, 120, 24, "Bold", colors.textPrimary);
  createStyledText(frame, "自律走行AIの進化シミュレーション", 80, 155, 13, "Regular", colors.textSecondary);
}

// Generate the 7 screens of Evodrive AI
async function main() {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });

  const screenWidth = 1440;
  const screenHeight = 900;
  const gap = 1600;

  // ==========================================
  // 01_Top (トップ画面)
  // ==========================================
  const frameTop = createStyledFrame("01_Top", 0 * gap, 0);
  // Grid background visual effect (circles as glowing orbs)
  const glow = figma.createEllipse();
  frameTop.appendChild(glow);
  glow.resize(600, 600);
  glow.x = 420;
  glow.y = 150;
  glow.fills = [{ type: 'SOLID', color: colors.cyan, opacity: 0.05 }];
  glow.effects = [{ type: 'LAYER_BLUR', radius: 100, visible: true }];

  createStyledText(frameTop, "EVODRIVE AI", 420, 320, 56, "Bold", colors.textPrimary);
  createStyledText(frameTop, "2D 自律走行AI自動学習シミュレーター", 425, 400, 20, "Regular", colors.cyan);
  createStyledText(frameTop, "遺伝的アルゴリズムとセンサー情報による自動運転の進化を体感する。", 425, 440, 14, "Regular", colors.textSecondary);
  createStyledButton(frameTop, "シミュレーションを開始する ➔", 425, 520, 280, 50);


  // ==========================================
  // 02_ScenarioSelect (シナリオ選択画面)
  // ==========================================
  const frameScenario = createStyledFrame("02_ScenarioSelect", 1 * gap, 0);
  createPageHeader(frameScenario, "🚗 テストシナリオの選択", "Step 1 / 3");

  // 3 cards for Scenarios
  const cardW = 380;
  const cardH = 340;
  const cardY = 240;
  const scenarios = [
    { title: "市街地テストコース", desc: "直線とシンプルな障害物が配置された基本練習用コース。AIの基礎行動検証に最適。", level: "★☆☆☆☆", x: 80, stroke: colors.cyan },
    { title: "高速道路ハイウェイ", desc: "長い直線と合流、他車障害物が配置された高速回避コース。最高速度の学習を促進。", level: "★★★☆☆", x: 490, stroke: colors.purple },
    { title: "サーキットロード", desc: "ヘアピンカーブと連続S字が存在するテクニカルコース。高度な減速・旋回の進化が必要。", level: "★★★★★", x: 900, stroke: colors.yellow }
  ];

  scenarios.forEach(sc => {
    createStyledCard(frameScenario, "Card - " + sc.title, sc.x, cardY, cardW, cardH, sc.stroke);
    
    // Thumbnail placeholder inside card
    const thumb = figma.createRectangle();
    frameScenario.appendChild(thumb);
    thumb.name = "Thumbnail Placeholder";
    thumb.resize(cardW - 40, 150);
    thumb.x = sc.x + 20;
    thumb.y = cardY + 20;
    thumb.fills = [{ type: 'SOLID', color: colors.bgMain, opacity: 0.5 }];
    thumb.cornerRadius = 6;

    createStyledText(frameScenario, sc.title, sc.x + 20, cardY + 190, 16, "Bold", colors.textPrimary);
    createStyledText(frameScenario, sc.desc, sc.x + 20, cardY + 225, 12, "Regular", colors.textSecondary, cardW - 40);
    createStyledText(frameScenario, "難易度: " + sc.level, sc.x + 20, cardY + 300, 11, "Bold", sc.stroke);
  });

  // Actions
  createStyledButton(frameScenario, "⬅ 戻る", 80, 760, 120, 45, false);
  createStyledButton(frameScenario, "AIパラメータ設定へ進む ➔", 1120, 760, 240, 45);


  // ==========================================
  // 03_AIConfig (AI設定画面)
  // ==========================================
  const frameConfig = createStyledFrame("03_AIConfig", 2 * gap, 0);
  createPageHeader(frameConfig, "⚙️ AIパラメータ設定", "Step 2 / 3");

  // Left Column Config Panels
  createStyledCard(frameConfig, "Panel - Config Personality", 80, 220, 600, 460, colors.cyan);
  createStyledText(frameConfig, "1. AIの性格優先方針 (ゲノム初期バイアス)", 110, 250, 16, "Bold", colors.cyan);
  
  // Segment options
  createStyledCard(frameConfig, "Opt - Safety", 110, 300, 160, 80, colors.green);
  createStyledText(frameConfig, "安全重視 (Safety)", 130, 330, 14, "Bold", colors.green);
  
  createStyledCard(frameConfig, "Opt - Balance", 300, 300, 160, 80, colors.cyan);
  createStyledText(frameConfig, "バランス (Balance)", 320, 330, 14, "Bold", colors.cyan);
  
  createStyledCard(frameConfig, "Opt - Speed", 490, 300, 160, 80, colors.red);
  createStyledText(frameConfig, "速度重視 (Speed)", 510, 330, 14, "Bold", colors.red);

  // Other Sliders
  createStyledText(frameConfig, "2. 学習スピード (突然変異率のレンジ)", 110, 420, 14, "Bold", colors.textPrimary);
  createStyledCard(frameConfig, "Slider - Slow", 110, 450, 160, 40, colors.textSecondary, 0.1);
  createStyledText(frameConfig, "ゆっくり (5%)", 130, 460, 12, "Regular", colors.textSecondary);
  createStyledCard(frameConfig, "Slider - Normal", 300, 450, 160, 40, colors.cyan, 0.2);
  createStyledText(frameConfig, "標準 (15%)", 340, 460, 12, "Bold", colors.cyan);
  createStyledCard(frameConfig, "Slider - Fast", 490, 450, 160, 40, colors.textSecondary, 0.1);
  createStyledText(frameConfig, "急激 (30%)", 530, 460, 12, "Regular", colors.textSecondary);

  // Car population & max generations dropdowns
  createStyledText(frameConfig, "3. 同時走行車両数 (Population size)", 110, 530, 14, "Bold", colors.textPrimary);
  createStyledCard(frameConfig, "Select - CarCount", 110, 560, 240, 40, colors.textSecondary, 0.1);
  createStyledText(frameConfig, "通常台数 (30台) ▼", 130, 570, 12, "Regular", colors.textPrimary);

  createStyledText(frameConfig, "4. 最大学習世代数 (Max Generations)", 410, 530, 14, "Bold", colors.textPrimary);
  createStyledCard(frameConfig, "Select - GenCount", 410, 560, 240, 40, colors.textSecondary, 0.1);
  createStyledText(frameConfig, "30世代 (約15分) ▼", 430, 570, 12, "Regular", colors.textPrimary);

  // Right Column Preview Details
  createStyledCard(frameConfig, "Panel - Config Summary", 760, 220, 600, 460, colors.purple);
  createStyledText(frameConfig, "📐 設定パラメータ解説", 790, 250, 16, "Bold", colors.purple);
  createStyledText(frameConfig, "選択されたパラメータによるAI走行特性のシミュレーション予測データが表示されます。これらは第1世代の初期ゲノムパラメータに多様性を伴って配分されます。", 790, 290, 13, "Regular", colors.textSecondary, 540);

  const bulletY = [370, 420, 470, 520];
  const bulletTexts = [
    "・安全重視：最高速度を抑え、コーナー手前で大幅に減速し、ブレのない走りを狙う。",
    "・学習スピード：変異率が高いと急激な進化がある一方、良い遺伝子が壊れやすくなります。",
    "・車両数：台数が多いほど、1世代あたりの探索多様性が向上します。",
    "・世代数：世代が進むほど、エリート選抜と突然変異によって走行性能が向上します。"
  ];
  bulletTexts.forEach((bt, idx) => {
    createStyledText(frameConfig, bt, 790, bulletY[idx], 12, "Regular", colors.textPrimary, 540);
  });

  // Actions
  createStyledButton(frameConfig, "⬅ 戻る", 80, 760, 120, 45, false);
  createStyledButton(frameConfig, "ブリーフィングを確認する ➔", 1100, 760, 260, 45);


  // ==========================================
  // 04_Briefing (ブリーフィング画面)
  // ==========================================
  const frameBriefing = createStyledFrame("04_Briefing", 3 * gap, 0);
  createPageHeader(frameBriefing, "📋 シミュレーション前ブリーフィング", "Step 3 / 3");

  // Summary header bar inside content
  createStyledCard(frameBriefing, "Briefing Summary Bar", 80, 220, 1280, 80, colors.purple);
  createStyledText(frameBriefing, "設定完了：サーキットロード  |  AI性格：バランス  |  走行数：30台  |  学習スピード：標準  |  世代数：30世代", 120, 250, 14, "Bold", colors.textPrimary);

  // Left Column: Initial Genome Radar bar chart mockup
  createStyledCard(frameBriefing, "Panel - Genome Metrics", 80, 330, 600, 360, colors.cyan);
  createStyledText(frameBriefing, "🧬 第1世代の初期ゲノム分布（基準値）", 110, 360, 16, "Bold", colors.cyan);

  const metrics = [
    { name: "最高速度限界 (maxSpeedFactor)", val: 1.0, color: colors.cyan },
    { name: "旋回レスポンス (steeringResponsiveness)", val: 1.0, color: colors.purple },
    { name: "ブレーキ感度 (brakeSensitivity)", val: 1.0, color: colors.yellow },
    { name: "安全マージン (safetyMargin)", val: 1.0, color: colors.green },
    { name: "走行ブレ係数 (noiseFactor)", val: 1.0, color: colors.red }
  ];
  
  metrics.forEach((m, idx) => {
    const yOffset = 410 + idx * 50;
    createStyledText(frameBriefing, m.name, 110, yOffset, 12, "Regular", colors.textSecondary);
    
    // Bar container
    const barBg = figma.createRectangle();
    frameBriefing.appendChild(barBg);
    barBg.resize(360, 10);
    barBg.x = 110;
    barBg.y = yOffset + 22;
    barBg.fills = [{ type: 'SOLID', color: colors.bgMain }];
    barBg.cornerRadius = 5;

    // Active bar
    const barActive = figma.createRectangle();
    frameBriefing.appendChild(barActive);
    barActive.resize(180, 10); // 1.0 = middle (180px of 360px)
    barActive.x = 110;
    barActive.y = yOffset + 22;
    barActive.fills = [{ type: 'SOLID', color: m.color }];
    barActive.cornerRadius = 5;

    createStyledText(frameBriefing, "1.0", 490, yOffset + 18, 12, "Bold", colors.textPrimary);
  });

  // Right Column: Explanation and initial failure warning
  createStyledCard(frameBriefing, "Panel - Failure warning details", 760, 330, 600, 360, colors.yellow);
  createStyledText(frameBriefing, "⚠️ シミュレーション開始前のご案内", 790, 360, 16, "Bold", colors.yellow);
  
  const warnText = "第1世代のAIはランダムなパラメータ多様性を持って生まれるため、最初はコース中央を走れず、即クラッシュ（衝突・道路逸脱）が多発します。\n\nしかし、世代交代（エリート選抜 ＆ 突然変異）を繰り返すことで、ブレが収束し、最適なブレーキ判断とステアリング角度をAI自身が自律獲得していきます。進化の様子をお楽しみください。";
  createStyledText(frameBriefing, warnText, 790, 400, 13, "Regular", colors.textSecondary, 540);

  // Actions
  createStyledButton(frameBriefing, "⬅ 設定に戻る", 80, 760, 150, 45, false);
  createStyledButton(frameBriefing, "シミュレーションを起動 ➔", 1080, 760, 280, 45);


  // ==========================================
  // 05_Simulation (シミュレーション画面)
  // ==========================================
  const frameSim = createStyledFrame("05_Simulation", 4 * gap, 0);
  
  // Header panel for simulation
  const simHeader = figma.createRectangle();
  frameSim.appendChild(simHeader);
  simHeader.resize(1440, 70);
  simHeader.fills = [{ type: 'SOLID', color: colors.bgPanel, opacity: 0.3 }];
  
  createStyledText(frameSim, "🚗 AI走行シミュレーター (走行中)", 60, 24, 16, "Bold", colors.textPrimary);
  
  const statusBadge = figma.createRectangle();
  frameSim.appendChild(statusBadge);
  statusBadge.resize(180, 28);
  statusBadge.x = 1200;
  statusBadge.y = 21;
  statusBadge.fills = [{ type: 'SOLID', color: colors.cyan, opacity: 0.1 }];
  statusBadge.cornerRadius = 20;

  const stText = figma.createText();
  frameSim.appendChild(stText);
  stText.fontName = { family: "Inter", style: "Bold" };
  stText.characters = "ステージ: サーキット";
  stText.fontSize = 11;
  stText.fills = [{ type: 'SOLID', color: colors.cyan }];
  stText.x = 1200 + (180 - stText.width) / 2;
  stText.y = 21 + (28 - stText.height) / 2;

  // Left Column: 2D Canvas Panel
  createStyledCard(frameSim, "Panel - Canvas Simulator", 80, 110, 800, 520, colors.cyan);
  createStyledText(frameSim, "LIVE 自律走行 2D物理シミュレーター (Canvas)", 110, 130, 12, "Bold", colors.textSecondary);
  
  // Outer road mockup inside Canvas
  const roadMock = figma.createRectangle();
  frameSim.appendChild(roadMock);
  roadMock.resize(740, 360);
  roadMock.x = 110;
  roadMock.y = 160;
  roadMock.fills = [{ type: 'SOLID', color: colors.bgMain }];
  roadMock.strokes = [{ type: 'SOLID', color: colors.textSecondary, opacity: 0.2 }];
  roadMock.strokeWeight = 1;
  roadMock.cornerRadius = 8;
  
  // Center line representation (dashed lines as smaller rectangles)
  for (let d = 0; d < 5; d++) {
    const dash = figma.createRectangle();
    frameSim.appendChild(dash);
    dash.resize(40, 2);
    dash.x = 200 + d * 120;
    dash.y = 340;
    dash.fills = [{ type: 'SOLID', color: colors.textSecondary, opacity: 0.3 }];
  }

  // Simulation speed control bar
  createStyledCard(frameSim, "Control Panel", 80, 650, 800, 70, colors.cyan, 0.2);
  createStyledButton(frameSim, "⏸ 一時停止", 110, 663, 140, 44);
  createStyledText(frameSim, "走行スピード: ", 300, 675, 12, "Bold", colors.textSecondary);
  createStyledButton(frameSim, "1x", 410, 665, 50, 40);
  createStyledButton(frameSim, "2x", 470, 665, 50, 40, false);
  createStyledButton(frameSim, "5x", 530, 665, 50, 40, false);

  // Right Column: Telemetry Panels
  createStyledCard(frameSim, "Panel - Telemetry Card", 920, 110, 440, 320, colors.green);
  createStyledText(frameSim, "📈 走行テレメトリ", 950, 140, 15, "Bold", colors.green);

  const tMetrics = [
    { name: "現在世代", val: "12 / 30", x: 950, y: 190, valColor: colors.cyan },
    { name: "生存台数", val: "18 / 30 台", x: 1140, y: 190, valColor: colors.green },
    { name: "最高スコア", val: "4210 pts", x: 950, y: 290, valColor: colors.purple },
    { name: "改善率", val: "+84 %", x: 1140, y: 290, valColor: colors.cyan }
  ];

  tMetrics.forEach(tm => {
    createStyledText(frameSim, tm.name, tm.x, tm.y, 11, "Regular", colors.textSecondary);
    createStyledText(frameSim, tm.val, tm.x, tm.y + 20, 24, "Bold", tm.valColor);
  });

  // Log View Panel
  createStyledCard(frameSim, "Panel - Evolution Logs", 920, 450, 440, 270, colors.purple);
  createStyledText(frameSim, "📝 AI進化ログ出力 (最新3件)", 950, 475, 13, "Bold", colors.purple);
  
  const logLines = [
    "[システム] 第12世代を生成しました。",
    "[システム] AI-04の走行特性を次世代へ引き継ぎました。",
    "[システム] 最高スコアが 12% 改善しました (4210 pts)。"
  ];
  logLines.forEach((ll, idx) => {
    createStyledText(frameSim, ll, 950, 520 + idx * 40, 11, "Regular", colors.textPrimary, 380);
  });

  // Actions
  createStyledButton(frameSim, "設定に戻る", 80, 770, 150, 45, false);
  createStyledButton(frameSim, "分析へ進む 📊", 1120, 770, 240, 45);


  // ==========================================
  // 06_Analysis (世代分析画面)
  // ==========================================
  const frameAnalysis = createStyledFrame("06_Analysis", 5 * gap, 0);
  createPageHeader(frameAnalysis, "📈 走行データの世代分析", "シミュレーション完了");

  // Left Column: SVG Graph panel mockup
  createStyledCard(frameAnalysis, "Panel - SVG Graph Main", 80, 220, 600, 500, colors.cyan);
  createStyledText(frameAnalysis, "📊 AI適応度（スコア）の推移", 110, 250, 16, "Bold", colors.cyan);
  createStyledText(frameAnalysis, "実線: ベストスコアの推移 (シアン)  /  破線: 平均スコアの推移 (パープル)", 110, 280, 12, "Regular", colors.textSecondary);

  // Graph Area Mockup
  const graphArea = figma.createRectangle();
  frameAnalysis.appendChild(graphArea);
  graphArea.resize(540, 260);
  graphArea.x = 110;
  graphArea.y = 310;
  graphArea.fills = [{ type: 'SOLID', color: colors.bgMain }];
  graphArea.strokes = [{ type: 'SOLID', color: colors.textSecondary, opacity: 0.1 }];
  graphArea.strokeWeight = 1;
  graphArea.cornerRadius = 6;

  // Fake chart curve paths (as polygons)
  const fakePath = figma.createPolygon();
  frameAnalysis.appendChild(fakePath);
  fakePath.resize(500, 120);
  fakePath.x = 130;
  fakePath.y = 380;
  fakePath.fills = [{ type: 'SOLID', color: colors.cyan, opacity: 0.1 }];
  fakePath.strokes = [{ type: 'SOLID', color: colors.cyan }];
  fakePath.strokeWeight = 2;

  createStyledText(frameAnalysis, "第1世代", 110, 580, 11, "Regular", colors.textSecondary);
  createStyledText(frameAnalysis, "第30世代", 600, 580, 11, "Regular", colors.textSecondary);

  // Mini summary stats beneath chart
  createStyledText(frameAnalysis, "初期スコア: 1200 pts", 110, 630, 12, "Bold", colors.textSecondary);
  createStyledText(frameAnalysis, "最高スコア: 8420 pts", 310, 630, 12, "Bold", colors.cyan);
  createStyledText(frameAnalysis, "改善率: +601 %", 510, 630, 12, "Bold", colors.green);

  // Right Column: Ranking & Comparison Panel
  createStyledCard(frameAnalysis, "Panel - Ranking details", 740, 220, 620, 240, colors.purple);
  createStyledText(frameAnalysis, "🏆 第 30 世代 走行ランキング (トップ3)", 770, 245, 14, "Bold", colors.purple);

  // Fake ranking cards
  const rankY = [285, 335, 385];
  const rankColors = [colors.yellow, colors.textSecondary, colors.purple];
  const rankTexts = [
    "Rank 1  |  AI-04  |  8420 pts  |  生存率 100%  |  ゴール到達",
    "Rank 2  |  AI-18  |  7890 pts  |  生存率 100%  |  ゴール到達",
    "Rank 3  |  AI-09  |  6540 pts  |  生存率 80%  |  コースアウト"
  ];
  rankTexts.forEach((rt, idx) => {
    createStyledCard(frameAnalysis, "RankItem " + (idx+1), 770, rankY[idx], 560, 42, rankColors[idx], 0.1);
    createStyledText(frameAnalysis, rt, 790, rankY[idx] + 14, 11, "Regular", colors.textPrimary);
  });

  // Comparison Table Panel
  createStyledCard(frameAnalysis, "Panel - Comparison Info", 740, 480, 620, 240, colors.green);
  createStyledText(frameAnalysis, "⚖️ 初期世代 vs 最終世代の比較", 770, 505, 14, "Bold", colors.green);

  // Mock table rows
  createStyledText(frameAnalysis, "指標      |  初期 (第1世代)  |  最終 (第30世代)  |  変化", 770, 545, 11, "Bold", colors.textSecondary);
  const rows = [
    "ベストスコア  |  1200 pts  |  8420 pts  |  +601%",
    "平均スコア  |  840 pts  |  5820 pts  |  +592%",
    "クラッシュ率  |  100 %  |  20 %  |  -80%",
    "到達WP数  |  2 WP  |  7 WP  |  +5 WP"
  ];
  rows.forEach((rText, idx) => {
    createStyledText(frameAnalysis, rText, 770, 580 + idx * 30, 11, "Regular", colors.textPrimary);
  });

  // Actions
  createStyledButton(frameAnalysis, "⬅ シミュレーションへ", 80, 770, 180, 45, false);
  createStyledButton(frameAnalysis, "AI総合評価レポートの作成 ➔", 1080, 770, 280, 45);


  // ==========================================
  // 07_Result (最終診断画面)
  // ==========================================
  const frameResult = createStyledFrame("07_Result", 6 * gap, 0);
  createPageHeader(frameResult, "🏆 自律走行AI 最終診断レポート", "シミュレーション評価");

  // Left Column: Rating Badge
  createStyledCard(frameResult, "Panel - Final rating card", 80, 220, 540, 500, colors.yellow);
  createStyledText(frameResult, "総合運転評価", 110, 260, 14, "Bold", colors.textSecondary);
  
  // Huge Letter Badge
  const badgeCircle = figma.createEllipse();
  frameResult.appendChild(badgeCircle);
  badgeCircle.resize(220, 220);
  badgeCircle.x = 240;
  badgeCircle.y = 300;
  badgeCircle.fills = [{ type: 'SOLID', color: colors.yellow, opacity: 0.1 }];
  badgeCircle.strokes = [{ type: 'SOLID', color: colors.yellow }];
  badgeCircle.strokeWeight = 3;

  const letterText = figma.createText();
  frameResult.appendChild(letterText);
  letterText.fontName = { family: "Inter", style: "Bold" };
  letterText.characters = "S";
  letterText.fontSize = 96;
  letterText.fills = [{ type: 'SOLID', color: colors.yellow }];
  letterText.x = 240 + (220 - letterText.width) / 2;
  letterText.y = 300 + (220 - letterText.height) / 2;

  createStyledText(frameResult, "進化成功型・総合自律走行モデル", 110, 560, 18, "Bold", colors.textPrimary);
  createStyledText(frameResult, "走行シナリオ: サーキットロード", 110, 595, 12, "Regular", colors.textSecondary);

  // Right Column: Diagnosis Reports
  createStyledCard(frameResult, "Panel - Diagnosis description report", 660, 220, 700, 500, colors.cyan);
  createStyledText(frameResult, "📋 AI運転診断レポート (ルールベース)", 700, 255, 16, "Bold", colors.cyan);

  const reportItems = [
    { title: "🚘 AIの運転タイプ", desc: "速度と安全性のトレードオフを高次元で克服し、高い生存率を維持しながら高速でコースを周回することに成功した最高峰のモデルです。" },
    { title: "📈 改善された点", desc: "初期世代の不規則な挙動から見違えるほど滑らかで効率的なレーシングラインを確立し、直線では適度に加速し、カーブ前では適切に減速を行える自律走行に進化しました。（初期世代より走行安定性が向上しました）" },
    { title: "⚠️ まだ残る弱点", desc: "特定の非常に急なヘアピンカーブにおいて、ごく稀にライン取りが膨らんで接触するケースが僅かに残されており、ゴール到達にはまだ課題があります。" },
    { title: "💡 次回設定のアドバイス", desc: "ほぼ完璧な学習結果です！次回は安全重視または標準学習での再試行を推奨します。異なるコースレイアウトでも同様に進化を成功させられるか、シナリオを変更して検証してみてください。" }
  ];

  reportItems.forEach((ri, idx) => {
    const yVal = 305 + idx * 95;
    createStyledText(frameResult, ri.title, 700, yVal, 13, "Bold", colors.cyan);
    createStyledText(frameResult, ri.desc, 700, yVal + 22, 11, "Regular", colors.textPrimary, 620);
  });

  // Action
  createStyledButton(frameResult, "別の設定で最初から試す 🔄", 540, 760, 360, 50);

  // Select all created frames and zoom to fit
  figma.viewport.scrollAndZoomIntoView([
    frameTop, frameScenario, frameConfig, frameBriefing, frameSim, frameAnalysis, frameResult
  ]);

  figma.closePlugin("Evodrive AI の 7画面のFigma Frameが正常に自動生成されました！");
}

main();
