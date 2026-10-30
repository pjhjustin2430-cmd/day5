import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import AuthForm from './components/AuthForm'
import ProductList from './components/ProductList'
import Orders from './components/Orders'
import Guestbook from './components/Guestbook'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState('shop')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  if (!ready) return null

  return (
    <>
      <header className="hero">
        <h1>🍊 제주 특산물 마켓</h1>
        <p>제주의 맛을 집으로 가져오세요</p>
        {user && (
          <div className="userbar">
            {user.email}
            <button className="ghost" onClick={() => supabase.auth.signOut()}>
              로그아웃
            </button>
          </div>
        )}
      </header>

      <main className="container">
        {!user ? (
          <AuthForm />
        ) : (
          <>
            <nav className="tabs">
              <button className={tab === 'shop' ? '' : 'ghost'} onClick={() => setTab('shop')}>
                특산물
              </button>
              <button className={tab === 'orders' ? '' : 'ghost'} onClick={() => setTab('orders')}>
                내 주문
              </button>
              <button className={tab === 'guest' ? '' : 'ghost'} onClick={() => setTab('guest')}>
                방명록
              </button>
            </nav>
            {tab === 'shop' && <ProductList onOrdered={() => setRefreshKey(refreshKey + 1)} />}
            {tab === 'orders' && <Orders refreshKey={refreshKey} />}
            {tab === 'guest' && <Guestbook user={user} />}
          </>
        )}
      </main>
    </>
  )
}

export default App
