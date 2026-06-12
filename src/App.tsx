import { Redirect, Route, useLocation } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { homeOutline, calendarOutline, personOutline } from 'ionicons/icons';

import LoginPage from './pages/LoginPage';
import PairingPage from './pages/PairingPage';
import HomePage from './pages/HomePage';
import CalendarPage from './pages/CalendarPage';
import TransactionFormPage from './pages/TransactionFormPage';
import ProfilePage from './pages/ProfilePage';

import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Ionic Dark Mode */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

/* Tailwind CSS */
import './theme/tailwind.css';

setupIonicReact();

const TabBar: React.FC = () => {
	const location = useLocation();
	const showTabs = ['/home', '/calendar', '/profile'].includes(location.pathname);

	if (!showTabs) return null;

	return (
		<IonTabBar slot="bottom" className="bg-[#17597F] border-t border-white/10" style={{ '--background': '#17597F', '--border-color': 'rgba(255,255,255,0.1)' }}>
			<IonTabButton tab="home" href="/home" style={{ '--color-selected': '#1899D5', '--color': 'rgb(148, 163, 184)' }}>
				<IonIcon icon={homeOutline} />
				<IonLabel>Inicio</IonLabel>
			</IonTabButton>
			<IonTabButton tab="calendar" href="/calendar" style={{ '--color-selected': '#1899D5', '--color': 'rgb(148, 163, 184)' }}>
				<IonIcon icon={calendarOutline} />
				<IonLabel>Calendario</IonLabel>
			</IonTabButton>
			<IonTabButton tab="profile" href="/profile" style={{ '--color-selected': '#1899D5', '--color': 'rgb(148, 163, 184)' }}>
				<IonIcon icon={personOutline} />
				<IonLabel>Perfil</IonLabel>
			</IonTabButton>
		</IonTabBar>
	);
};

const App: React.FC = () => (
	<AuthProvider>
		<IonApp>
			<IonReactRouter>
				<IonTabs>
					<IonRouterOutlet>
						<Route exact path="/login">
							<LoginPage />
						</Route>
						<PrivateRoute exact path="/pairing">
							<PairingPage />
						</PrivateRoute>
						<PrivateRoute exact path="/home">
							<HomePage />
						</PrivateRoute>
						<PrivateRoute exact path="/calendar">
							<CalendarPage />
						</PrivateRoute>
						<PrivateRoute exact path="/transaction/new">
							<TransactionFormPage />
						</PrivateRoute>
						<PrivateRoute exact path="/profile">
							<ProfilePage />
						</PrivateRoute>
						<Route exact path="/">
							<Redirect to="/login" />
						</Route>
					</IonRouterOutlet>
					<TabBar />
				</IonTabs>
			</IonReactRouter>
		</IonApp>
	</AuthProvider>
);

export default App;
