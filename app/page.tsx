import React from 'react';

export default function Page() {
  return (
    <main style={{display:'flex',minHeight:'100vh',alignItems:'center',justifyContent:'center',fontFamily:'Inter, system-ui, sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <h1>TeamUP-AI</h1>
        <p>Minimal app entry — dev server should now start.</p>
      </div>
    </main>
  );
}
export { default } from "./(app)/page";
