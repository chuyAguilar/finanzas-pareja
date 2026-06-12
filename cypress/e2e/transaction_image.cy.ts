describe('Transaction Attachment E2E', () => {
	const todayLocal = (baseDate: Date) => {
		const yyyy = baseDate.getFullYear();
		const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
		const dd = String(baseDate.getDate()).padStart(2, '0');
		return `${yyyy}-${mm}-${dd}`;
	};

	let today = '';

	beforeEach(() => {
		const mockDate = new Date(2026, 4, 15); // May 15, 2026
		today = todayLocal(mockDate);

		cy.clock(mockDate.getTime(), ['Date']);

		// Mock session storage
		cy.visit('/home', {
			onBeforeLoad(win) {
				win.localStorage.setItem('session', JSON.stringify({
					user: {
						id: '557ebe26-7463-420b-a75c-4d4dba52155d',
						googleId: 'google-test-123',
						username: 'TestUserImage',
						color: '#4BA32A',
						avatarUrl: null
					},
					group: {
						id: 'f3a8dbd0-3f83-4c01-bc98-0dde79e6c856',
						code: 'IMAG69',
						name: 'Grupo de Imagen E2E',
						members: [
							{
								id: '557ebe26-7463-420b-a75c-4d4dba52155d',
								googleId: 'google-test-123',
								username: 'TestUserImage',
								color: '#4BA32A',
								avatarUrl: null
							}
						]
					}
				}));
			}
		});
	});

	it('should allow attaching an image, resizing, previewing, submitting, displaying thumbnail, and opening in full view modal', () => {
		// 1. Navigate to new transaction form
		cy.get('ion-fab-button').click();
		cy.contains('button', 'Ingreso').click();
		cy.url().should('include', `/transaction/new?type=income&date=${today}`);

		// 2. Fill amount and description
		cy.get('input[type="number"]').type('125');
		cy.get('textarea').type('Transacción con Imagen E2E');

		// 3. Attach a mock image file (1x1 transparent PNG)
		const mockPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
		cy.get('input[type="file"]').selectFile({
			contents: Cypress.Buffer.from(mockPngBase64, 'base64'),
			fileName: 'test-image.png',
			mimeType: 'image/png'
		}, { force: true });

		// 4. Verify preview is rendered
		cy.get('img[alt="Vista previa adjunto"]').should('be.visible');
		cy.get('button[title="Quitar imagen"]').should('be.visible');

		// Intercept POST request to verify payload has imageUrl base64
		cy.intercept('POST', '**/api/transactions').as('createTransaction');

		// 5. Submit form
		cy.get('button[type="submit"]').click();

		// 6. Verify payload contains imageUrl that starts with data:image/jpeg;base64, (resizer outputs jpeg)
		cy.wait('@createTransaction').then((interception) => {
			expect(interception.response?.statusCode).to.eq(201);
			expect(interception.request.body.imageUrl).to.match(/^data:image\/jpeg;base64,/);
		});

		// 7. Verify redirection and thumbnail presence on Home
		cy.url().should('include', `/home?date=${today}`);
		cy.contains('Transacción con Imagen E2E').should('exist');
		cy.contains('+$125.00').should('exist');

		// Verify thumbnail button is present
		cy.get('button[title="Ver imagen adjunta"]').should('exist');

		// 8. Open image full view modal
		cy.get('button[title="Ver imagen adjunta"]').click({ force: true });

		// Verify IonModal is visible and image inside it
		cy.get('ion-modal').should('be.visible');
		cy.get('img[alt="Imagen adjunta completa"]').should('be.visible');

		// 9. Close modal
		cy.get('ion-modal button').contains('Cerrar').first().click();
		cy.get('ion-modal').should('not.be.visible');
	});
});
