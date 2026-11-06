import type { App, Room, TryoutRecord } from "@tryouts/kit/record";
import { ArrowUpRight, ChevronDown } from "@/components/icons";
import { cn } from "@/lib/utils";
import { APP_LABEL, AppGlyph } from "./app-glyph";

function RoomLine({ room, posted }: { room: Room; posted: string }) {
  return (
    <li className="flex items-center gap-2 py-1.5 text-[13px] leading-[18px]">
      <span className="mono text-ink">#{room.name}</span>
      <span className="truncate text-ink-3">
        {room.owner}'s room{room.name === posted ? " · jobs and approvals" : ""}
      </span>
      {room.url && (
        <a
          href={room.url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open #${room.name} in ${APP_LABEL[room.app]}`}
          className="ml-auto text-ink-3 hover:text-ink"
        >
          <ArrowUpRight className="size-3.5" />
        </a>
      )}
    </li>
  );
}

export function LinkedRooms({ record, className }: { record: TryoutRecord; className?: string }) {
  const apps = [...new Set(record.rooms.map((room) => room.app))] as App[];
  return (
    <section aria-labelledby="rooms-title" className={cn("panel", className)}>
      <header className="flex items-center gap-3 border-b border-line px-4 py-3">
        <h2 id="rooms-title" className="caps text-ink">
          Linked rooms
        </h2>
        <span className="ml-auto text-[12px] text-ink-3">
          {apps
            .map((app) => `${APP_LABEL[app]} ${record.rooms.filter((r) => r.app === app).length}`)
            .join(" · ")}
        </span>
      </header>
      <div className="divide-y divide-line px-4">
        {apps.map((app) => {
          const rooms = record.rooms.filter((room) => room.app === app);
          const groups = [...new Set(rooms.map((room) => room.group).filter(Boolean))] as string[];
          return (
            <div key={app} className="py-2.5">
              <p className="caps flex items-center gap-1.5 text-ink-3">
                <AppGlyph app={app} label={false} className="size-3 text-ink-2" />
                {APP_LABEL[app]}
              </p>
              <ul className="mt-1">
                {rooms
                  .filter((room) => !room.group)
                  .map((room) => (
                    <RoomLine key={room.name} room={room} posted={record.posted.room} />
                  ))}
              </ul>
              {groups.map((group) => {
                const members = rooms.filter((room) => room.group === group);
                return (
                  <details key={group} className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-2 py-1.5 text-[13px] leading-[18px] [&::-webkit-details-marker]:hidden">
                      <span className="font-semibold text-ink">{group}</span>
                      <span className="text-ink-3">
                        room group · {members.length} private tryout rooms
                      </span>
                      <ChevronDown className="ml-auto size-4 text-ink-3 transition-transform group-open:rotate-180" />
                    </summary>
                    <ul className="mb-1 ml-1 border-l border-line pl-3">
                      {members.map((room) => (
                        <RoomLine key={room.name} room={room} posted={record.posted.room} />
                      ))}
                    </ul>
                  </details>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}
