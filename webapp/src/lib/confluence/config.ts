// This constant is read at runtime by generateConfluenceRead() as a guard
// -- not documentation. If it's ever anything other than
// 'descriptive-only', the engine refuses to produce a read rather than
// silently emitting something else. The output label type in engine.ts is
// a closed union of descriptive states (SETUP_FORMING, etc.) with no
// direction or action in it -- there is no code path that can construct a
// "buy"/"sell"/"long"/"short" value from this engine, by construction of
// the type, not by convention.
export const CONFLUENCE_MODE = 'descriptive-only' as const;

export const CONFLUENCE_DISCLAIMER =
  "A confluence read describes how many of the framework's own entry checks are confirmed right now. " +
  'It is not a buy or sell signal, does not predict an outcome, and never recommends entering or exiting a trade.';
