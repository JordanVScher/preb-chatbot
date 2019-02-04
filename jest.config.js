module.exports = {
	verbose: true,
	testURL: 'http://localhost/',
	testPathIgnorePatterns: [
		'./__tests__/context.js',
		'./__tests__/question.js',
	],
	globals: {
		TEST: true,
	},
};
