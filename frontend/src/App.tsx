import { Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Landing } from "./pages/Landing";
import { Issue } from "./pages/Issue";
import { Verify } from "./pages/Verify";
import { VerifyToken } from "./pages/VerifyToken";
import { VerifyWallet } from "./pages/VerifyWallet";
import { Admin } from "./pages/Admin";

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/issue" element={<Issue />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/verify/wallet/:address" element={<VerifyWallet />} />
          <Route path="/verify/:tokenId" element={<VerifyToken />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
    </div>
  );
}
