/**
 * Math Puzzle Generator for Room 99 Vault Cipher Locks
 * 
 * Rules:
 * 1. ONLY standard keyboard characters: 0-9, +, -, *, /, (, )
 * 2. Result is strictly a 4-digit integer (1000 - 9999)
 * 3. Exact integer divisions with no floating remnants
 */

export interface MathPuzzle {
  formula: string;
  solution: string; // 4-digit string, e.g. "4820"
  description: string;
}

// Curated templates with verified integer math using standard keyboard keys
export function generateMathPuzzle(seedRoom: number): MathPuzzle {
  const templates = [
    () => {
      // (a * b) + (c / d) - (e * f)
      const a = 40 + (seedRoom % 35);
      const b = 60 + ((seedRoom * 7) % 30);
      const d = 12;
      const c = 1440; // c / d = 120
      const e = 15;
      const f = 10 + (seedRoom % 12);
      const val = (a * b) + (c / d) - (e * f);
      return {
        formula: `((${a} * ${b}) + (${c} / ${d})) - (${e} * ${f})`,
        val
      };
    },
    () => {
      // (a * b) - (c / d) + (e * f)
      const a = 50 + (seedRoom % 25);
      const b = 45 + ((seedRoom * 3) % 35);
      const d = 15;
      const c = 3000; // c / d = 200
      const e = 24;
      const f = 20 + (seedRoom % 15);
      const val = (a * b) - (c / d) + (e * f);
      return {
        formula: `((${a} * ${b}) - (${c} / ${d})) + (${e} * ${f})`,
        val
      };
    },
    () => {
      // ((a * b) / c) + (d * e) - f
      const a = 120;
      const b = 80 + (seedRoom % 20);
      const c = 4; // (a*b)/4 = 30 * b
      const d = 35 + ((seedRoom * 5) % 30);
      const e = 40 + (seedRoom % 20);
      const f = 340 + (seedRoom % 120);
      const val = ((a * b) / c) + (d * e) - f;
      return {
        formula: `(((${a} * ${b}) / ${c}) + (${d} * ${e})) - ${f}`,
        val
      };
    },
    () => {
      // (a * (b + c)) - (d * e) / f
      const a = 42 + (seedRoom % 20);
      const b = 65;
      const c = 35; // b+c = 100 -> a * 100
      const d = 240;
      const e = 50;
      const f = 10; // (240 * 50) / 10 = 1200
      const val = (a * (b + c)) - (d * e) / f;
      return {
        formula: `(${a} * (${b} + ${c})) - ((${d} * ${e}) / ${f})`,
        val
      };
    },
    () => {
      // ((a * b) - c) + (d * (e - f))
      const a = 64;
      const b = 50 + (seedRoom % 30);
      const c = 250 + (seedRoom % 100);
      const d = 30;
      const e = 85;
      const f = 25; // e - f = 60 -> d * 60 = 1800
      const val = ((a * b) - c) + (d * (e - f));
      return {
        formula: `((${a} * ${b}) - ${c}) + (${d} * (${e} - ${f}))`,
        val
      };
    },
    () => {
      // (a * b) + (c * d) - (e / f)
      const a = 38 + (seedRoom % 24);
      const b = 55 + (seedRoom % 20);
      const c = 45;
      const d = 42 + ((seedRoom * 2) % 25);
      const f = 8;
      const e = 1600; // e / f = 200
      const val = (a * b) + (c * d) - (e / f);
      return {
        formula: `(${a} * ${b}) + (${c} * ${d}) - (${e} / ${f})`,
        val
      };
    }
  ];

  const pick = templates[seedRoom % templates.length]();
  let result = Math.round(pick.val);

  // Guarantee clamp to 4 digits: 1000 - 9999
  if (result < 1000) {
    const boost = 2500;
    return {
      formula: `${pick.formula} + ${boost}`,
      solution: String(result + boost),
      description: "Solve for the 4-digit vault unlock sequence."
    };
  } else if (result > 9999) {
    const reduced = result % 9000 + 1000;
    const diff = result - reduced;
    return {
      formula: `${pick.formula} - ${diff}`,
      solution: String(reduced),
      description: "Solve for the 4-digit vault unlock sequence."
    };
  }

  return {
    formula: pick.formula,
    solution: String(result).padStart(4, '0'),
    description: "Solve for the 4-digit vault unlock sequence."
  };
}
