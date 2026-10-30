import { useEffect, useState } from 'react'
import { supabase, won } from '../lib/supabase'

function Orders({ refreshKey }) {
  const [orders, setOrders] = useState([])
  const [edit, setEdit] = useState({})
  const [message, setMessage] = useState('')

  const load = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, jeju_products(name, emoji)')
      .order('created_at', { ascending: false })
    setOrders(data ?? [])
  }

  useEffect(() => {
    load()
  }, [refreshKey])

  // 수량 수정 -> 트리거가 total_price 를 다시 계산한다
  const updateQuantity = async (order) => {
    const quantity = edit[order.id] ?? order.quantity
    const { error } = await supabase.from('orders').update({ quantity }).eq('id', order.id)
    setMessage(error ? error.message : '수량을 수정했습니다.')
    load()
  }

  const returnOrder = async (order) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'returned' })
      .eq('id', order.id)
    setMessage(error ? error.message : '반환 처리했습니다.')
    load()
  }

  return (
    <section className="panel">
      <h2>내 주문</h2>
      {message && <p className="msg">{message}</p>}
      {orders.length === 0 && <p className="desc">주문 내역이 없습니다.</p>}
      {orders.map((o) => (
        <div className={`order ${o.status}`} key={o.id}>
          <div>
            <strong>
              {o.jeju_products.emoji} {o.jeju_products.name}
            </strong>
            <p className="desc">
              단가 {won(o.unit_price)} × {o.quantity}개 = <b>{won(o.total_price)}</b>
            </p>
            <p className="desc">
              {new Date(o.created_at).toLocaleString('ko-KR')} ·{' '}
              {o.status === 'ordered' ? '주문 완료' : '반환됨'}
            </p>
          </div>
          {o.status === 'ordered' && (
            <div className="row">
              <input
                type="number"
                min="1"
                value={edit[o.id] ?? o.quantity}
                onChange={(e) =>
                  setEdit({ ...edit, [o.id]: Math.max(1, Number(e.target.value)) })
                }
              />
              <button onClick={() => updateQuantity(o)}>수정</button>
              <button className="danger" onClick={() => returnOrder(o)}>
                반환
              </button>
            </div>
          )}
        </div>
      ))}
    </section>
  )
}

export default Orders
