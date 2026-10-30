import { useState } from 'react'
import { supabase } from '../lib/supabase'

function AuthForm() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else if (!data.session) setMessage('가입 완료! 이메일 인증 후 로그인하세요.')
    }
  }

  return (
    <form className="panel auth" onSubmit={handleSubmit}>
      <h2>{mode === 'login' ? '로그인' : '회원가입'}</h2>
      <input
        type="email"
        placeholder="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="비밀번호 (6자 이상)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={6}
        required
      />
      <button type="submit">{mode === 'login' ? '로그인' : '가입하기'}</button>
      {message && <p className="msg">{message}</p>}
      <button
        type="button"
        className="link"
        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
      >
        {mode === 'login' ? '계정이 없나요? 회원가입' : '이미 계정이 있나요? 로그인'}
      </button>
    </form>
  )
}

export default AuthForm
