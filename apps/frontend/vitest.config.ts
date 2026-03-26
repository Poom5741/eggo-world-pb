export default {
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    include: ['**/__tests__/*.test.{tsx,ts}'],
  },
}