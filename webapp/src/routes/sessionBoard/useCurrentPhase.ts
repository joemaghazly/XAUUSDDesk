import { useEffect, useState } from 'react';
import { beirutParts, phaseFor, type Phase } from '../../lib/beirut';

export function useCurrentPhase(): Phase {
  const [phase, setPhase] = useState<Phase>(() => phaseFor(beirutParts().h));
  useEffect(() => {
    const id = setInterval(() => setPhase(phaseFor(beirutParts().h)), 1000);
    return () => clearInterval(id);
  }, []);
  return phase;
}
