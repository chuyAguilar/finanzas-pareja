describe('Transaction Navigation and Future Date Validation E2E', () => {
	// Date helpers in local time
	const todayLocal = (baseDate: Date) => {
		const yyyy = baseDate.getFullYear();
		const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
		const dd = String(baseDate.getDate()).padStart(2, '0');
		return `${yyyy}-${mm}-${dd}`;
	};

	const addDaysLocal = (dateStr: string, days: number) => {
		const [year, month, day] = dateStr.split('-').map(Number);
		const dateObj = new Date(year, month - 1, day);
		dateObj.setDate(dateObj.getDate() + days);
		const yyyy = dateObj.getFullYear();
		const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
		const dd = String(dateObj.getDate()).padStart(2, '0');
		return `${yyyy}-${mm}-${dd}`;
	};

	const formatHeader = (dateStr: string) => {
		const [year, month, day] = dateStr.split('-').map(Number);
		const dateObj = new Date(year, month - 1, day);
		const raw = dateObj.toLocaleDateString('es-ES', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
		// The DOM text is raw lowercase (styled visually via capitalize CSS rule)
		return raw;
	};

	let today = '';

	beforeEach(() => {
		// Mock system clock to a unique date in the past (e.g., May 2026) to ensure no transaction history overlap
		// and to ensure all transactions created in the E2E test are allowed by the backend (not future relative to server time)
		const randomDay = Math.floor(Math.random() * 20) + 10; // Day between 10 and 29
		const mockDate = new Date(2026, 4, randomDay); // May is month 4 (0-indexed)
		today = todayLocal(mockDate);

		cy.clock(mockDate.getTime(), ['Date']);

		// Mock local storage session before visiting the home page
		cy.visit('/home', {
			onBeforeLoad(win) {
				win.localStorage.setItem('session', JSON.stringify({
					user: {
						id: '557ebe26-7463-420b-a75c-4d4dba52155d',
						googleId: 'google-test-123',
						username: 'TestUserUpdated',
						color: '#FF5733',
						avatarUrl: 'https://example.com/avatar.png'
					},
					group: {
						id: 'f3a8dbd0-3f83-4c01-bc98-0dde79e6c856',
						code: '389VRV',
						name: 'Grupo de Prueba E2E',
						members: [
							{
								id: '557ebe26-7463-420b-a75c-4d4dba52155d',
								googleId: 'google-test-123',
								username: 'TestUserUpdated',
								color: '#FF5733',
								avatarUrl: 'https://example.com/avatar.png'
							},
							{
								id: '8338b831-8f15-4d4e-8bf5-6360907bee8e',
								googleId: 'google-test-456',
								username: 'PartnerUser',
								color: '#1899D5',
								avatarUrl: null
							}
						]
					}
				}));
			}
		});
	});

	it('should verify date navigation, disabled forward arrow on today, recording in past, and future block', () => {
		// 1. Verify that on today's page, the forward arrow (→) is disabled
		cy.get('div.bg-\\[\\#4BA32A\\] button').eq(1).should('be.disabled');

		// 2. Navigate back 3 days and verify header & URL updates
		let currentDate = today;
		for (let i = 0; i < 3; i++) {
			currentDate = addDaysLocal(currentDate, -1);
			cy.get('div.bg-\\[\\#4BA32A\\] button').eq(0).click();
			cy.url().should('include', `?date=${currentDate}`);
			cy.contains('h2', formatHeader(currentDate)).should('be.visible');
		}

		const pastDate = currentDate;

		// 3. Register an income on this past date
		cy.get('ion-fab-button').click();
		cy.contains('button', 'Ingreso').click();

		// Check navigation to new transaction page with date query param
		cy.url().should('include', `/transaction/new?type=income&date=${pastDate}`);

		// Form fill
		cy.get('input[type="number"]').type('150');
		cy.get('textarea').type('Ingreso en dia pasado E2E');

		// Intercept POST request
		cy.intercept('POST', '**/api/transactions').as('createIncome');
		cy.get('button[type="submit"]').click();

		// Wait for save & check response
		cy.wait('@createIncome').its('response.statusCode').should('eq', 201);

		// Verify redirects back to home with the past date
		cy.url().should('include', `/home?date=${pastDate}`);

		// Check updated balance on this past day specifically targeting the h3 balance card
		cy.get('h3').contains('$150.00').should('be.visible');
		cy.contains('Ingreso en dia pasado E2E').should('exist');
		cy.contains('+$150.00').should('exist');

		// 4. Navigate back to today and verify that the past transaction does not appear here
		cy.get('div.bg-\\[\\#4BA32A\\] button').eq(1).click(); // past + 1
		cy.get('div.bg-\\[\\#4BA32A\\] button').eq(1).click(); // past + 2
		cy.get('div.bg-\\[\\#4BA32A\\] button').eq(1).click(); // today

		cy.url().should('include', `?date=${today}`);
		cy.contains('Ingreso en dia pasado E2E').should('not.exist');
	});

	it('should verify that future transactions are blocked by the backend API', () => {
		// Use a fixed date far in the future relative to the server time (June 2026) to trigger the backend block
		const futureDate = '2026-12-25';

		cy.request({
			method: 'POST',
			url: 'http://localhost:3000/api/transactions',
			failOnStatusCode: false,
			body: {
				groupId: 'f3a8dbd0-3f83-4c01-bc98-0dde79e6c856',
				userId: '557ebe26-7463-420b-a75c-4d4dba52155d',
				type: 'income',
				amount: 200,
				date: futureDate
			}
		}).then((response) => {
			expect(response.status).to.eq(400);
			expect(response.body.error).to.contain('No puedes registrar movimientos en fechas futuras');
		});
	});
});
