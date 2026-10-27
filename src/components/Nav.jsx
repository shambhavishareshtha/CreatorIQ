import { NavLink } from 'react-router-dom';
import { Activity, AudioLines, CalendarDays, FlaskConical, LayoutDashboard, Settings, Sparkles, WandSparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
const items = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/analytics', label: 'Analytics', icon: Activity },
  { to: '/dna', label: 'Creator DNA', icon: AudioLines },
  { to: '/hooks', label: 'Hook Studio', icon: WandSparkles },
  { to: '/planner', label: 'Content Planner', icon: CalendarDays },
  { to: '/lab', label: 'Creator Lab', icon: FlaskConical },
];
export default function Nav() { const{user}=useAuth();return <aside className="sidebar"><a href="/" className="brand"><span className="brand-mark"><Sparkles size={18}/></span><span>creator<span className="brand-strong">IQ</span></span></a><div className="nav-caption">YOUR STUDIO</div><nav>{items.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}><Icon size={17} strokeWidth={1.8}/><span>{label}</span>{label === 'Hook Studio' && <span className="nav-new">NEW</span>}</NavLink>)}</nav><div className="sidebar-bottom"><NavLink to="/settings" className={({isActive})=>`nav-item ${isActive?'active':''}`}><Settings size={17}/><span>Settings</span></NavLink><div className="profile-chip"><div className="avatar">{(user?.email?.[0]||'C').toUpperCase()}</div><div><strong>{user?.email}</strong><small>Creator account</small></div><span className="more">···</span></div></div></aside> }
