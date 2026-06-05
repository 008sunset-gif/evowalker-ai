import type { VehicleState, ScenarioType } from '../types/simulation';

export interface ScreenCoord {
  x: number;
  y: number;
}

/**
 * 2.5D世界座標 (forward: 前進距離, lateral: 横ずれ, height: 高さ) を
 * Canvas 2Dのスクリーン座標 (x, y) に変換する疑似3D投影関数。
 * 
 * forward: 0 (スタート) 〜 650 (ゴール)
 * lateral: -140 (左端) 〜 140 (右端)
 * height: 0 (地面) 〜 100 (足踏みの高さなど)
 */
export function worldToScreen(
  forward: number,
  lateral: number,
  height: number
): ScreenCoord {
  const startX = 120;
  const startY = 320; // 若干上に調整してバランス向上

  const angle = 20 * Math.PI / 180;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  // 遠近パース (奥に行くほど小さく見せる)
  const depthFactor = 1.0 - (forward / 650) * 0.45;

  const x = startX + (forward * cosA + lateral * sinA * 1.05) * depthFactor;
  const y = startY - (forward * sinA - lateral * cosA * 0.48) * depthFactor - height * depthFactor;

  return { x, y };
}

/**
 * 歩行キャラクターの直線移動モック物理更新
 */
export function updateWalkerMock(
  walker: VehicleState,
  startPoint: { x: number; y: number },
  _currentGeneration: number,
  onFootstrike?: (x: number, y: number, isLeft: boolean) => void
): VehicleState {
  if (!walker.isActive || walker.reachedGoal) return walker;

  walker.aliveTime += 1;

  // 1. ゲノムDNAのマッピング (就活アピール用の数理設計)
  const strideLength = walker.genome.strideLength || 1.0;          // 歩幅
  const balanceCorrection = walker.genome.balanceCorrection || 1.0; // 重心バランス補正
  const stepRhythm = walker.genome.stepRhythm || 1.0;            // 歩行リズム（周期）
  const centerLineCorrection = walker.genome.recoveryAbility || 1.0;      // 中央線への軌道修正力
  const wobbleFactor = walker.genome.wobbleStrength || 1.0;               // ふらつきブレノイズ

  // 2. 歩行サイン波の周期フェーズ
  // rhythm (テンポ) が速いほど脚の回転周期が速くなる
  const phase = walker.aliveTime * stepRhythm * 0.14;
  const prevPhase = (walker.aliveTime - 1) * stepRhythm * 0.14;
  
  // 接地（ストライク）タイミング検出 (インデックスの遷移)
  const prevStrikeIndex = Math.floor((prevPhase + Math.PI / 2) / Math.PI);
  const strikeIndex = Math.floor((phase + Math.PI / 2) / Math.PI);
  const isStrike = strikeIndex !== prevStrikeIndex;
  const isLeftStrike = strikeIndex % 2 === 0;

  if (isStrike && onFootstrike) {
    onFootstrike(walker.x, walker.y, isLeftStrike);
  }

  // 3. 接地期 (Foot Strike) 判定と推進前進力の計算
  // サイン波 Math.abs(Math.sin(phase)) が最大値(1.0)に近い時、足が地面を蹴るキック推進力を得る
  const isKicking = Math.abs(Math.sin(phase)) > 0.85;
  let kickForce = 0;
  if (isKicking) {
    // 歩幅が広い（strideLengthが大きい）ほど、一歩の推進力が強くなる
    kickForce = Math.abs(Math.sin(phase)) * strideLength * 0.095;
  }

  // 世代進化による筋肉/脚力・スピードアップ倍率 (世代を重ねると脚力の伝達効率が上がる)
  const evolutionProgress = Math.min(1.0, (_currentGeneration - 1) / 25);
  const evolutionSpeedBoost = 1.0 + evolutionProgress * 0.5;

  const targetSpeed = (0.35 + kickForce * 18.5) * evolutionSpeedBoost;
  walker.speed = walker.speed * 0.88 + targetSpeed * 0.12; // スムーズな慣性加減速
  walker.x += walker.speed;

  // 4. 重心 (COG) 角度 (walker.angle) の更新シミュレーション
  // 左右の脚スイングによる反作用の揺れ (rhythmとstrideLengthが大きいほど左右への揺さぶりが強くなる)
  const sway = Math.sin(phase) * wobbleFactor * 0.052 * (strideLength * 0.6 + 0.4);
  
  // 個体固有の歩行ブレ（ノイズ）
  const noise = (Math.random() - 0.5) * wobbleFactor * 0.024;
  
  // 重力による転倒モーメント (傾くほどさらに同じ方向に傾こうとする力)
  const gravityTilt = walker.angle * 0.092;
  
  // ゲノムの「バランス補正」による重心引き戻し力
  const restoringForce = -walker.angle * balanceCorrection * 0.175;

  // 角度の微分変化を加算
  const dAngle = sway + noise + gravityTilt + restoringForce;
  walker.angle += dAngle;

  // 5. 横ずれ y の計算と中央線復元
  // 重心の傾き(angle)の方向にロボットが流される
  const drift = walker.angle * 4.8;
  
  // 中央線 (baseY) への引き戻し (centerLineCorrection)
  const totalWalkers = 30;
  const baseY = ((walker.id - 1) - (totalWalkers - 1) / 2) * 7.8;
  const centerCorrection = -(walker.y - baseY) * centerLineCorrection * 0.0165;

  walker.y += drift + centerCorrection;

  // 6. ゴール判定
  const goalX = 610;
  if (walker.x >= goalX) {
    walker.reachedGoal = true;
    walker.isActive = false;
    walker.speed = 0;
  }

  // 7. 転倒・リタイア判定
  const outOfLane = Math.abs(walker.y) > 130;
  
  // 安定マージン(centerLineCorrection)が大きいほど、耐えられる限界角度(limitAngle)が大きくなる
  const limitAngle = 0.52 * centerLineCorrection; // 0.52ラジアン ≒ 30度
  const isCrashed = Math.abs(walker.angle) > limitAngle;

  if ((outOfLane || isCrashed) && walker.x < goalX - 25) {
    walker.isActive = false;
    walker.speed = 0;

    if (outOfLane) {
      walker.crashReason = 'レーン外に脱出して転倒';
    } else {
      // 物理的因果関係に基づき、ゲノムパラメータ特性を元に理由を出力
      if (wobbleFactor > 1.35) {
        walker.crashReason = '激しいふらつきにより転倒';
      } else if (stepRhythm > 1.3 && strideLength > 1.25) {
        walker.crashReason = '足がもつれて前方へ転倒';
      } else {
        walker.crashReason = 'バランスを崩して横倒し';
      }
    }
  }

  // 8. スコア計算 (前進距離 + 安定ボーナス - 転倒ペナルティ)
  const distanceTravelled = Math.max(0, walker.x - startPoint.x);
  const stabilityBonus = Math.max(0, 100 - Math.abs(walker.angle) * 115);
  const crashPenalty = (walker.isActive || walker.reachedGoal) ? 0 : 150;

  walker.finalScore = Math.max(0, Math.floor(
    distanceTravelled * 1.8 +
    walker.aliveTime * 0.2 +
    stabilityBonus -
    crashPenalty
  ));

  return walker;
}

