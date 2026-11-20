export default function DbSetup({ message }) {
  return (
    <div className="wrap">
      <h1>One setup step left</h1>
      <div className="card">
        <p>Seqa's database is not set up yet. Run the file <code>supabase/schema.sql</code> from the repo in Supabase, under SQL Editor, then refresh this page.</p>
        <p className="small">Details: {message}</p>
      </div>
    </div>
  );
}
