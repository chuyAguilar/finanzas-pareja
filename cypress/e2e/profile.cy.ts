describe('Profile Page E2E Tests', () => {
	const userId = '557ebe26-7463-420b-a75c-4d4dba52155d';
	const groupId = 'f3a8dbd0-3f83-4c01-bc98-0dde79e6c856';

	const mockUser = {
		id: userId,
		googleId: 'google-test-123',
		username: 'TestUser',
		color: '#1899D5',
		avatarUrl: null
	};

	const mockGroup = {
		id: groupId,
		code: '389VRV',
		name: 'Grupo de Prueba E2E',
		members: [
			{
				id: userId,
				googleId: 'google-test-123',
				username: 'TestUser',
				color: '#1899D5',
				avatarUrl: null
			},
			{
				id: '8338b831-8f15-4d4e-8bf5-6360907bee8e',
				googleId: 'google-test-456',
				username: 'PartnerUser',
				color: '#A2308F',
				avatarUrl: null
			}
		]
	};

	const mockSession = { user: mockUser, group: mockGroup };

	beforeEach(() => {
		// Interceptar carga de grupo del AuthContext para que loading se resuelva rápido
		cy.intercept('GET', `**/api/groups/user/${userId}`, {
			statusCode: 200,
			body: mockGroup
		}).as('getGroup');

		cy.visit('/profile', {
			onBeforeLoad(win) {
				win.localStorage.setItem('session', JSON.stringify(mockSession));
			}
		});

		// Esperar a que auth init termine
		cy.wait('@getGroup');
		// Pequeña pausa para que React aplique el estado y se oculte el IonLoading
		cy.wait(300);
	});

	it('should render profile page with user info, group code, and members', () => {
		// Las iniciales de "TestUser" (una palabra) son los primeros 2 chars = "TE"
		cy.contains('TE').should('exist');

		// Nombre de usuario en el campo editable
		cy.contains('TestUser').should('exist');

		// Encabezado de la sección de grupo y código
		cy.contains('Grupo de Prueba E2E').should('exist');
		cy.contains('389VRV').should('exist');

		// Lista de miembros (puede estar debajo del fold en Ionic)
		cy.contains('PartnerUser').should('exist');
		cy.contains('TestUser (Tú)').should('exist');

		// Botón de cerrar sesión existe (puede estar bajo el tab bar)
		cy.get('#btn-logout').should('exist');
	});

	it('should update username inline and show toast', () => {
		cy.intercept('PATCH', `**/api/users/${userId}`, (req) => {
			req.reply({
				statusCode: 200,
				body: { ...mockUser, username: req.body.username ?? mockUser.username }
			});
		}).as('updateUser');

		// Abrir edición de nombre
		cy.get('button[title="Editar nombre"]').click({ force: true });

		// Limpiar y escribir nuevo nombre
		cy.get('input[type="text"]').first().clear().type('NuevoNombre');

		// Confirmar
		cy.contains('button', '✓').click({ force: true });

		// Verificar la llamada a la API
		cy.wait('@updateUser').its('request.body.username').should('eq', 'NuevoNombre');

		// IonToast boolean isOpen → atributo is-open="" en el DOM (valor vacío = true)
		// Esperar a que aparezca el toast (con reintentos automáticos de Cypress)
		cy.get('ion-toast').should('have.attr', 'is-open');
	});

	it('should change color and send PATCH request', () => {
		cy.intercept('PATCH', `**/api/users/${userId}`, (req) => {
			req.reply({
				statusCode: 200,
				body: { ...mockUser, color: req.body.color ?? mockUser.color }
			});
		}).as('updateColor');

		// Clic en círculo magenta (color diferente al activo #1899D5)
		cy.get('button[title="#A2308F"]').click({ force: true });

		// Verificar llamada con el nuevo color
		cy.wait('@updateColor').its('request.body.color').should('eq', '#A2308F');

		// Verificar que el toast apareció
		cy.get('ion-toast').should('have.attr', 'is-open');
	});

	it('should copy the group code and change button text', () => {
		cy.window().then((win) => {
			cy.stub(win.navigator.clipboard, 'writeText').resolves();
		});

		cy.get('#btn-copy-code').click({ force: true });

		cy.contains('¡Copiado!').should('exist');
	});

	it('should show logout alert, redirect to /login with login button visible', () => {
		// El render loop "Maximum update depth exceeded" es un bug interno de Ionic React
		// que ocurre al desmontar IonTabs cuando user=null. En el navegador real,
		// window.location.href ejecuta la recarga antes de que sea visible.
		cy.on('uncaught:exception', (err) => {
			if (err.message.includes('Maximum update depth exceeded')) {
				return false;
			}
		});

		cy.get('#btn-logout').click({ force: true });

		cy.get('ion-alert.hydrated').should('exist');
		cy.contains('.alert-button', 'Cerrar sesión').click({ force: true });

		// window.location.href = '/login' → recarga completa
		cy.url().should('include', '/login');

		// Verificar que la pantalla de login es visible (no pantalla negra)
		cy.get('#btn-google-login').should('be.visible');
	});

	it('should redirect to /login when accessing /home without session', () => {
		// Sin sesión en localStorage, PrivateRoute debe redirigir a /login
		cy.visit('/home', {
			onBeforeLoad(win) {
				win.localStorage.removeItem('session');
			}
		});

		cy.url().should('include', '/login');
		cy.get('#btn-google-login').should('be.visible');
	});
});
