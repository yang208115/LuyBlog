import { useMutation, useQuery } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { contentApi } from "../services/content";

const emptyForm = { name: "", description: "", url: "", avatarUrl: "" };

export function FriendsPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const query = useQuery({ queryKey: ["friend-links"], queryFn: contentApi.friendLinks });
  const mutation = useMutation({
    mutationFn: contentApi.applyFriendLink,
    onSuccess: () => {
      setForm(emptyForm);
      setOpen(false);
    },
  });
  const friends = query.data ?? [];

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate(form);
  };

  return (
    <>
      <div className="page-shell">
        <header className="page-heading">
          <div>
            <span className="eyebrow">NEIGHBORS / 友链</span>
            <h1>互联网邻居</h1>
            <p>在算法之外，仍然有人认真维护属于自己的小角落。</p>
          </div>
          <button className="button accent" type="button" onClick={() => setOpen(true)}>
            申请友链
          </button>
        </header>

        {query.isLoading ? (
          <div className="empty-state">
            <div className="loader" />
            <strong>正在拜访互联网邻居</strong>
          </div>
        ) : (
          <div className="friend-grid">
            {friends.map((friend) => (
              <a className="friend-card" href={friend.url} target="_blank" rel="noreferrer" key={friend.id}>
                {friend.avatarUrl ? (
                  <img className="friend-avatar" src={friend.avatarUrl} alt="" />
                ) : (
                  <span className="friend-avatar">{friend.name.slice(0, 1)}</span>
                )}
                <div>
                  <h3>{friend.name}</h3>
                  <p>{friend.description || "一个认真维护的小角落。"}</p>
                </div>
              </a>
            ))}
          </div>
        )}

        <section className="section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">JOIN THE RING</span>
              <h2>交换一扇窗</h2>
              <p>如果你也在持续写作，欢迎留下站点信息。审核通过后会出现在上方列表。</p>
            </div>
            <button className="button primary" type="button" onClick={() => setOpen(true)}>
              填写申请
            </button>
          </div>
        </section>
      </div>

      {open && (
        <div className="command-panel open" role="presentation" onMouseDown={() => setOpen(false)}>
          <dialog className="prototype-dialog" open onMouseDown={(event) => event.stopPropagation()}>
            <form onSubmit={submit}>
              <header>
                <div>
                  <span className="eyebrow">NEW NEIGHBOR</span>
                  <h2>申请友链</h2>
                </div>
                <button className="icon-button" type="button" aria-label="关闭弹窗" onClick={() => setOpen(false)}>
                  ×
                </button>
              </header>
              <div className="dialog-body">
                <div className="form-grid">
                  <label className="field">
                    <span>站点名称</span>
                    <input
                      required
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>链接 URL</span>
                    <input
                      required
                      type="url"
                      value={form.url}
                      onChange={(event) => setForm({ ...form, url: event.target.value })}
                    />
                  </label>
                  <label className="field full">
                    <span>简介</span>
                    <textarea
                      required
                      value={form.description}
                      onChange={(event) => setForm({ ...form, description: event.target.value })}
                    />
                  </label>
                  <label className="field full">
                    <span>头像 URL</span>
                    <input
                      required
                      type="url"
                      value={form.avatarUrl}
                      onChange={(event) => setForm({ ...form, avatarUrl: event.target.value })}
                    />
                  </label>
                </div>
                {mutation.isError && <div className="alert error">提交失败，请稍后重试。</div>}
              </div>
              <footer>
                <button className="button ghost" type="button" onClick={() => setOpen(false)}>
                  取消
                </button>
                <button className="button primary" type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "提交中…" : "提交申请"}
                </button>
              </footer>
            </form>
          </dialog>
        </div>
      )}
    </>
  );
}
