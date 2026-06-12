import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Group } from '../types';
import * as authService from '../services/auth';
import * as apiService from '../services/api';

interface AuthContextType {
	user: User | null;
	group: Group | null;
	loading: boolean;
	login: () => Promise<authService.Session>;
	logout: () => Promise<void>;
	setGroup: React.Dispatch<React.SetStateAction<Group | null>>;
	setUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null);
	const [group, setGroup] = useState<Group | null>(null);
	const [loading, setLoading] = useState<boolean>(true);

	useEffect(() => {
		const init = async () => {
			await authService.initAuth();
			const session = authService.getSession();
			if (session) {
				setUser(session.user);
				try {
					const latestGroup = await apiService.getGroupByUser(session.user.id);
					setGroup(latestGroup);
					session.group = latestGroup;
					localStorage.setItem('session', JSON.stringify(session));
				} catch (err) {
					console.error('[AuthContext] Error al sincronizar grupo:', err);
					setGroup(session.group);
				}
			}
			setLoading(false);
		};
		init();
	}, []);

	const login = async () => {
		setLoading(true);
		try {
			const session = await authService.signInWithGoogle();
			setUser(session.user);
			setGroup(session.group);
			return session;
		} catch (err) {
			setLoading(false);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const logout = async () => {
		setLoading(true);
		try {
			await authService.signOut();
			setUser(null);
			setGroup(null);
		} finally {
			setLoading(false);
		}
	};

	const updateGroupState: React.Dispatch<React.SetStateAction<Group | null>> = (value) => {
		setGroup((prevGroup) => {
			const nextGroup = typeof value === 'function' ? value(prevGroup) : value;
			const session = authService.getSession();
			if (session) {
				session.group = nextGroup;
				localStorage.setItem('session', JSON.stringify(session));
			}
			return nextGroup;
		});
	};

	const updateUserState = (updatedUser: User) => {
		setUser(updatedUser);
		const session = authService.getSession();
		if (session) {
			session.user = updatedUser;
			localStorage.setItem('session', JSON.stringify(session));
		}
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				group,
				loading,
				login,
				logout,
				setGroup: updateGroupState,
				setUser: updateUserState
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth debe ser usado dentro de un AuthProvider');
	}
	return context;
};
