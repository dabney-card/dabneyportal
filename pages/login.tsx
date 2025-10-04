import { useRouter } from "next/router";
import { useState } from "react";

export default function Login() {
  const r = useRouter();
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const nextPath = (r.query.next as string) || "/";

  async function onSubmit(e:any){
    e.preventDefault();
    const resp = await fetch("/api/login", {
      method:"POST",
      headers:{ "content-type":"application/json" },
      body: JSON.stringify({ email, password })
    });
    if(!resp.ok){ alert("Login failed"); return; }
    r.push(nextPath);
  }

  return (
    <form onSubmit={onSubmit} style={{maxWidth:360,margin:"40px auto",display:"grid",gap:8,fontFamily:"system-ui"}}>
      <h1>Vendor Login</h1>
      <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
      <input placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/>
      <button>Log in</button>
    </form>
  );
}
