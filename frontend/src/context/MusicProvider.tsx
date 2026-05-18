import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type Track = {
  id: string;
  neteaseId: string;
  title: string;
  artist: string | null;
  album: string | null;
  cover: string | null;
  lyric: string | null;
  url: string | null;
  level: string;
};

const fallbackTracks: Track[] = [
  {
    id: "fallback",
    neteaseId: "",
    title: "未配置歌单",
    artist: "LuyBlog",
    album: null,
    cover: null,
    lyric: "请在后台音乐栏目添加网易云歌曲 ID。",
    url: null,
    level: "exhigh",
  },
];

type MusicContextValue = {
  tracks: Track[];
  current: Track;
  index: number;
  playing: boolean;
  loading: boolean;
  error: string | null;
  currentTime: number;
  duration: number;
  toggle: () => void;
  next: () => void;
  select: (index: number) => void;
  refreshCurrent: () => Promise<void>;
  seek: (time: number) => void;
};

const MusicContext = createContext<MusicContextValue | null>(null);

async function fetchTracks(): Promise<Track[]> {
  const response = await fetch("/api/music/tracks");
  if (!response.ok) throw new Error("加载歌单失败");
  return response.json();
}

async function refreshTrack(id: string): Promise<Track> {
  const response = await fetch(`/api/music/tracks/${id}/refresh`, { method: "POST" });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "刷新歌曲 URL 失败");
  }
  return response.json();
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const retryingRef = useRef(false);
  const [tracks, setTracks] = useState<Track[]>(fallbackTracks);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const current = tracks[index] ?? tracks[0] ?? fallbackTracks[0];

  useEffect(() => {
    let cancelled = false;
    fetchTracks()
      .then((items) => {
        if (cancelled) return;
        setTracks(items.length ? items : fallbackTracks);
        setIndex(0);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "加载歌单失败");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const replaceCurrentTrack = useCallback((track: Track) => {
    setTracks((items) => items.map((item) => (item.id === track.id ? track : item)));
  }, []);

  const refreshCurrent = useCallback(async () => {
    if (!current.id || current.id === "fallback") return;
    const updated = await refreshTrack(current.id);
    replaceCurrentTrack(updated);
  }, [current.id, replaceCurrentTrack]);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !current.url) {
      setPlaying(false);
      return;
    }
    try {
      await audio.play();
      setPlaying(true);
      setError(null);
    } catch (err) {
      setPlaying(false);
      setError(err instanceof Error ? err.message : "播放失败");
    }
  }, [current.url]);

  const value = useMemo<MusicContextValue>(
    () => ({
      tracks,
      current,
      index,
      playing,
      loading,
      error,
      currentTime,
      duration,
      toggle: () => {
        const audio = audioRef.current;
        if (!audio || !current.url) return;
        if (playing) {
          audio.pause();
          setPlaying(false);
        } else {
          void play();
        }
      },
      next: () => {
        setIndex((value) => (value + 1) % tracks.length);
        retryingRef.current = false;
      },
      select: (nextIndex) => {
        setIndex(nextIndex);
        retryingRef.current = false;
      },
      refreshCurrent,
      seek: (time) => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = time;
        setCurrentTime(time);
      },
    }),
    [current, currentTime, duration, error, index, loading, play, playing, refreshCurrent, tracks],
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.load();
    if (playing) void play();
  }, [current.url, play, playing]);

  const handleError = async () => {
    if (retryingRef.current || current.id === "fallback") {
      setPlaying(false);
      setError("播放失败，歌曲 URL 刷新后仍不可用");
      return;
    }
    retryingRef.current = true;
    try {
      const updated = await refreshTrack(current.id);
      replaceCurrentTrack(updated);
      window.setTimeout(() => void play(), 100);
    } catch (err) {
      setPlaying(false);
      setError(err instanceof Error ? err.message : "刷新歌曲 URL 失败");
    }
  };

  return (
    <MusicContext.Provider value={value}>
      <audio
        ref={audioRef}
        src={current.url ?? undefined}
        onEnded={value.next}
        onError={() => void handleError()}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
        preload="none"
      />
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) throw new Error("useMusic must be used within MusicProvider");
  return context;
}
