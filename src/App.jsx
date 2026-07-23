import React from "react";
//component imports
import AuthPage from "./components/AuthPage";
import Layout from './components/Layout';
import { nowTime, formatDate } from "./components/Shared";
import { initialServices, initialHistory, currentUser } from './data/mockData';
//user screen imports
import UserDashboard from './user/UserDashboard';
import JoinQueue from './user/JoinQueue';
import QueueStatus from './user/QueueStatus';
import History from './user/History';
import { getUserNotifications } from './user/userQueue';
//admin screen imports
import Dashboard from "./admin/Dashboard";
import ServiceManagement from "./admin/ServiceManagement";
import QueueManagement from "./admin/QueueManagement";
//constant imports
import {USER_NAV_ITEMS, ADMIN_NAV_ITEMS, USER_PAGES,} from "./constants/navigation";
//api imports
import { getServices } from "./api/servicesApi";





const STORAGE_KEY = 'queuesmart-admin-services-v1';
const HISTORY_KEY = 'queuesmart-user-history-v1';


function loadServices() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialServices;
  } catch {
    return initialServices;
  }
}

function loadHistory() {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : initialHistory;
  } catch {
    return initialHistory;
  }
}



function normalizeService(service) {
  return {
    ...service,
    queue: service.queue || [],
  };
}



export default function App() {
  const [page, setPage] = React.useState('user-dashboard');
  const [selectedServiceId, setSelectedServiceId] = React.useState(null);
  const [services, setServices] = React.useState([]);
  const [history, setHistory] = React.useState(loadHistory);

  //user states
  const [loggedIn, setLoggedIn] = React.useState(() => {
    return localStorage.getItem("queuesmart-user") !== null;  
  }); 


  //TODO: fix user state in local storage for refresh
  const [currentUserAccount, setCurrentUserAccount] = React.useState(() => {
    const savedUser = localStorage.getItem("queuesmart-user"); 
    return savedUser ? JSON.parse(savedUser) : null;
});




  React.useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);


React.useEffect(() => {
  async function loadBackendServices() {
    if (!currentUserAccount) return;

    try {
      let query = "";''

      if (currentUserAccount.role === "admin") {
        query = `?adminId=${encodeURIComponent(currentUserAccount.id)}`;
      } else {
        query = `?organizationId=${encodeURIComponent(
          currentUserAccount.organizationId
        )}&status=open`;
      }

      console.log("Loading services for:", currentUserAccount);
      console.log("Service query:", query);
      const data = await getServices(query);
      setServices(data.map(normalizeService)); //handle api fetch

    } catch (error) {
      console.error("Failed to load services from backend:", error); //handle fetch error

    }
  }

  loadBackendServices();
}, [currentUserAccount]);



  function goTo(nextPage, serviceId = null) {
    setSelectedServiceId(serviceId);
    setPage(nextPage);
  }




  //Login handler
  function handleLogin(user) {
    setCurrentUserAccount(user); //set active user state
    localStorage.setItem("queuesmart-user", JSON.stringify(user));  //store user in local storage
    setLoggedIn(true);


    //assign user roles
    if (user.role === 'admin') {
      setPage('dashboard');
    } 
    else {
      setPage('user-dashboard');
    }
  }



  function handleLogout(){
    localStorage.removeItem("queuesmart-user");
    setCurrentUserAccount(null); //remove active user state
    setLoggedIn(false);
    setServices([]);
    setPage("user-dashboard");
  }


  function joinQueue(serviceId) {
    setServices((current) => current.map((service) => {
      if (service.id !== serviceId || service.queue.some((user) => user.id === currentUser.id)) return service;
      return { ...service, queue: [...service.queue, { id: currentUser.id, name: currentUser.name, joinedAt: nowTime(), priority: 'medium', status: 'waiting' }] };
    }));
  }

  function leaveQueue(serviceId) {
    const service = services.find((item) => item.id === serviceId);
    setServices((current) => current.map((item) => item.id === serviceId ? { ...item, queue: item.queue.filter((user) => user.id !== currentUser.id) } : item));
    if (service) {
      setHistory((current) => [{ id: `hist-${crypto.randomUUID()}`, serviceName: service.name, date: formatDate(), outcome: 'Left' }, ...current]);
    }
  }
 
  if (!loggedIn) {
    return <AuthPage onLogin={handleLogin} />;
  }



  //Protect admin/user screens
  const isAdmin = currentUserAccount?.role === "admin";
  const isUser = currentUserAccount?.role === "user";

  
  //Sidebar / Nav bar
  const navItems = isAdmin ? ADMIN_NAV_ITEMS : USER_NAV_ITEMS;   //TODO: use user object in nav bar
  


  //User personalization
  const account = currentUserAccount
    ? { name: currentUserAccount.name, email: currentUserAccount.email }    //TODO: req. name/email for regist. users
    : { name: "Guest", email: "" };




  const isUserPage = USER_PAGES.includes(page);
  const notifications = isUserPage
    ? getUserNotifications(services, currentUser.id).length
    : services.filter((service) => service.isOpen && service.queue?.length >= 3).length;
 

  

  return (
    <Layout navItems={navItems} page={page} onPageChange={goTo} notifications={notifications} account={account} onLogout={handleLogout}>
      {isUser && page === 'user-dashboard' && <UserDashboard services={services} currentUser={currentUser} onJoin={joinQueue} onLeave={leaveQueue} goTo={goTo} />}
      {isUser && page === 'join' && <JoinQueue services={services} currentUser={currentUser} onJoin={joinQueue} onLeave={leaveQueue} />}
      {isUser && page === 'status' && <QueueStatus services={services} currentUser={currentUser} onLeave={leaveQueue} />}
      {isUser && page === 'history' && <History history={history} />}
      {isAdmin && page === 'dashboard' && <Dashboard services={services} setServices={setServices} goTo={goTo} />}
      {isAdmin && page === 'services' && <ServiceManagement services={services} setServices={setServices}  currentUserAccount={currentUserAccount}/>}
      {isAdmin && page === 'queues' && <QueueManagement services={services} setServices={setServices} initialServiceId={selectedServiceId} />}
      {isAdmin && page === 'history' && <History history={history} />}
    </Layout>
  );
}
