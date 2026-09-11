'use client';

import { useEffect, useRef } from 'react';
import { startApp } from '../lib/training-log';

// The log UI is plain DOM code ported from the original HTML; React only provides the mount point.
export default function Page() {
  const rootRef = useRef(null);
  useEffect(() => startApp(rootRef.current), []);
  return <div ref={rootRef} />;
}
