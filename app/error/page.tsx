export default function ErrorPage() {
  return (
    <div className="window" style={{ width: "300px", margin: "100px auto" }}>
      <div className="title-bar">
        <div className="title-bar-text">Error</div>
      </div>
      <div className="window-body">
        <p>Sorry, something went wrong</p>
        <div className="field-row" style={{ justifyContent: "flex-end" }}>
          <button>OK</button>
        </div>
      </div>
    </div>
  );
}
