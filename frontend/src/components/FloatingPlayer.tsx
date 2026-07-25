import { useLocation, Link as RouterLink } from "react-router-dom";
import { useMusic } from "../context/MusicProvider";

export function FloatingPlayer() {
  const location = useLocation();
  const music = useMusic();

  if (location.pathname === "/music" || location.pathname.startsWith("/admin")) return null;

  return (
    <section className="mini-player" aria-label="迷你音乐播放器">
      <RouterLink className="mini-cover" to="/music" aria-label="打开音乐页面">
        {music.current.cover ? (
          <img src={music.current.cover} alt={`${music.current.title}封面`} />
        ) : (
          <span aria-hidden="true">♫</span>
        )}
      </RouterLink>
      <RouterLink className="mini-track" to="/music">
        <small>NOW PLAYING</small>
        <strong>{music.current.title}</strong>
        <span>{music.current.artist || "Cloud Music"}</span>
      </RouterLink>
      <div className="mini-controls">
        <button
          className="mini-control primary"
          type="button"
          aria-label={music.playing ? "暂停音乐" : "播放音乐"}
          onClick={music.toggle}
        >
          {music.playing ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="6.5" y="5" width="4" height="14" rx="1" />
              <rect x="13.5" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5.6v12.8a1 1 0 0 0 1.54.84l9.1-6.4a1 1 0 0 0 0-1.68l-9.1-6.4A1 1 0 0 0 8 5.6Z" />
            </svg>
          )}
        </button>
        <button className="mini-control" type="button" aria-label="下一首" onClick={music.next}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5.5 6.2v11.6a1 1 0 0 0 1.55.83l8.1-5.8a1 1 0 0 0 0-1.62l-8.1-5.82a1 1 0 0 0-1.55.81Z" />
            <rect x="17" y="6" width="2" height="12" rx="1" />
          </svg>
        </button>
      </div>
    </section>
  );
}
