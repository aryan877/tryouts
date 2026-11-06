"use client";

import { Dialog } from "radix-ui";
import { Close, Play } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { VIDEO_URL } from "@/lib/site";

const YOUTUBE = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/;

export function VideoButton({
  size = "sm",
  shape,
  label = "Video",
}: {
  size?: "sm" | "lg";
  shape?: "rounded";
  label?: string;
}) {
  if (!VIDEO_URL) return null;
  const youtube = YOUTUBE.exec(VIDEO_URL)?.[1];
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="secondary" size={size} shape={shape}>
          <Play className="size-3.5" />
          {label}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(92vw,1120px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-black shadow-menu outline-none">
          <Dialog.Title className="sr-only">Tryouts video</Dialog.Title>
          <div className="aspect-video">
            {youtube ? (
              <iframe
                className="size-full"
                src={`https://www.youtube-nocookie.com/embed/${youtube}?autoplay=1`}
                title="Tryouts video"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              // biome-ignore lint/a11y/useMediaCaption: the video has burned-in captions
              <video className="size-full" src={VIDEO_URL} controls autoPlay playsInline />
            )}
          </div>
          <Dialog.Close
            aria-label="Close the video"
            className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
          >
            <Close />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
