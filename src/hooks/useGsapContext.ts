'use client';

import { useLayoutEffect } from 'react';
import gsap from '@/lib/gsap';

export const useGsapContext = (
  callback: (context: gsap.Context) => void,
  scope?: React.RefObject<Element | null>
) => {
  useLayoutEffect(() => {
    const ctx = gsap.context(callback, scope);
    return () => ctx.revert();
  }, [callback, scope]);
};
