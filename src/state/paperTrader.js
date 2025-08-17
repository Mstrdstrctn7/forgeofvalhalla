// src/state/paperTrader.js

let _state = {
  balance: 10000,            // USDT paper balance
  positions: {},             // { [instrument]: { qty, avg } }
  logs: [],                  // trade log rows
};

function log(row) {
  _state.logs.unshift({ id: Date.now() + Math.random(), ts: Date.now(), ...row });
}

export function getState() {
  return _state;
}

export function resetState() {
  _state = { balance: 10000, positions: {}, logs: [] };
  log({ type: "RESET" });
  return _state;
}

/**
 * Market order in paper mode
 * @param {Object} p
 * @param {"BUY"|"SELL"} p.side
 * @param {string} p.instrument - e.g., "BTC_USDT"
 * @param {number} p.price
 * @param {number} p.percent - percent of balance (BUY) or position qty (SELL)
 */
export function marketOrder({ side, instrument, price, percent }) {
  if (!price || price <= 0) return _state;

  const pos = _state.positions[instrument] || { qty: 0, avg: 0 };

  if (side === "BUY") {
    const spend = (_state.balance * (percent / 100));
    if (spend <= 0) return _state;

    const qty = spend / price;

    const newQty = pos.qty + qty;
    const newAvg = newQty
      ? (pos.qty * pos.avg + qty * price) / newQty
      : price;

    _state.balance -= spend;
    _state.positions[instrument] = { qty: newQty, avg: newAvg };
    log({ type: "BUY", instrument, price, qty, spend });
  } else {
    // SELL: percent of current position quantity
    if (pos.qty <= 0) return _state;

    const qty = pos.qty * (percent / 100);
    const sellQty = Math.min(pos.qty, qty);

    const receive = sellQty * price;
    const remainQty = pos.qty - sellQty;

    _state.balance += receive;
    if (remainQty <= 1e-12) {
      delete _state.positions[instrument];
    } else {
      _state.positions[instrument] = { qty: remainQty, avg: pos.avg };
    }
    log({ type: "SELL", instrument, price, qty: sellQty, receive });
  }

  return _state;
}
