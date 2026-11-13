import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = process.cwd();
const WP_PATH = path.join(DATA_DIR, 'WP26.csv');
const ORIG_PATH = path.join(DATA_DIR, 'WP26.original.csv');
const TRANS_PATH = path.join(DATA_DIR, 'WP26.translations.jsonl');

const EXPECTED_HEADERS = [
  '生国','所国','毛色','跳','小','左','右','遅','上瞬','上持','上消',
  'SP','ST','力','瞬','根','柔','精','賢','健','気性','馬場適正','距離適性',
  '脚質','固','特性','ウマソナ','生年','性別','馬名英字','馬名カナ'
];

const GRADES = new Set(['S+','S','A+','A','B+','B','C+','C','D+','D','E+','E','F+','F','G+','G']);
const SEXES = new Set(['牡','牝','セ']);

function main() {
  const wpBuf = fs.readFileSync(WP_PATH);
  if (wpBuf[0] !== 0xEF || wpBuf[1] !== 0xBB || wpBuf[2] !== 0xBF) {
    throw new Error('WP26.csv 必须保持 UTF-8 with BOM 编码');
  }
  const wpText = wpBuf.toString('utf8').slice(1);
  if (!wpText.includes('\r\n')) {
    throw new Error('WP26.csv 必须保持 CRLF (\r\n) 换行符');
  }
  const wpLines = wpText.split(/\r?\n/).filter((l) => l.length > 0);
  const headers = wpLines[0].split(',');
  if (headers.join(',') !== EXPECTED_HEADERS.join(',')) {
    throw new Error('WP26.csv 表头与原生 31 列定义不一致');
  }

  const origText = fs.readFileSync(ORIG_PATH, 'utf8').replace(/^\uFEFF/, '');
  const origLines = origText.split(/\r?\n/).filter((l) => l.length > 0);
  if (wpLines.length !== origLines.length) {
    throw new Error(`WP26.csv 行数 (${wpLines.length}) 必须与 WP26.original.csv (${origLines.length}) 一致`);
  }

  const wpKeys = [];
  for (let i = 1; i < wpLines.length; i++) {
    const cols = wpLines[i].split(',');
    if (cols.length !== 31) {
      throw new Error(`WP26.csv 第 ${i + 1} 行列数异常: ${cols.length}`);
    }
    if (cols[30] === 'サードステージ') {
      throw new Error('不允许包含 サードステージ');
    }
    const sp = Number(cols[11]);
    const st = Number(cols[12]);
    if (!Number.isInteger(sp) || sp < 1 || sp > 100) {
      throw new Error(`第 ${i + 1} 行 SP 越界: ${cols[11]}`);
    }
    if (!Number.isInteger(st) || st < 0 || st > 100) {
      throw new Error(`第 ${i + 1} 行 ST 越界: ${cols[12]}`);
    }
    for (let g = 13; g <= 19; g++) {
      if (!GRADES.has(cols[g])) {
        throw new Error(`第 ${i + 1} 行能力等级非法: ${cols[g]}`);
      }
    }
    if (!/^\d{3,4}～\d{3,4}m$/.test(cols[22])) {
      throw new Error(`第 ${i + 1} 行距離適性非法: ${cols[22]}`);
    }
    if (!SEXES.has(cols[28])) {
      throw new Error(`第 ${i + 1} 行性別非法: ${cols[28]}`);
    }
    wpKeys.push(`${cols[29]}|${cols[30]}|${cols[27]}|${cols[28]}`);
  }

  const transLines = fs.readFileSync(TRANS_PATH, 'utf8').split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (transLines.length !== wpKeys.length) {
    throw new Error(`WP26.translations.jsonl 行数 (${transLines.length}) 必须与 WP26.csv 马匹数 (${wpKeys.length}) 一致`);
  }

  for (let i = 0; i < transLines.length; i++) {
    const obj = JSON.parse(transLines[i]);
    if (obj.key !== wpKeys[i]) {
      throw new Error(`WP26.translations.jsonl 第 ${i + 1} 行 key 不对齐: 期望 ${wpKeys[i]}，实际 ${obj.key}`);
    }
    if (!Array.isArray(obj.items)) {
      throw new Error(`WP26.translations.jsonl 第 ${i + 1} 行 items 非数组`);
    }
    const seen = new Set();
    for (const item of obj.items) {
      const name = typeof item.name === 'string' ? item.name.trim() : '';
      const reason = typeof item.reason === 'string' ? item.reason.trim() : '';
      if (!name || name.length > 40) {
        throw new Error(`${obj.key} 存在非法中文译名`);
      }
      if (seen.has(name)) {
        throw new Error(`${obj.key} 存在重复译名: ${name}`);
      }
      if (reason.length < 2 || reason.length > 300) {
        throw new Error(`${obj.key} 译名 "${name}" 缺少来源/理由`);
      }
      seen.add(name);
    }
  }

  console.log(`[validate] 校验通过！共 ${wpKeys.length} 匹史实马，格式与译名考据均合法。`);
}

main();
