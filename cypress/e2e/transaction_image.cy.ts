describe('Transaction Images E2E', () => {
	const todayLocal = (baseDate: Date) => {
		const yyyy = baseDate.getFullYear();
		const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
		const dd = String(baseDate.getDate()).padStart(2, '0');
		return `${yyyy}-${mm}-${dd}`;
	};

	let today = '';

	beforeEach(() => {
		const randomDay = Math.floor(Math.random() * 20) + 10;
		const mockDate = new Date(2026, 4, randomDay);
		today = todayLocal(mockDate);

		cy.clock(mockDate.getTime(), ['Date']);

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
							}
						]
					}
				}));
			}
		});
	});

	it('should create a transaction with an attached image, display a thumbnail, and open/close modal', () => {
		// Navigate to transaction form
		cy.get('ion-fab-button').click();
		cy.contains('button', 'Ingreso').click();

		cy.url().should('include', `/transaction/new?type=income&date=${today}`);

		// Fill fields
		cy.get('input[type="number"]').type('250');
		cy.get('textarea').type('Ingreso con imagen adjunta');

		// Verification: No preview should be visible initially
		cy.get('img[alt="Vista previa adjunto"]').should('not.exist');

		// Attach mock image file (1x1 transparent PNG)
		const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
		cy.get('input[type="file"]').selectFile({
			contents: Cypress.Buffer.from(base64Image, 'base64'),
			fileName: 'test-receipt.png',
			mimeType: 'image/png'
		}, { force: true });

		// Verify preview image is now visible
		cy.get('img[alt="Vista previa adjunto"]').should('be.visible');

		// Verify remove image button works
		cy.get('button[title="Quitar imagen"]').click();
		cy.get('img[alt="Vista previa adjunto"]').should('not.exist');

		// Re-attach the image for saving
		cy.get('input[type="file"]').selectFile({
			contents: Cypress.Buffer.from(base64Image, 'base64'),
			fileName: 'test-receipt.png',
			mimeType: 'image/png'
		}, { force: true });
		cy.get('img[alt="Vista previa adjunto"]').should('be.visible');

		// Intercept POST request
		cy.intercept('POST', '**/api/transactions').as('createTransaction');

		// Submit form
		cy.get('button[type="submit"]').click();

		// Wait and verify transaction payload contains imageUrl base64 prefix
		cy.wait('@createTransaction').then((interception) => {
			expect(interception.response?.statusCode).to.eq(201);
			expect(interception.request.body.imageUrl).to.not.be.undefined;
			expect(interception.request.body.imageUrl).to.contain('data:image/jpeg;base64,');
		});

		// Verify we are back to Home Page
		cy.url().should('include', `/home?date=${today}`);

		// Verify transaction is listed with amount and description
		cy.contains('Ingreso con imagen adjunta').should('exist');
		cy.contains('+$250.00').should('exist');

		// Verify the thumbnail button is displayed on the transaction list item
		cy.get('button.tx-thumbnail-btn').should('exist').and('have.descendants', 'img');

		// Modal initially closed
		cy.get('ion-modal#image-preview-modal').should('not.be.visible');

		// Click the thumbnail to open the modal
		cy.get('button.tx-thumbnail-btn').click({ force: true });

		// Verify modal is open and has full image inside
		cy.get('ion-modal#image-preview-modal').should('be.visible');
		cy.get('ion-modal#image-preview-modal img[alt="Imagen adjunta completa"]').should('be.visible');

		// Click close button inside modal
		cy.get('#btn-close-modal-bottom').click({ force: true });

		// Verify modal is closed
		cy.get('ion-modal#image-preview-modal').should('not.be.visible');
	});
});
