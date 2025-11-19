// Simplified test version to debug
export default function App() {
  return (
    <div style={{ background: '#0b0e14', color: '#e6edf3', minHeight: '100vh', padding: '2rem' }}>
      <h1 style={{ color: '#3b82f6', fontSize: '2rem' }}>Frontend Test</h1>
      <p>If you see this, React is working!</p>
      <div style={{ marginTop: '1rem', padding: '1rem', background: '#161b22', borderRadius: '0.5rem' }}>
        <p>Dark theme test</p>
        <button style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>
          Test Button
        </button>
      </div>
    </div>
  );
}
