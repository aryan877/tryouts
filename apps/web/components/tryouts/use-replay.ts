"use client";

import type { TryoutRecord } from "@tryouts/kit/record";
import { useAnimate, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { endOf, frameAt } from "@/lib/board";
import { planOf, step } from "@/lib/replay";

interface State {
  at: number;
  lightsOut: number | null;
  playing: boolean;
}

export function useReplay(record: TryoutRecord, at: number = endOf(record)) {
  const plan = useMemo(() => planOf(record), [record]);
  const [state, setState] = useState<State>({ at, lightsOut: null, playing: false });
  const [now, setNow] = useState<(() => number) | null>(null);
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const raf = useRef(0);

  useEffect(() => {
    setState((s) => (s.playing || s.at === at ? s : { at, lightsOut: null, playing: false }));
  }, [at]);

  const finish = useCallback(() => {
    cancelAnimationFrame(raf.current);
    setNow(null);
    setState({ at, lightsOut: null, playing: false });
  }, [at]);

  const play = useCallback(() => {
    cancelAnimationFrame(raf.current);
    if (scope.current) animate(scope.current, { opacity: [1, 0.2, 1] }, { duration: 0.2 });
    const t0 = performance.now() + 100;
    const real = () => plan.real(Math.max(0, performance.now() - t0));
    setNow(() => real);
    let index = -1;
    let lights: number | null = -1;
    const tick = () => {
      const t = Math.max(0, performance.now() - t0);
      if (t >= plan.duration) {
        finish();
        return;
      }
      const moment = plan.real(t);
      const nextIndex = step(plan.points, moment);
      const nextLights = plan.lightsOut(t);
      if (nextIndex !== index || nextLights !== lights) {
        index = nextIndex;
        lights = nextLights;
        setState({ at: moment, lightsOut: nextLights, playing: true });
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [plan, finish, animate, scope]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const frame = useMemo(() => frameAt(record, state.at), [record, state.at]);
  return { frame, plan, scope, now, play, finish, ...state };
}

export function useAutoplay(play: () => void, enabled: boolean) {
  const reduce = useReducedMotion();
  const target = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = target.current;
    if (!enabled || reduce || !node) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let touched = false;
    const cancel = () => {
      touched = true;
      clearTimeout(timer);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        clearTimeout(timer);
        if (entry?.isIntersecting && !touched) {
          timer = setTimeout(() => {
            observer.disconnect();
            play();
          }, 1200);
        }
      },
      { threshold: 0.6 },
    );
    observer.observe(node);
    window.addEventListener("pointerdown", cancel, { once: true });
    window.addEventListener("keydown", cancel, { once: true });
    return () => {
      observer.disconnect();
      clearTimeout(timer);
      window.removeEventListener("pointerdown", cancel);
      window.removeEventListener("keydown", cancel);
    };
  }, [enabled, reduce, play]);
  return target;
}
