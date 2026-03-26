describe('OIDC Auth Flow Integration (Issue #001)', () => {
  beforeEach(() => {
    cy.visit('/frontend/')
  })

  it('loads OIDC providers and displays LINE login button', () => {
    cy.contains('Login with LINE').should('exist')
  })

  it('shows error when PocketBase is unreachable', () => {
    cy.intercept('GET', 'http://127.0.0.1:8090/api/collections/users/auth-methods', {
      statusCode: 500,
      body: { message: 'Connection refused' }
    })
    cy.visit('/frontend/')
    cy.contains('Failed to fetch').should('exist')
  })

  it('stores oauth credentials on button click', () => {
    cy.contains('Login with LINE').click()
    cy.window().then((win) => {
      expect(win.localStorage.getItem('oauth_state')).to.exist
      expect(win.localStorage.getItem('oauth_code_verifier')).to.exist
      expect(win.localStorage.getItem('oauth_provider')).to.equal('oidc')
    })
  })

  it('redirects to OIDC authorization URL', () => {
    cy.contains('Login with LINE').click()
    cy.url().should('include', 'http://localhost:8090/api/oauth2-auth/oidc/')
  })

  it('handles callback with error parameter', () => {
    cy.visit('/frontend/callback.html?error=ACCESS_DENIED&error_description=user+denied&state=test')
    cy.contains('Login Failed').should('exist')
    cy.contains('user denied').should('exist')
  })

  it('shows missing parameters error on callback without code', () => {
    cy.visit('/frontend/callback.html?state=test-state')
    cy.contains('Missing Parameters').should('exist')
  })
})