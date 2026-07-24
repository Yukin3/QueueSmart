import React from "react";
//component imports
import AuthPage from "./components/AuthPage";
import Layout from './components/Layout';
import { formatDate } from "./components/Shared";
import { initialHistory,  } from './data/mockData';
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
import {joinQueue as joinQueueApi, leaveQueue as leaveQueueApi, getQueue, } from "./api/queuesApi";



const HISTORY_KEY = 'queuesmart-user-history-v1';



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


function normalizeQueueEntry(entry) {
  return {
    id: entry.userId,
    entryId: entry.id,
    name: entry.userName,
    joinedAt: entry.joinedAt,
    priority: entry.priority,
    status: entry.status,
    type: entry.type,
    appointmentTime: entry.appointmentTime,
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
      let query = "";

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
      const servicesWithQueues = await Promise.all(
        data.map(async (service) => {
          try {
            const queueData = await getQueue(service.id); //fecth queue for serviceId


            //return service w/ queue entries
            return {
              ...service,
              queue: queueData.queue.map(normalizeQueueEntry),
            };
          } catch {
            //fallback to empty queue
            return { 
              ...service,
              queue: [],
            };
          }
        })
      );


      setServices(servicesWithQueues); //update service state w/ service+queue info

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


  //update queue for saved service state
  function updateServiceQueue(serviceId, queue) {
  setServices((current) =>
    current.map((service) =>
      service.id === serviceId
        ? {
            ...service,
            queue: queue.map(normalizeQueueEntry),
          }
        : service
    )
  );
}


  //add current user to queue
  async function joinQueue(serviceId) {
    try {
      const data = await joinQueueApi(serviceId, currentUserAccount); //handle API request
      updateServiceQueue(serviceId, data.queue)
    } catch (error) {
      window.alert(error,error || "Failed to join queue.") //handle error
    }
  }


  //remove current user from queue
 async function leaveQueue(serviceId) {
    try {
      const data = await leaveQueueApi(serviceId, currentUserAccount.id) //handle api request
      updateServiceQueue(serviceId, data.queue)

    const service = services.find((item) => item.id === serviceId);
    
    if (service) {
      setHistory((current) => [{ id: `hist-${crypto.randomUUID()}`, serviceName: service.name, date: formatDate(), outcome: 'Left' }, ...current]);
    }

    } catch (error) {
      window.alert(error,error || "Failed to leave queue.") //handle error

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
    ? getUserNotifications(services, currentUserAccount?.id).length
    : services.filter((service) => service.isOpen && (service.queue?.length || 0) >= 3).length;
 

  

  return (
    <Layout navItems={navItems} page={page} onPageChange={goTo} notifications={notifications} account={account} onLogout={handleLogout}>
      {isUser && page === 'user-dashboard' && <UserDashboard services={services} currentUser={currentUserAccount} onJoin={joinQueue} onLeave={leaveQueue} goTo={goTo} />}
      {isUser && page === 'join' && <JoinQueue services={services} currentUser={currentUserAccount} onJoin={joinQueue} onLeave={leaveQueue} />}
      {isUser && page === 'status' && <QueueStatus services={services} currentUser={currentUserAccount} onLeave={leaveQueue} />}
      {isUser && page === 'history' && <History history={history} />}
      {isAdmin && page === 'dashboard' && <Dashboard services={services} setServices={setServices} goTo={goTo} />}
      {isAdmin && page === 'services' && <ServiceManagement services={services} setServices={setServices}  currentUserAccount={currentUserAccount}/>}
      {isAdmin && page === 'queues' && <QueueManagement services={services} setServices={setServices} initialServiceId={selectedServiceId} />}
      {isAdmin && page === 'history' && <History history={history} />}
    </Layout>
  );
}