/**
 * モジュールレベルでの大腿・下腿・足首の3関節アフィン描画ヘルパー
 */
function drawLeg(
  ctx: CanvasRenderingContext2D,
  hipX: number,
  hipY: number,
  phi: number,
  color: string,
  isPlayer: boolean,
  size: number
) {
  const L1 = size * 0.42;
  const L2 = size * 0.42;
  const W_f = size * 0.35;
  const H_f = size * 0.12;

  ctx.save();
  ctx.translate(hipX, hipY);

  // 1. 大腿部（Thigh）の角度計算 - サイン波による歩行スイング
  const thighAngle = Math.sin(phi) * 0.38;
  ctx.rotate(thighAngle);

  // 大腿部を描画
  ctx.strokeStyle = color;
  ctx.lineWidth = isPlayer ? 3.5 : 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, L1);
  ctx.stroke();

  // 膝（Knee）へ移動
  ctx.translate(0, L1);

  // 2. 下腿部（Shin）の角度計算 - 接地期以外は膝を曲げる
  const sinP = Math.sin(phi);
  const kneeAngle = sinP > 0 ? sinP * 0.65 : 0;
  ctx.rotate(-kneeAngle);

  // 下腿部を描画
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, L2);
  ctx.stroke();

  // 足首（Ankle）へ移動
  ctx.translate(0, L2);

  // 3. 足首・足裏（Foot Plate）の角度計算 - フラット接地処理 (Inverse Kinematics風)
  // 接地時は地面と平行(絶対角=0)を保ち、スイング時はつま先を軽く下げる
  const targetWorldFootAngle = sinP > 0 ? 0.16 * sinP : 0;
  const ankleAngle = targetWorldFootAngle - (thighAngle - kneeAngle);
  ctx.rotate(ankleAngle);

  // 足裏プレートを描画 (接地感を演出)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-W_f * 0.4, 0, W_f, H_f, 1.5);
  ctx.fill();

  ctx.restore();
}

/**
 * モジュールレベルでのアーム（肩・肘）アフィン描画ヘルパー
 */
