import { useRef, useState } from "react";
import styles from "./calc.module.css";

type Op = "+" | "-" | "*" | "/";

const MAX_LEN = 14;

type CalcState = {
  display: string;
  acc: number | null;
  pending: Op | null;
  overwrite: boolean;
  last: { op: Op; operand: number } | null;
};

const INITIAL: CalcState = { display: "0", acc: null, pending: null, overwrite: true, last: null };

// Rows are laid out by CSS grid auto-placement: "+" spans two rows, "0" two columns.
// plainLabel swaps in a real ×/− glyph for the plain style; the mac replica keeps
// the ASCII faces of the 1984 original.
const KEYS: Array<{ label: string; plainLabel?: string; className?: string }> = [
  { label: "C" },
  { label: "E" },
  { label: "=" },
  { label: "*", plainLabel: "×" },
  { label: "7" },
  { label: "8" },
  { label: "9" },
  { label: "/" },
  { label: "4" },
  { label: "5" },
  { label: "6" },
  { label: "-", plainLabel: "−" },
  { label: "1" },
  { label: "2" },
  { label: "3" },
  { label: "+", className: styles.keyPlus },
  { label: "0", className: styles.keyZero },
  { label: "." },
];

function apply(a: number, b: number, op: Op): number {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      return a / b;
  }
}

function format(n: number): string {
  if (!Number.isFinite(n)) return "Error";
  // toPrecision(12) trims float noise like 0.1 + 0.2
  const clean = parseFloat(n.toPrecision(12));
  const plain = String(clean);
  if (plain.length <= MAX_LEN) return plain;
  const [mantissa, exponent] = clean.toExponential(6).split("e");
  return `${parseFloat(mantissa)}e${exponent}`;
}

// The display may hold a half-typed exponent ("5e"); read it as its base
function current(s: CalcState): number {
  const n = Number(s.display);
  if (Number.isFinite(n)) return n;
  const trimmed = Number(s.display.replace(/e[+-]?$/, ""));
  return Number.isFinite(trimmed) ? trimmed : 0;
}

function press(s: CalcState, key: string): CalcState {
  if (key === "C") return INITIAL;
  if (s.display === "Error") return s;

  if (key >= "0" && key <= "9") {
    if (s.overwrite) return { ...s, display: key, overwrite: false };
    if (s.display.replace("-", "").length >= MAX_LEN) return s;
    return { ...s, display: s.display === "0" ? key : s.display + key };
  }

  if (key === ".") {
    if (s.overwrite) return { ...s, display: "0.", overwrite: false };
    if (s.display.includes(".") || s.display.includes("e")) return s;
    return { ...s, display: s.display + "." };
  }

  if (key === "E") {
    if (s.overwrite) return { ...s, display: "1e", overwrite: false };
    if (s.display.includes("e")) return s;
    return { ...s, display: s.display + "e" };
  }

  if (key === "+" || key === "-" || key === "*" || key === "/") {
    const value = current(s);
    if (s.pending !== null && s.acc !== null && !s.overwrite) {
      const result = apply(s.acc, value, s.pending);
      const display = format(result);
      if (display === "Error") return { ...INITIAL, display };
      return { ...s, display, acc: result, pending: key, overwrite: true };
    }
    return { ...s, acc: value, pending: key, overwrite: true };
  }

  if (key === "=") {
    if (s.pending !== null && s.acc !== null) {
      const operand = current(s);
      const display = format(apply(s.acc, operand, s.pending));
      if (display === "Error") return { ...INITIAL, display };
      return { display, acc: null, pending: null, overwrite: true, last: { op: s.pending, operand } };
    }
    // Bare "=" repeats the last operation, like the original
    if (s.last !== null) {
      const display = format(apply(current(s), s.last.operand, s.last.op));
      if (display === "Error") return { ...INITIAL, display };
      return { ...s, display, overwrite: true };
    }
    // Nothing to compute: still normalize the entry ("5e3" -> 5000, "3." -> 3)
    return { ...s, display: format(current(s)), overwrite: true };
  }

  if (key === "⌫") {
    if (s.overwrite) return s;
    const next = s.display.length > 1 ? s.display.slice(0, -1) : "0";
    return { ...s, display: next };
  }

  return s;
}

export default function Calculator({ config }: { config: Record<string, unknown> }) {
  const [state, setState] = useState(INITIAL);
  const containerRef = useRef<HTMLDivElement>(null);

  const comp = config.comp as Record<string, unknown> | undefined;
  const steveJobs = comp?.steveJobs !== false;

  function handlePress(key: string) {
    setState((s) => press(s, key));
    containerRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const k = e.key;
    let key: string | null = null;
    if (/^[0-9]$/.test(k)) key = k;
    else if (k === "." || k === "+" || k === "-" || k === "*" || k === "/") key = k;
    else if (k === "e" || k === "E") key = "E";
    else if (k === "Enter" || k === "=") key = "=";
    else if (k === "Escape" || k === "c" || k === "C") key = "C";
    else if (k === "Backspace") key = "⌫";
    if (key === null) return;
    e.preventDefault();
    e.stopPropagation();
    setState((s) => press(s, key));
  }

  return (
    <div ref={containerRef} className={styles.container} tabIndex={0} onKeyDown={handleKeyDown}>
      <div className={`${styles.window} ${steveJobs ? styles.mac : styles.plain}`}>
        {steveJobs && (
          <div className={styles.titleBar}>
            <span className={styles.closeBox} />
            <span className={styles.titleText}>Calculator</span>
            <span className={styles.titleSpacer} />
          </div>
        )}
        <div className={styles.display}>{state.display}</div>
        <div className={styles.keys}>
          {KEYS.map((k) => (
            <button
              key={k.label}
              type="button"
              tabIndex={-1}
              className={`${styles.key} ${k.className ?? ""}`}
              onClick={() => handlePress(k.label)}
            >
              {steveJobs ? k.label : (k.plainLabel ?? k.label)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
