// src/app/utils/stats.ts
// 外部ライブラリなしで使える重み付けユーティリティ

export function weightedStats(
  scores: number[],
  weights: number[]
): { mean: number; sd: number; quantiles: Record<'p10' | 'p25' | 'p50' | 'p75' | 'p90', number> } {
  if (scores.length === 0) {
    return { mean: 0, sd: 1, quantiles: { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0 } };
  }
  const Z = weights.reduce((a, b) => a + b, 0) || 1;
  const w = weights.map((v) => v / Z);
  const mean = scores.reduce((a, x, i) => a + w[i] * x, 0);
  const var_ = scores.reduce((a, x, i) => a + w[i] * (x - mean) * (x - mean), 0);
  const sd = Math.sqrt(Math.max(var_, 1e-12));

  // 重み付き分位
  const pairs = scores.map((x, i) => ({ x, w: w[i] })).sort((a, b) => a.x - b.x);
  const want = [0.1, 0.25, 0.5, 0.75, 0.9];
  const out: number[] = [];
  let acc = 0;
  let j = 0;
  for (const q of want) {
    while (j < pairs.length && acc + pairs[j].w < q - 1e-12) {
      acc += pairs[j].w;
      j++;
    }
    out.push(j < pairs.length ? pairs[j].x : pairs[pairs.length - 1].x);
  }
  return { mean, sd, quantiles: { p10: out[0], p25: out[1], p50: out[2], p75: out[3], p90: out[4] } };
}

// 平均一致： w_i ∝ exp(λ x_i)
export function entropyWeightsMean(
  scores: number[],
  targetMean: number,
  opts?: { maxIter?: number }
): number[] {
  const n = scores.length;
  if (n === 0) return [];
  const minX = Math.min(...scores);
  const maxX = Math.max(...scores);
  // ターゲットが範囲外なら端に寄せる（完全に外れると解が不安定）
  const t = Math.max(minX + 1e-9, Math.min(maxX - 1e-9, targetMean));

  let lo = -1e3;
  let hi = 1e3;
  const iters = opts?.maxIter ?? 80;

  for (let k = 0; k < iters; k++) {
    const lam = (lo + hi) / 2;
    const e = scores.map((x) => Math.exp(lam * x));
    const Z = e.reduce((a, b) => a + b, 0);
    const w = e.map((v) => v / Z);
    const m = scores.reduce((a, x, i) => a + w[i] * x, 0);
    if (m > t) hi = lam;
    else lo = lam;
  }
  const lam = (lo + hi) / 2;
  const e = scores.map((x) => Math.exp(lam * x));
  const Z = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / Z);
}

// 平均・分散一致： w_i ∝ exp(λ x_i + γ x_i^2)
// 収束しない場合は null を返すので、呼び出し側で平均一致にフォールバックしてください
export function entropyWeightsMeanVar(
  scores: number[],
  targetMean: number,
  targetSd: number,
  opts?: { maxIter?: number }
): number[] | null {
  const n = scores.length;
  if (n === 0) return null;

  // 目標2次モーメント
  const targetM2 = targetMean * targetMean + Math.max(targetSd, 1e-6) ** 2;

  // 初期値
  let lam = 0;
  let gam = 0;
  const iters = opts?.maxIter ?? 30;

  function moments(l: number, g: number): { m1: number; m2: number; ratio: number; weights: number[] } {
    const exps = scores.map((x) => Math.exp(l * x + g * x * x));
    const Z = exps.reduce((a, b) => a + b, 0);
    const w = exps.map((v) => v / Z);
    const m1 = scores.reduce((a, x, i) => a + w[i] * x, 0);
    const m2 = scores.reduce((a, x, i) => a + w[i] * x * x, 0);
    const maxW = Math.max(...w);
    const minW = Math.min(...w);
    const ratio = maxW / Math.max(minW, 1e-18);
    return { m1, m2, ratio, weights: w };
  }

  for (let k = 0; k < iters; k++) {
    const { m1, m2, ratio } = moments(lam, gam);
    // 発散チェック
    if (!isFinite(m1) || !isFinite(m2) || ratio > 1e8) return null;

    const f1 = m1 - targetMean;
    const f2 = m2 - targetM2;
    const err = Math.max(Math.abs(f1), Math.abs(f2));
    if (err < 1e-6) break;

    // 数値ヤコビアン（中心差分）
    const h1 = 1e-3;
    const h2 = 1e-6;
    const { m1: m1_l1, m2: m2_l1 } = moments(lam + h1, gam);
    const { m1: m1_l2, m2: m2_l2 } = moments(lam - h1, gam);
    const { m1: m1_g1, m2: m2_g1 } = moments(lam, gam + h2);
    const { m1: m1_g2, m2: m2_g2 } = moments(lam, gam - h2);

    const df1_dlam = (m1_l1 - m1_l2) / (2 * h1);
    const df1_dgam = (m1_g1 - m1_g2) / (2 * h2);
    const df2_dlam = (m2_l1 - m2_l2) / (2 * h1);
    const df2_dgam = (m2_g1 - m2_g2) / (2 * h2);

    // 2x2 連立の解（ニュートン法の一歩）
    const det = df1_dlam * df2_dgam - df1_dgam * df2_dlam;
    if (Math.abs(det) < 1e-12) return null;

    let dlam = (-f1 * df2_dgam + f2 * df1_dgam) / det;
    let dgam = (-df1_dlam * f2 + df2_dlam * f1) / det;

    // ダンピング（暴れ防止）
    dlam = Math.max(Math.min(dlam, 1e2), -1e2);
    dgam = Math.max(Math.min(dgam, 1e2), -1e2);

    lam += 0.5 * dlam;
    gam += 0.5 * dgam;
  }

  const { ratio, weights } = moments(lam, gam);
  if (ratio > 1e8) return null;
  return weights;
}