function drawArm(
  ctx: CanvasRenderingContext2D,
  shoulderX: number,
  shoulderY: number,
  phi: number,
  color: string,
  isPlayer: boolean,
  size: number
) {
  ctx.save();
  ctx.translate(shoulderX, shoulderY);

  // 腕は脚と逆フェーズでスイング (cos)
  const armSwingAngle = Math.cos(phi) * 0.35;
  ctx.rotate(armSwingAngle);

  // 上腕部を描画
  ctx.strokeStyle = color;
  ctx.lineWidth = isPlayer ? 3.0 : 2.0;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, size * 0.38);
  ctx.stroke();

  // 肘（Elbow）へ移動
  ctx.translate(0, size * 0.38);

  // 肘の折れ曲がり
  const elbowAngle = 0.22 + Math.abs(Math.sin(phi)) * 0.25;
  ctx.rotate(elbowAngle);

  // 前腕部を描画
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, size * 0.35);
  ctx.stroke();

  ctx.restore();
}

/**
 * 歩行キャラクターの簡易2.5D投影描画 (多関節・スキャンレーザー・警告表記をフル実装)
 */
export function drawWalkerMock(
  ctx: CanvasRenderingContext2D,
  walker: VehicleState,
  scenarioId?: ScenarioType,
  frame?: number,
  onSpawnSpark?: (x: number, y: number, color: string) => void
) {
  const isPlayer = walker.id === 1;
  const size = isPlayer ? 10.5 : 8.5; // キャラクターサイズ

  const isSlowped = (walker.id % 5 === 4) && (walker.speed < 0.5);
  const animSpeed = isSlowped ? 0.38 : Math.max(0.1, walker.speed * 0.12);
  const phase = walker.aliveTime * animSpeed * 1.5;
  
  // 左右の脚の位相差
  const leftLegPhase = phase;
  const rightLegPhase = phase + Math.PI;

  const screenPos = worldToScreen(walker.x, walker.y, 0);

  // --- 1. スキャンレーザーおよび障害物衝突の事前計算 ---
  let hasLaserCollision = false;
  let laserLength = 100; // 通常の射程距離
  const limitAngle = 0.40 + 0.3 * (walker.genome.recoveryAbility || 1.0);
  const isOffBalance = Math.abs(walker.angle) > limitAngle * 0.65;

  interface Obstacle { x: number; y: number; w: number; h: number; d: number; }
  const obstacles: Obstacle[] = [];
  if (scenarioId === 'circuit') {
    obstacles.push({ x: 220, y: -50, w: 24, h: 18, d: 20 });
    obstacles.push({ x: 380, y: 50, w: 24, h: 18, d: 20 });
    obstacles.push({ x: 500, y: -20, w: 24, h: 18, d: 20 });
  } else if (scenarioId === 'highway') {
    obstacles.push({ x: 280, y: 70, w: 16, h: 12, d: 14 });
    obstacles.push({ x: 420, y: -70, w: 16, h: 12, d: 14 });
  }

  // レーザーの首振りスキャン角度
  const sweepAngle = Math.sin((frame || 0) * 0.08) * 0.15;
  const cosS = Math.cos(sweepAngle);
  const sinS = Math.sin(sweepAngle);
  const maxReachX = walker.x + cosS * laserLength;
  const maxReachY = walker.y + sinS * laserLength;

  let collisionPt = { x: maxReachX, y: maxReachY, z: size * 1.7 };

  if (walker.isActive) {
    // 障害物との衝突チェック
    for (const obs of obstacles) {
      if (walker.x < obs.x + obs.d && maxReachX > obs.x) {
        const overlapY = Math.abs(walker.y - obs.y) < (obs.w / 2 + 12);
        if (overlapY) {
          const distToObs = obs.x - walker.x;
          if (distToObs > 0 && distToObs < laserLength) {
            laserLength = distToObs;
            hasLaserCollision = true;
            collisionPt = { x: obs.x, y: walker.y, z: size * 0.8 };
          }
        }
      }
    }

    // 側壁との近接チェック (警告フェンスは y = ±135)
    if (Math.abs(walker.y) > 90) {
      const wallY = walker.y > 0 ? 135 : -135;
      const endY = walker.y + sinS * laserLength;
      if (Math.abs(endY) > 135) {
        const factor = (wallY - walker.y) / (sinS * laserLength || 1);
        if (factor > 0 && factor < 1.0) {
          laserLength = laserLength * factor;
          hasLaserCollision = true;
          collisionPt = { x: walker.x + cosS * laserLength, y: wallY, z: size * 0.6 };
        }
      }
    }
  }

  ctx.save();

  // 描画の中心を足元に設定
  ctx.translate(screenPos.x, screenPos.y);

  if (walker.isActive) {
    // --- 2. スキャンレーザーのCanvas描画 (半透明グラデーション扇) ---
    ctx.save();
    const pStart = worldToScreen(walker.x, walker.y, size * 1.7);
    const pEnd = worldToScreen(walker.x + cosS * laserLength, walker.y + sinS * laserLength, size * 1.7);
    const pL = worldToScreen(walker.x + Math.cos(sweepAngle - 0.12) * laserLength, walker.y + Math.sin(sweepAngle - 0.12) * laserLength, size * 1.7);
    const pR = worldToScreen(walker.x + Math.cos(sweepAngle + 0.12) * laserLength, walker.y + Math.sin(sweepAngle + 0.12) * laserLength, size * 1.7);

    // キャラクター基準のローカル座標に戻す (translateをキャンセルしてワールド座標系で描く)
    ctx.restore();
    ctx.save();

    const laserColorBase = (hasLaserCollision || isOffBalance) ? 'rgba(239, 68, 68, ' : 'rgba(6, 182, 212, ';
    const laserGrad = ctx.createRadialGradient(pStart.x, pStart.y, 2, pStart.x, pStart.y, Math.max(20, laserLength * 0.8));
    laserGrad.addColorStop(0, laserColorBase + '0.45)');
    laserGrad.addColorStop(1, laserColorBase + '0.0)');

    ctx.fillStyle = laserGrad;
    ctx.beginPath();
    ctx.moveTo(pStart.x, pStart.y);
    ctx.lineTo(pL.x, pL.y);
    ctx.lineTo(pR.x, pR.y);
    ctx.closePath();
    ctx.fill();

    // 中央スキャンビームの線
    ctx.strokeStyle = (hasLaserCollision || isOffBalance) ? 'rgba(239, 68, 68, 0.7)' : 'rgba(6, 182, 212, 0.7)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(pStart.x, pStart.y);
    ctx.lineTo(pEnd.x, pEnd.y);
    ctx.stroke();

    // 衝突点での火花エフェクト発生 (コールバック呼び出し)
    if (hasLaserCollision && onSpawnSpark && frame && frame % 4 === 0) {
      const sparkScr = worldToScreen(collisionPt.x, collisionPt.y, collisionPt.z);
      onSpawnSpark(sparkScr.x, sparkScr.y, '#f97316');
    }
    ctx.restore();

    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);

    // --- 3. ドロップシャドウ (足元) ---
    ctx.fillStyle = 'rgba(15, 23, 42, 0.14)';
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.3, size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // スピードに応じた前傾姿勢 + 横揺れロール
    const pitchOffset = Math.min(0.24, Math.max(0, walker.speed * 0.08));
    ctx.rotate(pitchOffset + walker.angle);

    // キャラクターの上下バウンド
    const bounceHeight = Math.abs(Math.sin(phase)) * 1.8;
    ctx.translate(0, -bounceHeight);

    // --- 4. 左右の脚 (多関節関節描画) ---
    // 左脚 (奥)
    drawLeg(ctx, -size * 0.28, -size * 0.1, leftLegPhase, '#475569', isPlayer, size);
    // 右脚 (手前)
    drawLeg(ctx, size * 0.28, -size * 0.1, rightLegPhase, '#334155', isPlayer, size);

    // --- 5. ロボット胴体 (メタル製) ---
    ctx.fillStyle = walker.color;
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.6, size * 0.65, size * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 胴体中央のLEDライト (AI-01はネオンシアン、他は薄黄色)
    ctx.fillStyle = isPlayer ? '#06b6d4' : '#fef08a';
    ctx.beginPath();
    ctx.arc(0, -size * 0.6, 2, 0, Math.PI * 2);
    ctx.fill();

    // --- 6. 左右の腕 (多関節アーム描画) ---
    // 左アーム (奥)
    drawArm(ctx, -size * 0.65, -size * 0.9, leftLegPhase, '#475569', isPlayer, size);
    // 右アーム (手前)
    drawArm(ctx, size * 0.65, -size * 0.9, rightLegPhase, walker.color, isPlayer, size);

    // --- 7. 頭部 (ロボット頭 & バイザー & アンテナ) ---
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, -size * 1.7, size * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // バイザー (接近警告や重心傾き時はオレンジ〜赤色に変化)
    ctx.fillStyle = (hasLaserCollision || isOffBalance) ? '#ef4444' : (isPlayer ? '#06b6d4' : '#38b2ac');
    ctx.beginPath();
    ctx.ellipse(size * 0.1, -size * 1.75, size * 0.4, size * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    // アンテナ (ロボット感強化)
    const antType = walker.id % 3;
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    if (antType === 0) {
      // ツノ型アンテナ2本
      ctx.beginPath();
      ctx.moveTo(-size * 0.25, -size * 2.15);
      ctx.lineTo(-size * 0.4, -size * 2.45);
      ctx.moveTo(size * 0.25, -size * 2.15);
      ctx.lineTo(size * 0.4, -size * 2.45);
      ctx.stroke();
      
      ctx.fillStyle = isPlayer ? '#3b82f6' : '#ef4444';
      ctx.beginPath();
      ctx.arc(-size * 0.4, -size * 2.5, 1.2, 0, Math.PI * 2);
      ctx.arc(size * 0.4, -size * 2.5, 1.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (antType === 1) {
      // 中央アンテナ1本
      ctx.beginPath();
      ctx.moveTo(0, -size * 2.25);
      ctx.lineTo(0, -size * 2.55);
      ctx.stroke();

      ctx.fillStyle = isPlayer ? '#3b82f6' : '#ecc94b';
      ctx.beginPath();
      ctx.arc(0, -size * 2.6, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 左右の耳パーツ
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(-size * 0.6, -size * 1.7, 1.5, 0, Math.PI * 2);
      ctx.arc(size * 0.6, -size * 1.7, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- 8. AI-01 強調表示 (グロー輪郭) ---
    if (isPlayer) {
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, -size * 0.7, size * 2.0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  } else if (walker.reachedGoal) {
    // --- 9. ゴール到達・成功状態 (直立してバンザイポーズで喜ぶ) ---
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)'; // 成功グリーンのシャドウ
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.4, size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 嬉しさによる小刻みなジャンプ
    const jump = Math.abs(Math.sin((frame || walker.aliveTime) * 0.16)) * 4.5;
    ctx.translate(0, -jump);

    // 左右の脚 (まっすぐ立つ & 膝を揃える)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = isPlayer ? 3.0 : 2.2;
    ctx.beginPath();
    ctx.moveTo(-size * 0.28, -size * 0.1);
    ctx.lineTo(-size * 0.28, size * 0.65);
    ctx.moveTo(size * 0.28, -size * 0.1);
    ctx.lineTo(size * 0.28, size * 0.65);
    ctx.stroke();

    // 足元プレート
    ctx.fillStyle = '#334155';
    ctx.fillRect(-size * 0.45, size * 0.65, size * 0.35, size * 0.1);
    ctx.fillRect(size * 0.1, size * 0.65, size * 0.35, size * 0.1);

    // 胴体
    ctx.fillStyle = walker.color;
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.6, size * 0.65, size * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 胴体LED (成功グリーンに点灯)
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(0, -size * 0.6, 2, 0, Math.PI * 2);
    ctx.fill();

    // 左右のアーム (上向きにバンザイ、かつ腕を振る)
    ctx.strokeStyle = walker.color;
    ctx.lineWidth = isPlayer ? 3.0 : 2.2;
    const wave = Math.sin((frame || walker.aliveTime) * 0.25) * size * 0.18;
    ctx.beginPath();
    // 左アーム (上向き)
    ctx.moveTo(-size * 0.65, -size * 0.9);
    ctx.lineTo(-size * 0.85 - wave, -size * 1.55);
    // 右アーム (上向き)
    ctx.moveTo(size * 0.65, -size * 0.9);
    ctx.lineTo(size * 0.85 + wave, -size * 1.55);
    ctx.stroke();

    // 頭部
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, -size * 1.7, size * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // バイザー (キラキラ輝く水色)
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.ellipse(size * 0.1, -size * 1.75, size * 0.4, size * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    // 頭の上に王冠マークを表示 👑 (エリートの証)
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('👑', 0, -size * 2.45);

    if (isPlayer) {
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, -size * 0.7, size * 2.0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  } else {
    // --- 10. 転倒状態 (左右ランダムにバタッと横倒し) ---
    const fallDir = walker.id % 2 === 0 ? 1 : -1;
    ctx.rotate((Math.PI / 2) * fallDir);
    ctx.translate(size * 0.35 * fallDir, size * 0.4);

    // 灰色に変色した胴体 (活動停止)
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.6, size * 0.65, size * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 頭部
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(0, -size * 1.7, size * 0.55, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 頭の上（元のスクリーン座標の少し上）に気絶エフェクト
    ctx.save();
    ctx.translate(screenPos.x, screenPos.y - size * 2.6);

    // くるくるバツマークの軌道
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.8, size * 0.25, Math.PI / 8, 0, Math.PI * 2);
    ctx.stroke();

    // くるくるバツマーク ✖
    ctx.fillStyle = '#ef4444';
    const starAngle = ((frame || walker.aliveTime) * 0.08) % (Math.PI * 2);
    const starX = Math.cos(starAngle) * size * 0.8;
    const starY = Math.sin(starAngle) * size * 0.25;
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✖', starX, starY + 2.5);

    // 吹き出し風の汗マーク 💦
    ctx.font = '10px Arial';
    ctx.fillText('💦', size * 0.7, -size * 0.2);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 斜め上視点 2.5D レーンの描画 (警告フェンス接近明滅・発光を拡張)
 */
export function drawLaneMock(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: number = 0,
  walkers?: VehicleState[]
) {
  // 1. 背景グラデーション (明るいクリーンなライトテーマ)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#f8fafc');
  bgGrad.addColorStop(1, '#f1f5f9');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. 空間グリッド (背景用、キャラクターを邪魔しないように超極薄に変更)
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 0.6;
  for (let x = 0; x < width; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const laneLength = 650;
  const laneHalfWidth = 135;

  // 3. アスファルト路面 (パース台形、滑らかで高級感のある色合い)
  const p0 = worldToScreen(0, -laneHalfWidth, 0);
  const p1 = worldToScreen(0, laneHalfWidth, 0);
  const p2 = worldToScreen(laneLength, laneHalfWidth, 0);
  const p3 = worldToScreen(laneLength, -laneHalfWidth, 0);

  ctx.fillStyle = '#cbd5e1'; // 少し暗くしてキャラクター（明るいカラー）を引き立たせる
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.closePath();
  ctx.fill();

  // 境界線を明瞭にするため、路面外周にダークなフチ線を描画
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 3.5. パース付き進行方向表示矢印 (>>>) の描画
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  for (let ax = 80; ax < laneLength - 80; ax += 130) {
    const depth = 1.0 - (ax / 650) * 0.45;
    const pArrow = worldToScreen(ax, 0, 0);
    
    ctx.beginPath();
    const angle = 20 * Math.PI / 180;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    
    // 矢印の頂点を計算 (右上が前進方向)
    const tipX = pArrow.x + 14 * cosA * depth;
    const tipY = pArrow.y - 14 * sinA * depth;
    const leftX = pArrow.x - 7 * sinA * depth - 4 * cosA * depth;
    const leftY = pArrow.y - 7 * cosA * depth + 4 * sinA * depth;
    const rightX = pArrow.x + 7 * sinA * depth - 4 * cosA * depth;
    const rightY = pArrow.y + 7 * cosA * depth + 4 * sinA * depth;
    
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    ctx.fill();
  }

  // --- 警告フェンス近接状況の計算 ---
  const leftFenceWarn = walkers ? walkers.some(w => w.isActive && w.y < -90) : false;
  const rightFenceWarn = walkers ? walkers.some(w => w.isActive && w.y > 90) : false;
  const isBlinkFrame = Math.floor(frame / 6) % 2 === 0;

  // 4. 立体境界フェンス & 赤白の警告ゼブラ模様
  // 左フェンス (奥側)
  const l0 = worldToScreen(0, -laneHalfWidth, 0);
  const l1 = worldToScreen(laneLength, -laneHalfWidth, 0);
  const l0_top = worldToScreen(0, -laneHalfWidth, 12);
  const l1_top = worldToScreen(laneLength, -laneHalfWidth, 12);

  // フェンスの土台 (ダークグレー)
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.moveTo(l0.x, l0.y);
  ctx.lineTo(l1.x, l1.y);
  ctx.lineTo(l1_top.x, l1_top.y);
  ctx.lineTo(l0_top.x, l0_top.y);
  ctx.closePath();
  ctx.fill();

  // フェンス側面のゼブラ警告線を描画 (30px間隔でパースに沿って赤白・警告時は黄色点滅)
  ctx.save();
  for (let fx = 0; fx < laneLength; fx += 40) {
    const fz0 = worldToScreen(fx, -laneHalfWidth, 0);
    const fz1 = worldToScreen(Math.min(laneLength, fx + 20), -laneHalfWidth, 0);
    const fz0_t = worldToScreen(fx, -laneHalfWidth, 12);
    const fz1_t = worldToScreen(Math.min(laneLength, fx + 20), -laneHalfWidth, 12);

    // 警告時は赤と黄で点滅明滅させる
    ctx.fillStyle = leftFenceWarn ? (isBlinkFrame ? '#ef4444' : '#eab308') : '#ef4444';
    ctx.beginPath();
    ctx.moveTo(fz0.x, fz0.y);
    ctx.lineTo(fz1.x, fz1.y);
    ctx.lineTo(fz1_t.x, fz1_t.y);
    ctx.lineTo(fz0_t.x, fz0_t.y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // フェンスの上部バー (左フェンス警告時は赤ネオン発光)
  ctx.save();
  ctx.strokeStyle = leftFenceWarn ? 'rgba(239, 68, 68, 0.85)' : '#475569';
  ctx.lineWidth = leftFenceWarn ? 3.0 : 2.0;
  if (leftFenceWarn) {
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 6;
  }
  ctx.beginPath();
  ctx.moveTo(l0_top.x, l0_top.y);
  ctx.lineTo(l1_top.x, l1_top.y);
  ctx.stroke();
  ctx.restore();

  // 右フェンス (手前側)
  const r0 = worldToScreen(0, laneHalfWidth, 0);
  const r1 = worldToScreen(laneLength, laneHalfWidth, 0);
  const r0_top = worldToScreen(0, laneHalfWidth, 12);
  const r1_top = worldToScreen(laneLength, laneHalfWidth, 12);

  // 土台 (ライトグレー)
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(r0.x, r0.y);
  ctx.lineTo(r1.x, r1.y);
  ctx.lineTo(r1_top.x, r1_top.y);
  ctx.lineTo(r0_top.x, r0_top.y);
  ctx.closePath();
  ctx.fill();

  // 右フェンスの赤白ゼブラ
  ctx.save();
  for (let fx = 0; fx < laneLength; fx += 40) {
    const fz0 = worldToScreen(fx, laneHalfWidth, 0);
    const fz1 = worldToScreen(Math.min(laneLength, fx + 20), laneHalfWidth, 0);
    const fz0_t = worldToScreen(fx, laneHalfWidth, 12);
    const fz1_t = worldToScreen(Math.min(laneLength, fx + 20), laneHalfWidth, 12);

    ctx.fillStyle = rightFenceWarn ? (isBlinkFrame ? '#ef4444' : '#eab308') : '#ef4444';
    ctx.beginPath();
    ctx.moveTo(fz0.x, fz0.y);
    ctx.lineTo(fz1.x, fz1.y);
    ctx.lineTo(fz1_t.x, fz1_t.y);
    ctx.lineTo(fz0_t.x, fz0_t.y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // フェンスの上部バー (右 - 警告時は赤ネオン発光)
  ctx.save();
  ctx.strokeStyle = rightFenceWarn ? 'rgba(239, 68, 68, 0.85)' : '#334155';
  ctx.lineWidth = rightFenceWarn ? 3.0 : 2.0;
  if (rightFenceWarn) {
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 6;
  }
  ctx.beginPath();
  ctx.moveTo(r0_top.x, r0_top.y);
  ctx.lineTo(r1_top.x, r1_top.y);
  ctx.stroke();
  ctx.restore();

  // 5. レーン中央線 (2.5D投影された白い点線)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([10, 14]);
  ctx.beginPath();
  const c0 = worldToScreen(0, 0, 0);
  const c1 = worldToScreen(laneLength, 0, 0);
  ctx.moveTo(c0.x, c0.y);
  ctx.lineTo(c1.x, c1.y);
  ctx.stroke();
  ctx.setLineDash([]); // リセット

  // 6. スタートライン (青線 & テキスト)
  const startX = 40;
  const s0 = worldToScreen(startX, -laneHalfWidth, 0);
  const s1 = worldToScreen(startX, laneHalfWidth, 0);
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(s0.x, s0.y);
  ctx.lineTo(s1.x, s1.y);
  ctx.stroke();

  // START文字をパースに馴染ませて配置
  ctx.fillStyle = '#2563eb';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('START LINE', s0.x + 2, s0.y - 12);

  // 7. ゴールライン (緑の太線) & ゴールゲートの立体構築
  const goalX = 610;
  const g0 = worldToScreen(goalX, -laneHalfWidth, 0);
  const g1 = worldToScreen(goalX, laneHalfWidth, 0);
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(g0.x, g0.y);
  ctx.lineTo(g1.x, g1.y);
  ctx.stroke();

  // ゴールゲートポスト
  const postLeftBase = worldToScreen(goalX, -laneHalfWidth + 8, 0);
  const postLeftTop = worldToScreen(goalX, -laneHalfWidth + 8, 50);
  const postRightBase = worldToScreen(goalX, laneHalfWidth - 8, 0);
  const postRightTop = worldToScreen(goalX, laneHalfWidth - 8, 50);

  // ゲートを描画
  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(postLeftBase.x, postLeftBase.y);
  ctx.lineTo(postLeftTop.x, postLeftTop.y);
  ctx.moveTo(postRightBase.x, postRightBase.y);
  ctx.lineTo(postRightTop.x, postRightTop.y);
  ctx.lineTo(postLeftTop.x, postLeftTop.y);
  ctx.stroke();

  // 看板
  const gateCenter = worldToScreen(goalX, 0, 50);
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.roundRect(gateCenter.x - 26, gateCenter.y - 10, 52, 17, 4);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 看板テキスト
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GOAL', gateCenter.x, gateCenter.y - 1);
  ctx.textBaseline = 'alphabetic'; // リセット

  // ゲート上のきらきら電飾の点滅アニメーション
  const flashColorLeft = (Math.floor(frame / 15) % 2 === 0) ? '#ef4444' : '#10b981';
  const flashColorRight = (Math.floor(frame / 15) % 2 === 0) ? '#10b981' : '#ef4444';
  ctx.fillStyle = flashColorLeft;
  ctx.beginPath();
  ctx.arc(postLeftTop.x, postLeftTop.y, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = flashColorRight;
  ctx.beginPath();
  ctx.arc(postRightTop.x, postRightTop.y, 4, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * 2.5D立体障害物ブロック（バリケード）の描画
 */
export function drawObstacleMock(
  ctx: CanvasRenderingContext2D,
  forward: number,
  lateral: number,
  w: number, // 幅
  h: number, // 高さ
  d: number  // 奥行き (forward方向の厚み)
) {
  const halfW = w / 2;
  const pBottomFrontLeft = worldToScreen(forward, lateral - halfW, 0);
  const pBottomFrontRight = worldToScreen(forward, lateral + halfW, 0);
  const pBottomBackLeft = worldToScreen(forward + d, lateral - halfW, 0);
  const pBottomBackRight = worldToScreen(forward + d, lateral + halfW, 0);

  const pTopFrontLeft = worldToScreen(forward, lateral - halfW, h);
  const pTopFrontRight = worldToScreen(forward, lateral + halfW, h);
  const pTopBackLeft = worldToScreen(forward + d, lateral - halfW, h);
  const pTopBackRight = worldToScreen(forward + d, lateral + halfW, h);

  // 1. 底面の描画（影）
  ctx.fillStyle = 'rgba(15, 23, 42, 0.15)';
  ctx.beginPath();
  ctx.moveTo(pBottomFrontLeft.x, pBottomFrontLeft.y);
  ctx.lineTo(pBottomFrontRight.x, pBottomFrontRight.y);
  ctx.lineTo(pBottomBackRight.x, pBottomBackRight.y);
  ctx.lineTo(pBottomBackLeft.x, pBottomBackLeft.y);
  ctx.closePath();
  ctx.fill();

  // 2. 左側面の描画
  ctx.fillStyle = '#991b1b'; // ダークレッド
  ctx.beginPath();
  ctx.moveTo(pBottomFrontLeft.x, pBottomFrontLeft.y);
  ctx.lineTo(pBottomBackLeft.x, pBottomBackLeft.y);
  ctx.lineTo(pTopBackLeft.x, pTopBackLeft.y);
  ctx.lineTo(pTopFrontLeft.x, pTopFrontLeft.y);
  ctx.closePath();
  ctx.fill();

  // 3. 右側面の描画
  ctx.fillStyle = '#ef4444'; // ライトレッド
  ctx.beginPath();
  ctx.moveTo(pBottomFrontRight.x, pBottomFrontRight.y);
  ctx.lineTo(pBottomBackRight.x, pBottomBackRight.y);
  ctx.lineTo(pTopBackRight.x, pTopBackRight.y);
  ctx.lineTo(pTopFrontRight.x, pTopFrontRight.y);
  ctx.closePath();
  ctx.fill();

  // 4. 正面の描画
  ctx.fillStyle = '#dc2626'; // ミディアムレッド
  ctx.beginPath();
  ctx.moveTo(pBottomFrontLeft.x, pBottomFrontLeft.y);
  ctx.lineTo(pBottomFrontRight.x, pBottomFrontRight.y);
  ctx.lineTo(pTopFrontRight.x, pTopFrontRight.y);
  ctx.lineTo(pTopFrontLeft.x, pTopFrontLeft.y);
  ctx.closePath();
  ctx.fill();

  // 5. 天面の描画
  ctx.fillStyle = '#f87171'; // ブライトレッド
  ctx.beginPath();
  ctx.moveTo(pTopFrontLeft.x, pTopFrontLeft.y);
  ctx.lineTo(pTopFrontRight.x, pTopFrontRight.y);
  ctx.lineTo(pTopBackRight.x, pTopBackRight.y);
  ctx.lineTo(pTopBackLeft.x, pTopBackLeft.y);
  ctx.closePath();
  ctx.fill();

  // 6. 白い斜め警告ストライプ (正面)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3.0;
  ctx.beginPath();
  ctx.moveTo(pTopFrontLeft.x + 3, pTopFrontLeft.y + 3);
  ctx.lineTo(pBottomFrontRight.x - 3, pBottomFrontRight.y - 3);
  ctx.stroke();
}
