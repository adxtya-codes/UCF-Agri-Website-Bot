// Simple test to verify error handling
console.log('🚀 Starting test...');

// Set up error handler FIRST
process.on('unhandledRejection', (reason) => {
    console.error('❌ Caught unhandled rejection:', reason.message);
    console.log('✅ Error handler is working!');
    process.exit(1);
});

// Simulate the error
setTimeout(() => {
    Promise.reject(new Error('Cannot read properties of null (reading \'1\')'));
}, 1000);

console.log('⏳ Waiting for error...');
