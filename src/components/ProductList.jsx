import { useEffect, useState } from 'react'
import { supabase, won } from '../lib/supabase'

function ProductList({ onOrdered }) {
  const [products, setProducts] = useState([])
  const [qty, setQty] = useState({})
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase
      .from('jeju_products')
      .select('*')
      .order('id')
      .then(({ data }) => setProducts(data ?? []))
  }, [])

  const buy = async (product) => {
    const quantity = qty[product.id] || 1
    // total_price(단가 * 수량)는 DB 트리거가 계산해서 저장한다
    const { error } = await supabase
      .from('orders')
      .insert({ product_id: product.id, quantity })
    setMessage(
      error
        ? error.message
        : `${product.name} ${quantity}개 구매 완료 (${won(product.price * quantity)})`,
    )
    if (!error) onOrdered()
  }

  return (
    <section>
      {message && <p className="msg">{message}</p>}
      <div className="grid">
        {products.map((p) => (
          <article className="card" key={p.id}>
            <div className="emoji">{p.emoji}</div>
            <h3>{p.name}</h3>
            <p className="desc">{p.description}</p>
            <p className="price">{won(p.price)}</p>
            <div className="row">
              <input
                type="number"
                min="1"
                value={qty[p.id] || 1}
                onChange={(e) =>
                  setQty({ ...qty, [p.id]: Math.max(1, Number(e.target.value)) })
                }
              />
              <button onClick={() => buy(p)}>구매</button>
            </div>
            <p className="desc">합계 {won(p.price * (qty[p.id] || 1))}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default ProductList
