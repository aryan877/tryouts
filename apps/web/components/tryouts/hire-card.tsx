"use client";

import type { Candidate, TryoutRecord } from "@tryouts/kit/record";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Refresh } from "@/components/icons";
import { appOf, CHECKS, type LightState, lightsOf, ownerOf } from "@/lib/board";
import { FLIP_FLAG, flipKey } from "@/lib/flip";
import { CardBack, CardFace } from "./agent-card";
import { HiredStamp } from "./hired-stamp";

const STAMP = { type: "spring", stiffness: 760, damping: 24, mass: 0.8 } as const;

export function HireCard({ record, candidate }: { record: TryoutRecord; candidate: Candidate }) {
  const reduce = useReducedMotion();
  const [run, setRun] = useState(0);
  const [step, setStep] = useState(4);
  const [lit, setLit] = useState(5);
  const tilt = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hire = record.hire;

  const play = useCallback(() => {
    for (const timer of timers.current) clearTimeout(timer);
    setRun((n) => n + 1);
    setStep(0);
    setLit(0);
    const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));
    at(640, () => setStep(1));
    for (let i = 1; i <= 5; i++) at(1100 + (i - 1) * 80, () => setLit(i));
    at(1600, () => setStep(2));
    at(1900, () => setStep(3));
    at(2800, () => setStep(4));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (root.hasAttribute(FLIP_FLAG)) {
      sessionStorage.setItem(flipKey(candidate.agent), "1");
      play();
    }
    const pending = timers.current;
    return () => {
      for (const timer of pending) clearTimeout(timer);
    };
  }, [candidate.agent, play]);

  useEffect(() => {
    if (run > 0) document.documentElement.removeAttribute(FLIP_FLAG);
  }, [run]);

  const onMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const node = tilt.current;
    if (!node || reduce || event.pointerType !== "mouse") return;
    const box = node.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    node.style.transform = `rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg)`;
    node.style.setProperty("--sheen-x", `${(x + 0.5) * 100}%`);
  };
  const onLeave = () => {
    if (tilt.current) tilt.current.style.transform = "";
  };

  const finalLights = lightsOf(candidate);
  const lights: LightState[] = CHECKS.map((_, i) => (i < lit ? (finalLights[i] ?? "off") : "off"));

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="perspective-[1200px]" onPointerMove={onMove} onPointerLeave={onLeave}>
        <div
          ref={tilt}
          className="group/card relative transition-transform duration-[120ms] ease-out transform-3d"
        >
          <motion.div
            key={run}
            data-flipper
            initial={run > 0 && !reduce ? { rotateY: 180 } : false}
            animate={{ rotateY: 0 }}
            transition={{ duration: 0.64, ease: [0.65, 0, 0.35, 1] }}
            className="relative h-[504px] w-[360px] transform-3d"
          >
            <div className="foil absolute inset-0 rounded-card p-1.5 backface-hidden">
              <CardFace
                record={record}
                candidate={candidate}
                roll={step >= 1 && run > 0}
                lights={lights}
                stamp={
                  <AnimatePresence initial={false}>
                    {step >= 2 && hire && (
                      <motion.div
                        key="stamp"
                        initial={{ scale: 1.35, rotate: -9, opacity: 0, y: -8 }}
                        animate={{ scale: 1, rotate: -3, opacity: 1, y: 0 }}
                        transition={STAMP}
                      >
                        <HiredStamp
                          role={record.role}
                          date={hire.approval.answeredAt ?? hire.at}
                          approver={ownerOf(record)}
                          app={appOf(record, hire.approval.room)}
                          size="card"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                }
              />
              {step === 3 && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-card"
                  style={{
                    backgroundImage:
                      "linear-gradient(105deg, transparent 40%, rgb(255 255 255 / .55) 50%, transparent 60%)",
                    backgroundSize: "200% 100%",
                    animation: "sheen 900ms var(--ease-in-out) both",
                  }}
                />
              )}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-card opacity-0 transition-opacity duration-200 group-hover/card:opacity-30 motion-reduce:hidden"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at var(--sheen-x, 50%) 30%, rgb(255 255 255 / .5), transparent 45%)",
                }}
              />
            </div>
            <div className="foil absolute inset-0 rotate-y-180 rounded-card p-1.5 backface-hidden">
              <CardBack candidate={candidate} />
            </div>
          </motion.div>
        </div>
      </div>
      <button
        type="button"
        onClick={play}
        className="inline-flex h-8 items-center gap-1.5 rounded-control px-2 text-[13px] font-semibold text-ink-2 hover:bg-surface-2 hover:text-ink"
      >
        <Refresh className="size-3.5" />
        Replay card
      </button>
    </div>
  );
}
