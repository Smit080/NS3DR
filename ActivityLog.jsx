export default function Header({ stats, serial }) {
  return (
    <div className="nameplate">
      <span className="rivet tl"></span><span className="rivet tr"></span>
      <span className="rivet bl"></span><span className="rivet br"></span>
      <div className="nameplate-top">
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L13.5 5.5L17 4L16 7.5L19.5 8L17.5 11L20.5 13L17 14L18 17.5L14.5 16.5L13.5 20L12 17L10.5 20L9.5 16.5L6 17.5L7 14L3.5 13L6.5 11L4.5 8L8 7.5L7 4L10.5 5.5L12 2Z" fill="white"/>
              <circle cx="12" cy="12" r="3.2" fill="#e8590c"/>
            </svg>
          </div>
          <div>
            <h1>NS3DR AUTOMATION</h1>
            <div className="sub">CNC Router Systems — Stock &amp; Component Control</div>
          </div>
        </div>
        <div className="plate-id">
          MODEL: <b>SC-INV/2</b><br />
          SERIAL: <b>{serial}</b>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat"><span className="num">{stats.total}</span><span className="lbl">COMPONENTS TRACKED</span></div>
        <div className="stat"><span className="num">{stats.units}</span><span className="lbl">TOTAL UNITS IN STOCK</span></div>
        <div className="stat warn"><span className="num">{stats.low}</span><span className="lbl">LOW STOCK ALERTS</span></div>
        <div className="stat"><span className="num">{stats.moves}</span><span className="lbl">MOVEMENTS LOGGED</span></div>
      </div>
    </div>
  )
}
