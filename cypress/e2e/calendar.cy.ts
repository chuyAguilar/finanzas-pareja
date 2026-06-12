describe('Calendar Page E2E Tests', () => {
	const mockSession = {
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
				}
			]
		}
	};

	beforeEach(() => {
		// Mock date to July 15, 2026 (month index 6)
		const mockDate = new Date(2026, 6, 15);
		cy.clock(mockDate.getTime(), ['Date']);

		// Intercept the monthly summary request to provide mock data
		cy.intercept('GET', '**/api/transactions/summary*', {
			statusCode: 200,
			body: [
				{ date: '2026-07-10', income: 1500, expense: 500, balance: 1000 },
				{ date: '2026-07-20', income: 0, expense: 300, balance: -300 }
			]
		}).as('getMonthSummary');

		// Set the active session and visit /calendar
		cy.visit('/calendar', {
			onBeforeLoad(win) {
				win.localStorage.setItem('session', JSON.stringify(mockSession));
			}
		});
	});

	it('should verify calendar page layout and headers', () => {
		// Verify Header title in Spanish
		cy.get('h2').contains('Julio 2026').should('be.visible');

		// Verify week day headers LUN-DOM
		cy.contains('Lun').should('be.visible');
		cy.contains('Dom').should('be.visible');

		// Verify today (July 15) highlight circle exists
		cy.contains('span', '15')
			.should('have.class', 'bg-[#1899D5]')
			.and('have.class', 'text-white');
	});

	it('should navigate months and return using Hoy button', () => {
		// Intercept other month calls to prevent actual API errors or return empty
		cy.intercept('GET', '**/api/transactions/summary*month=2026-06', { statusCode: 200, body: [] }).as('getJuneSummary');
		cy.intercept('GET', '**/api/transactions/summary*month=2026-08', { statusCode: 200, body: [] }).as('getAugustSummary');

		// Click back button (←) to June (index 0)
		cy.get('div.bg-\\[\\#4BA32A\\] button').eq(0).click();
		cy.get('h2').contains('Junio 2026').should('be.visible');

		// Click Hoy button (index 1)
		cy.get('div.bg-\\[\\#4BA32A\\] button').eq(1).click();
		cy.get('h2').contains('Julio 2026').should('be.visible');

		// Click forward button (→) to August (index 2)
		cy.get('div.bg-\\[\\#4BA32A\\] button').eq(2).click();
		cy.get('h2').contains('Agosto 2026').should('be.visible');
	});

	it('should render transaction summaries inside cells with correct abbreviations', () => {
		// Wait for mock summary request
		cy.wait('@getMonthSummary');

		// Day 10 summary: balance $1k, income +$1.5k, expense -$500
		cy.contains('span', /^10$/).closest('.rounded-xl').within(() => {
			cy.contains('$1k').should('be.visible');
			cy.contains('+$1.5k').should('be.visible');
			cy.contains('-$500').should('be.visible');
		});

		// Day 20 summary: balance -$300, expense -$300 (no income displayed)
		cy.contains('span', /^20$/).closest('.rounded-xl').within(() => {
			cy.contains('-$300').should('be.visible');
			cy.contains('+$').should('not.exist');
		});
	});

	it('should navigate to home daily summary on day click', () => {
		// Click on day 10 cell
		cy.contains('span', /^10$/).closest('.rounded-xl').click({ force: true });

		// Verify redirection to home with query parameter
		cy.url().should('include', '/home?date=2026-07-10');
	});
});
