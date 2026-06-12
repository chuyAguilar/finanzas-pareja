import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IonLoading } from '@ionic/react';

interface PrivateRouteProps extends RouteProps {
	component?: React.ComponentType<any>;
	children?: React.ReactNode;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, render, component: Component, ...rest }) => {
	const { user, loading } = useAuth();

	return (
		<Route
			{...rest}
			render={(props) => {
				if (loading) {
					return <IonLoading isOpen={true} message="Cargando sesión..." />;
				}

				if (!user) {
					return (
						<Redirect
							to={{
								pathname: '/login',
								state: { from: props.location }
							}}
						/>
					);
				}

				if (children) {
					return typeof children === 'function' ? (children as any)(props) : children;
				}

				if (Component) {
					return <Component {...props} />;
				}

				if (render) {
					return render(props);
				}

				return null;
			}}
		/>
	);
};

export default PrivateRoute;
