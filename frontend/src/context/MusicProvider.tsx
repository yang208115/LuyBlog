import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type Track = {
  id: string;
  title: string;
  artist: string | null;
  album: string | null;
  cover: string | null;
  lyric: string | null;
  url: string;
};

const fallbackTracks: Track[] = [
  {
    id: "fallback",
    title: "未配置音乐",
    artist: "LuyBlog",
    album: null,
    cover: null,
    lyric: "请在后台音乐栏目填写音乐链接和歌词。",
    url: "",
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
  seek: (time: number) => void;
};

const MusicContext = createContext<MusicContextValue | null>(null);

async function fetchTracks(): Promise<Track[]> {
  const response = await fetch("/api/music/tracks");
  if (!response.ok) throw new Error("加载歌单失败");
  return response.json();
}

function randomIndex(length: number) {
  return length > 1 ? Math.floor(Math.random() * length) : 0;
}

function shuffleTracks(items: Track[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
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
        const nextTracks = items.length ? shuffleTracks(items) : fallbackTracks;
        setTracks(nextTracks);
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
        setCurrentTime(0);
        setDuration(0);
        setIndex((value) => (value + 1) % tracks.length);
      },
      select: (nextIndex) => {
        setCurrentTime(0);
        setDuration(0);
        setIndex(nextIndex);
      },
      seek: (time) => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = time;
        setCurrentTime(time);
      },
    }),
    [current, currentTime, duration, error, index, loading, play, playing, tracks],
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.load();
    if (playing) void play();
  }, [current.url]);

  return (
    <MusicContext.Provider value={value}>
      <audio
        ref={audioRef}
        src={current.url || undefined}
        onEnded={value.next}
        onError={() => {
          setPlaying(false);
          setError("播放失败，请检查音乐链接是否有效且允许跨域访问");
        }}
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
