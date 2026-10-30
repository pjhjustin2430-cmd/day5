import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function Guestbook({ user }) {
  const [posts, setPosts] = useState([])
  const [comments, setComments] = useState([])
  const [likes, setLikes] = useState([])
  const [content, setContent] = useState('')
  const [commentText, setCommentText] = useState({})

  const load = async () => {
    const [p, c, l] = await Promise.all([
      supabase.from('guestbook').select('*').order('created_at', { ascending: false }),
      supabase.from('guestbook_comments').select('*').order('created_at'),
      supabase.from('guestbook_likes').select('*'),
    ])
    setPosts(p.data ?? [])
    setComments(c.data ?? [])
    setLikes(l.data ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  const addPost = async (e) => {
    e.preventDefault()
    await supabase.from('guestbook').insert({ content, author_email: user.email })
    setContent('')
    load()
  }

  const deletePost = async (id) => {
    await supabase.from('guestbook').delete().eq('id', id)
    load()
  }

  const addComment = async (postId) => {
    const text = commentText[postId]
    if (!text) return
    await supabase
      .from('guestbook_comments')
      .insert({ post_id: postId, content: text, author_email: user.email })
    setCommentText({ ...commentText, [postId]: '' })
    load()
  }

  const deleteComment = async (id) => {
    await supabase.from('guestbook_comments').delete().eq('id', id)
    load()
  }

  const toggleLike = async (postId) => {
    const liked = likes.some((l) => l.post_id === postId && l.user_id === user.id)
    if (liked) {
      await supabase.from('guestbook_likes').delete().match({ post_id: postId, user_id: user.id })
    } else {
      await supabase.from('guestbook_likes').insert({ post_id: postId })
    }
    load()
  }

  return (
    <section>
      <form className="panel" onSubmit={addPost}>
        <h2>방명록</h2>
        <textarea
          placeholder="제주 특산물 후기를 남겨주세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <button type="submit">등록</button>
      </form>

      {posts.map((post) => {
        const postLikes = likes.filter((l) => l.post_id === post.id)
        const liked = postLikes.some((l) => l.user_id === user.id)
        return (
          <article className="panel" key={post.id}>
            <p className="desc">
              {post.author_email} · {new Date(post.created_at).toLocaleString('ko-KR')}
            </p>
            <p>{post.content}</p>
            <div className="row">
              <button className={liked ? '' : 'ghost'} onClick={() => toggleLike(post.id)}>
                {liked ? '❤️' : '🤍'} {postLikes.length}
              </button>
              {post.user_id === user.id && (
                <button className="danger" onClick={() => deletePost(post.id)}>
                  삭제
                </button>
              )}
            </div>
            <div className="comments">
              {comments
                .filter((c) => c.post_id === post.id)
                .map((c) => (
                  <p key={c.id}>
                    <b>{c.author_email}</b> {c.content}{' '}
                    {c.user_id === user.id && (
                      <button className="link" onClick={() => deleteComment(c.id)}>
                        삭제
                      </button>
                    )}
                  </p>
                ))}
              <div className="row">
                <input
                  placeholder="댓글 달기"
                  value={commentText[post.id] || ''}
                  onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                />
                <button onClick={() => addComment(post.id)}>댓글</button>
              </div>
            </div>
          </article>
        )
      })}
    </section>
  )
}

export default Guestbook
