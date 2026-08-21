import { useEffect, useState } from 'react';

interface Props {
  label: string;
  placeholder?: string;
  value: number | null;
  // Changes when the underlying record should resync into the input's
  // local text state (a fresh day loading in) -- NOT on every keystroke,
  // otherwise the cursor jumps mid-type while the debounced write is
  // still pending.
  resetKey: string;
  onCommit: (n: number | null) => void;
}

export function NumberInput({ label, placeholder, value, resetKey, onCommit }: Props) {
  const [text, setText] = useState(value != null ? String(value) : '');

  // Deliberately depends only on resetKey, not `value` -- see the Props comment.
  useEffect(() => {
    setText(value != null ? String(value) : '');
  }, [resetKey]);

  const id = 'field-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return (
    <div className="f">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        inputMode="decimal"
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          const v = e.target.value;
          setText(v);
          if (v.trim() === '') { onCommit(null); return; }
          const n = parseFloat(v);
          if (isFinite(n)) onCommit(n);
        }}
      />
    </div>
  );
}
