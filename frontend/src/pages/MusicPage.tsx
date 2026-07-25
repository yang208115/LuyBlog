import { useMusic } from "../context/MusicProvider";
import { LyricsView } from "../components/LyricsView";

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "00:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function MusicPage() {
  const music = useMusic();
  const progress = music.duration ? Math.min(100, (music.currentTime / music.duration) * 100) : 0;

  return (
    <div className="page-shell">
      <header className="page-heading">
        <div>
          <span className="eyebrow">LISTENING ROOM / 音乐</span>
          <h1>此刻正在播放</h1>
          <p>有些记忆不按日期归档，它们住在一首歌里。</p>
        </div>
      </header>

      <div className="music-layout">
        <div className="album-stage">
          <div
            className={`record${music.playing ? " playing" : ""}`}
            style={music.current.cover ? { backgroundImage: `url(${music.current.cover})` } : undefined}
          >
          </div>
        </div>
        <section className="lyrics-panel">
          <span className="eyebrow">TRACK {String(music.index + 1).padStart(2, "0")}</span>
          <h2 className="track-title">{music.current.title}</h2>
          <span>{music.current.artist || "未知歌手"}</span>
          <div className="lyrics">
            <LyricsView lyric={music.current.lyric} currentTime={music.currentTime} onSeek={music.seek} />
          </div>
          <div className="progress">
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="player-controls">
            <span className="note-date">
              {formatTime(music.currentTime)} / {formatTime(music.duration)}
            </span>
            <div>
              <button
                className="icon-button"
                type="button"
                aria-label="上一首"
                onClick={() => music.select((music.index - 1 + music.tracks.length) % music.tracks.length)}
              >
                ↞
              </button>{" "}
              <button className="button primary" type="button" onClick={music.toggle}>
                {music.playing ? "暂停" : "播放"}
              </button>{" "}
              <button className="icon-button" type="button" aria-label="下一首" onClick={music.next}>
                ↠
              </button>
            </div>
          </div>
        </section>
      </div>

      <section className="playlist">
        <div className="section-heading">
          <div>
            <span className="eyebrow">QUEUE</span>
            <h2>播放列表</h2>
          </div>
        </div>
        {music.tracks.map((track, index) => (
          <button
            className={`playlist-row${index === music.index ? " active" : ""}`}
            type="button"
            onClick={() => music.select(index)}
            key={track.id}
          >
            <span className="note-date">{String(index + 1).padStart(2, "0")}</span>
            <span>
              <strong>{track.title}</strong>
              <small className="cell-sub">{track.artist || "未知歌手"}</small>
            </span>
            <span>{track.album || "SINGLE"}</span>
            <span>↗</span>
          </button>
        ))}
      </section>
    </div>
  );
}
