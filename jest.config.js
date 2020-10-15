module.exports = {
	verbose: true,
	testURL: 'http://localhost/',
	testPathIgnorePatterns: [
		'./__tests__/context.js',
		'./__tests__/question.js',
		'./__tests__/dates.js',
	],
	globals: {
		TEST: true,
	},
};
